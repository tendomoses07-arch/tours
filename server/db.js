const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_PATH || './data/kola_tours.sqlite');
const dataDir = path.dirname(dbPath);
const backupDir = path.resolve(process.cwd(), process.env.BACKUP_DIR || './data/backups');
const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './data/uploads');
const publicUploadDir = path.resolve(process.cwd(), './data/public_uploads');

[dataDir, backupDir, uploadDir, publicUploadDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT DEFAULT '',
      nationality TEXT DEFAULT '',
      passport_number TEXT DEFAULT '',
      address TEXT DEFAULT '',
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer', -- 'customer' | 'admin'
      email_verified INTEGER DEFAULT 0,
      verification_token TEXT DEFAULT NULL,
      reset_token TEXT DEFAULT NULL,
      reset_expires TEXT DEFAULT NULL,
      status TEXT DEFAULT 'active', -- 'active' | 'suspended'
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS destinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      country TEXT NOT NULL,
      region TEXT NOT NULL, -- 'East Africa' | 'Rest of Africa' | 'Middle East' | 'Europe' | 'Asia'
      is_local INTEGER DEFAULT 0,
      tagline TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT NOT NULL,
      best_time TEXT DEFAULT 'Year-round',
      starting_from_usd REAL DEFAULT 450,
      featured INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tour_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      destination TEXT NOT NULL,
      country TEXT NOT NULL,
      category TEXT NOT NULL, -- 'Safari & Wildlife' | 'Beach & Island' | 'City & Luxury' | 'Cultural & Heritage' | 'Honeymoon & Romance' | 'Adventure'
      duration_days INTEGER NOT NULL,
      duration_label TEXT NOT NULL,
      price_per_person REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      min_participants INTEGER DEFAULT 1,
      max_participants INTEGER DEFAULT 16,
      description TEXT NOT NULL,
      itinerary_json TEXT NOT NULL, -- JSON array of { day, title, description, meals, accommodation }
      accommodation_details TEXT NOT NULL,
      transportation_details TEXT NOT NULL,
      activities_json TEXT NOT NULL, -- JSON array of strings
      included_json TEXT NOT NULL, -- JSON array of strings
      excluded_json TEXT NOT NULL, -- JSON array of strings
      gallery_json TEXT NOT NULL, -- JSON array of image URLs
      available_dates_json TEXT NOT NULL, -- JSON array of date range strings
      hero_image TEXT NOT NULL,
      featured INTEGER DEFAULT 1,
      is_archived INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS hotels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      destination TEXT NOT NULL,
      country TEXT NOT NULL,
      address TEXT NOT NULL,
      star_rating INTEGER DEFAULT 5,
      accommodation_type TEXT NOT NULL, -- 'Luxury Hotel' | 'Beach Resort' | 'Safari Lodge' | 'Boutique Hotel' | 'Serviced Apartment'
      description TEXT NOT NULL,
      facilities_json TEXT NOT NULL, -- JSON array
      room_types_json TEXT NOT NULL, -- JSON array of { name, capacity, price_per_night, perks }
      indicative_price_usd REAL NOT NULL,
      images_json TEXT NOT NULL,
      hero_image TEXT NOT NULL,
      featured INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS service_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_number TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_nationality TEXT DEFAULT '',
      service_type TEXT NOT NULL, -- 'flight' | 'hotel' | 'tour_fixed' | 'tour_custom' | 'visa_passport' | 'transfer' | 'consultation'
      title TEXT NOT NULL,
      related_entity_id INTEGER DEFAULT NULL,
      details_json TEXT NOT NULL, -- Structured form payload for the specific module
      status TEXT NOT NULL DEFAULT 'Submitted',
      -- Valid statuses:
      -- 'Submitted', 'Under Review', 'Awaiting Information', 'Quotation Sent',
      -- 'Awaiting Customer Approval', 'Payment Pending', 'Confirmed', 'Completed', 'Cancelled'
      admin_notes TEXT DEFAULT '',
      admin_response TEXT DEFAULT '',
      customer_feedback TEXT DEFAULT '',
      total_quoted_amount REAL DEFAULT 0,
      total_paid_amount REAL DEFAULT 0,
      currency TEXT DEFAULT 'USD',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_number TEXT UNIQUE NOT NULL,
      request_id INTEGER NOT NULL,
      user_id INTEGER,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      line_items_json TEXT NOT NULL, -- JSON array of { description, quantity, unit_price, total }
      itinerary_proposal_json TEXT DEFAULT '[]', -- Optional day-by-day proposal for custom itineraries or flight options
      subtotal REAL NOT NULL,
      taxes_fees REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      valid_until TEXT NOT NULL,
      payment_instructions TEXT NOT NULL,
      terms_notes TEXT DEFAULT '',
      customer_decision TEXT DEFAULT 'Pending', -- 'Pending' | 'Accepted' | 'Declined'
      customer_decision_notes TEXT DEFAULT '',
      decided_at TEXT DEFAULT NULL,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_number TEXT UNIQUE NOT NULL,
      request_id INTEGER NOT NULL,
      quotation_id INTEGER DEFAULT NULL,
      user_id INTEGER DEFAULT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      payment_method TEXT NOT NULL, -- 'MTN Mobile Money' | 'Airtel Money' | 'Bank Transfer' | 'Visa' | 'Mastercard' | 'Cash at Office'
      transaction_reference TEXT NOT NULL,
      payer_name TEXT NOT NULL,
      payer_phone_or_account TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Pending Verification', -- 'Pending Verification' | 'Verified' | 'Rejected'
      verified_by INTEGER DEFAULT NULL,
      verified_at TEXT DEFAULT NULL,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS uploaded_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      user_id INTEGER DEFAULT NULL,
      document_category TEXT NOT NULL, -- 'Passport Bio Page' | 'Photo' | 'Bank Statement' | 'Invitation Letter' | 'Flight Itinerary' | 'Supporting Document'
      original_filename TEXT NOT NULL,
      stored_filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      uploaded_by_role TEXT DEFAULT 'customer',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT NULL, -- NULL or specific user_id; for admin alerts is_admin_target = 1
      is_admin_target INTEGER DEFAULT 0,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info', -- 'info' | 'quotation' | 'status' | 'payment' | 'alert'
      related_request_ref TEXT DEFAULT '',
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_role_location TEXT NOT NULL,
      service_used TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      comment TEXT NOT NULL,
      avatar_url TEXT DEFAULT '',
      is_approved INTEGER DEFAULT 1,
      featured INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      cover_image TEXT NOT NULL,
      author TEXT DEFAULT 'Kola Travel Editorial Team',
      read_time TEXT DEFAULT '5 min read',
      published INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id INTEGER,
      actor_email TEXT,
      actor_role TEXT,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_ref TEXT DEFAULT '',
      details TEXT DEFAULT '',
      ip_address TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function seedInitialData() {
  // 1. Seed Settings
  const defaultSettings = {
    company_name: 'KOLA TOURS AND TRAVEL',
    company_tagline: 'Explore the World. We Make Your Journey Easier.',
    company_description: 'Premier full-service travel management company specializing in international & regional flights, curated safari & holiday packages, luxury hotel reservations, custom itineraries, and professional visa & passport documentation assistance.',
    whatsapp_number: 'WHATSAPP_NUMBER_PENDING_CONFIGURATION',
    whatsapp_placeholder_notice: 'Official WhatsApp Business line is configurable in Admin Settings. Click below to preview or update.',
    business_email: 'info@kolatours.com',
    support_phone: '+256 (0) 700 000 000 (Configurable in Admin)',
    office_address: 'Plot 24 Kampala Road, Boulevard Suites, Floor 3, Kampala, Uganda',
    office_hours: 'Monday – Saturday: 8:00 AM – 6:30 PM EAT | 24/7 Emergency Travel Desk',
    default_currency: 'USD',
    secondary_currency: 'UGX',
    ugx_exchange_rate: '3750',
    hero_headline: 'Explore the World. We Make Your Journey Easier.',
    hero_subheadline: 'From East African luxury safaris and Zanzibar beach escapes to international flight ticketing, hotel reservations, and stress-free visa & passport assistance — KOLA TOURS AND TRAVEL handles every detail with precision.',
    hero_banner_image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=85',
    facebook_url: 'https://facebook.com/kolatoursandtravel',
    instagram_url: 'https://instagram.com/kolatoursandtravel',
    twitter_url: 'https://x.com/kolatours',
    linkedin_url: 'https://linkedin.com/company/kola-tours-and-travel',
    google_maps_embed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.757396950318!2d32.5801!3d0.3136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x177dbc0f9d74b39b%3A0x4538903dd96b6fec!2sKampala%20Rd%2C%20Kampala%2C%20Uganda!5e0!3m2!1sen!2sug!4v1700000000000',
    payment_mtn_momo_instructions: 'MTN Mobile Money Merchant Code: [CONFIGURABLE IN ADMIN] — Registered Name: KOLA TOURS AND TRAVEL LTD. Always quote your Reference Number.',
    payment_airtel_money_instructions: 'Airtel Money Paybill: [CONFIGURABLE IN ADMIN] — Registered Name: KOLA TOURS AND TRAVEL LTD.',
    payment_bank_instructions: 'Stanbic Bank Uganda / Centenary Bank (USD & UGX Accounts provided on official Quotation PDF/View).',
    payment_card_instructions: 'Visa & Mastercard accepted via secure invoice payment link or POS terminal at our Kampala office.'
  };

  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [k, v] of Object.entries(defaultSettings)) {
    insertSetting.run(k, String(v));
  }

  // 2. Seed Admin & Demo Customer Accounts
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@kolatours.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@KolaTours2026!';
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!existingAdmin) {
    const hash = bcrypt.hashSync(adminPassword, 10);
    db.prepare(`
      INSERT INTO users (full_name, email, phone, nationality, role, email_verified, password_hash)
      VALUES (?, ?, ?, ?, 'admin', 1, ?)
    `).run(process.env.ADMIN_NAME || 'Kola Tours Administrator', adminEmail, '+256 772 100 200', 'Ugandan', hash);
  }

  const demoCustomerEmail = 'grace.nakato@example.com';
  const existingCustomer = db.prepare('SELECT id FROM users WHERE email = ?').get(demoCustomerEmail);
  let demoCustomerId = existingCustomer ? existingCustomer.id : null;
  if (!existingCustomer) {
    const custHash = bcrypt.hashSync('Customer@2026!', 10);
    const info = db.prepare(`
      INSERT INTO users (full_name, email, phone, nationality, passport_number, address, role, email_verified, password_hash)
      VALUES (?, ?, ?, ?, ?, ?, 'customer', 1, ?)
    `).run('Grace Nakato', demoCustomerEmail, '+256 775 432 198', 'Ugandan', 'B0948211', 'Kololo Terrace, Kampala, Uganda', custHash);
    demoCustomerId = Number(info.lastInsertRowid);
  }

  // 3. Seed Destinations (if empty)
  const destCount = db.prepare('SELECT COUNT(*) as c FROM destinations').get().c;
  if (destCount === 0) {
    const destinations = [
      {
        name: 'Dubai',
        slug: 'dubai-uae',
        country: 'United Arab Emirates',
        region: 'Middle East',
        is_local: 0,
        tagline: 'Futuristic skylines, luxury shopping & Arabian desert safaris',
        description: 'Experience world-renowned architecture from the Burj Khalifa to Palm Jumeirah, evening dhow cruises on Dubai Marina, thrilling desert dune bashing, and tax-free designer shopping.',
        image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80',
        best_time: 'October – April',
        starting_from_usd: 890,
        featured: 1
      },
      {
        name: 'Zanzibar',
        slug: 'zanzibar-tanzania',
        country: 'Tanzania',
        region: 'East Africa',
        is_local: 1,
        tagline: 'Turquoise Indian Ocean beaches & historic Stone Town spice trails',
        description: 'Unwind on powder-white sands in Nungwi and Paje, sail on traditional wooden dhows at sunset, snorkel Mnemba Atoll coral reefs, and explore UNESCO-listed Stone Town.',
        image_url: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1000&q=80',
        best_time: 'June – October, Dec – Feb',
        starting_from_usd: 620,
        featured: 1
      },
      {
        name: 'Nairobi & Maasai Mara',
        slug: 'nairobi-kenya',
        country: 'Kenya',
        region: 'East Africa',
        is_local: 1,
        tagline: 'Vibrant safari capital & gateway to the Great Migration',
        description: 'Combine cosmopolitan dining and the Giraffe Manor experience in Nairobi with unforgettable game drives across the Maasai Mara plains teeming with the Big Five.',
        image_url: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1000&q=80',
        best_time: 'July – October, Jan – Mar',
        starting_from_usd: 550,
        featured: 1
      },
      {
        name: 'Mombasa & Diani Coast',
        slug: 'mombasa-kenya',
        country: 'Kenya',
        region: 'East Africa',
        is_local: 1,
        tagline: 'Swahili coastal heritage, palm-fringed resorts & marine parks',
        description: 'Discover Fort Jesus, Old Town Mombasa, and the award-winning Diani Beach shoreline with luxury all-inclusive oceanfront resorts and glass-bottom boat excursions.',
        image_url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1000&q=80',
        best_time: 'Year-round',
        starting_from_usd: 490,
        featured: 1
      },
      {
        name: 'Kigali & Volcanoes',
        slug: 'kigali-rwanda',
        country: 'Rwanda',
        region: 'East Africa',
        is_local: 1,
        tagline: 'Africa’s cleanest capital, misty hills & mountain gorilla trekking',
        description: 'Explore Kigali’s thriving art and specialty coffee scene before ascending to Volcanoes National Park for intimate encounters with endangered mountain gorillas and golden monkeys.',
        image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80',
        best_time: 'June – September, Dec – Feb',
        starting_from_usd: 740,
        featured: 1
      },
      {
        name: 'Cape Town',
        slug: 'cape-town-south-africa',
        country: 'South Africa',
        region: 'Rest of Africa',
        is_local: 0,
        tagline: 'Table Mountain panoramas, Cape Winelands & Atlantic coastlines',
        description: 'Ride the rotating cableway up Table Mountain, tour Stellenbosch vineyards, visit the penguins at Boulders Beach, and enjoy world-class dining at the V&A Waterfront.',
        image_url: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1000&q=80',
        best_time: 'November – April',
        starting_from_usd: 1120,
        featured: 1
      },
      {
        name: 'London',
        slug: 'london-uk',
        country: 'United Kingdom',
        region: 'Europe',
        is_local: 0,
        tagline: 'Royal heritage, West End theatre & iconic Thames landmarks',
        description: 'Experience Buckingham Palace, Tower Bridge, the British Museum, luxury shopping in Mayfair and Knightsbridge, and seamless rail connections across Great Britain.',
        image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1000&q=80',
        best_time: 'May – September',
        starting_from_usd: 1450,
        featured: 1
      },
      {
        name: 'Paris',
        slug: 'paris-france',
        country: 'France',
        region: 'Europe',
        is_local: 0,
        tagline: 'Haute couture, Seine river romance & timeless gastronomy',
        description: 'Marvel at the Eiffel Tower, the Louvre, Montmartre, and Versailles with curated boutique stays, private museum tours, and Schengen travel support.',
        image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1000&q=80',
        best_time: 'April – October',
        starting_from_usd: 1490,
        featured: 1
      },
      {
        name: 'Istanbul',
        slug: 'istanbul-turkey',
        country: 'Türkiye',
        region: 'Europe',
        is_local: 0,
        tagline: 'Where East meets West across the historic Bosphorus Strait',
        description: 'Wander through Hagia Sophia, the Blue Mosque, and the Grand Bazaar, cruise the Bosphorus between two continents, and add a magical Cappadocia hot-air balloon extension.',
        image_url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1000&q=80',
        best_time: 'April – June, Sept – Nov',
        starting_from_usd: 980,
        featured: 1
      },
      {
        name: 'Bwindi & Queen Elizabeth Park',
        slug: 'bwindi-uganda',
        country: 'Uganda',
        region: 'East Africa',
        is_local: 1,
        tagline: 'The Pearl of Africa’s ancient rainforests, gorillas & Kazinga Channel',
        description: 'Track habituated mountain gorilla families in Bwindi Impenetrable Forest, spot tree-climbing lions in Ishasha, and cruise the hippo-filled Kazinga Channel.',
        image_url: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1000&q=80',
        best_time: 'June – September, Dec – Feb',
        starting_from_usd: 1250,
        featured: 1
      }
    ];

    const insertDest = db.prepare(`
      INSERT INTO destinations (name, slug, country, region, is_local, tagline, description, image_url, best_time, starting_from_usd, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const d of destinations) {
      insertDest.run(d.name, d.slug, d.country, d.region, d.is_local, d.tagline, d.description, d.image_url, d.best_time, d.starting_from_usd, d.featured);
    }
  }

  // 4. Seed Tour Packages
  const pkgCount = db.prepare('SELECT COUNT(*) as c FROM tour_packages').get().c;
  if (pkgCount === 0) {
    const packages = [
      {
        title: 'Dubai Royal Sands & Skyline Escape',
        slug: 'dubai-royal-sands-skyline-escape',
        destination: 'Dubai',
        country: 'United Arab Emirates',
        category: 'City & Luxury',
        duration_days: 6,
        duration_label: '6 Days / 5 Nights',
        price_per_person: 1180,
        min_participants: 2,
        max_participants: 20,
        description: 'Experience the best of Dubai with 5-star Downtown or Marina accommodation, VIP Burj Khalifa 124th/125th floor access, a luxury Marina sunset yacht dinner cruise, Arabian desert 4x4 safari with BBQ camp entertainment, and Miracle Garden & Global Village tours.',
        itinerary_json: JSON.stringify([
          { day: 1, title: 'Arrival in Dubai & VIP Chauffeur Transfer', description: 'Meet & greet at Dubai International Airport (DXB), private transfer to your 5-star hotel, and evening at leisure along Dubai Marina.', meals: 'Welcome Refreshments', accommodation: 'JW Marriott Marquis / Address Dubai Marina (or similar)' },
          { day: 2, title: 'Modern Dubai & Burj Khalifa At The Top', description: 'Guided tour of Palm Jumeirah, Atlantis Pointe photo stop, Dubai Mall aquarium exterior, and sunset entry to Burj Khalifa Observation Deck.', meals: 'Breakfast', accommodation: 'JW Marriott Marquis / Address Dubai Marina' },
          { day: 3, title: 'Arabian Desert Safari & Bedouin Evening', description: 'Morning leisure or shopping; afternoon 4x4 Lahbab red-dune safari, camel ride, sunset photography, and gourmet BBQ dinner with Tanoura & fire shows.', meals: 'Breakfast, BBQ Dinner', accommodation: 'JW Marriott Marquis / Address Dubai Marina' },
          { day: 4, title: 'Old Dubai Creek, Gold Souk & Luxury Marina Yacht Dinner', description: 'Explore Al Fahidi Historic District, cross Dubai Creek by traditional Abra boat to the Spice & Gold Souks, followed by an evening 5-star Marina Dhow Cruise.', meals: 'Breakfast, Buffet Dinner', accommodation: 'JW Marriott Marquis / Address Dubai Marina' },
          { day: 5, title: 'Abu Dhabi Grand Mosque & Louvre Day Excursion (Optional) or Leisure', description: 'Full day free for Dubai Mall shopping or optional excursion to Sheikh Zayed Grand Mosque and Yas Island in Abu Dhabi.', meals: 'Breakfast', accommodation: 'JW Marriott Marquis / Address Dubai Marina' },
          { day: 6, title: 'Departure Transfer to DXB Airport', description: 'Check-out after breakfast and private transfer to Dubai International Airport for your return flight.', meals: 'Breakfast', accommodation: 'Departure' }
        ]),
        accommodation_details: '5 Nights in a 4-Star Superior or 5-Star Hotel in Downtown Dubai or Dubai Marina with daily international buffet breakfast.',
        transportation_details: 'Private air-conditioned SUV/executive coach for airport transfers and touring; Toyota Land Cruiser 4x4 for Desert Safari.',
        activities_json: JSON.stringify(['Burj Khalifa 124th Floor Ticket', 'Red Dunes 4x4 Desert Safari & BBQ', 'Dubai Marina Dinner Cruise', 'Old Dubai Creek Abra & Gold Souk Tour', 'Palm Jumeirah Scenic Drive']),
        included_json: JSON.stringify(['5 Nights hotel accommodation with daily breakfast', 'Return Dubai Airport (DXB) private transfers', 'UAE Tourist Visa processing assistance', 'All tours & entrance tickets listed in itinerary', '24/7 KOLA Tours concierge support']),
        excluded_json: JSON.stringify(['International flights (can be quoted together)', 'Tourism Dirham hotel fee (approx. AED 15-20/night)', 'Personal shopping & optional tips']),
        gallery_json: JSON.stringify([
          'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1546412414-e1885259563a?auto=format&fit=crop&w=1000&q=80'
        ]),
        available_dates_json: JSON.stringify(['Nov 15 – Nov 20, 2026', 'Dec 10 – Dec 15, 2026', 'Dec 22 – Dec 27, 2026', 'Jan 12 – Jan 17, 2027', 'Custom Dates Available Daily']),
        hero_image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
        featured: 1
      },
      {
        title: 'Zanzibar Spice Island & Turquoise Beach Retreat',
        slug: 'zanzibar-spice-island-beach-retreat',
        destination: 'Zanzibar',
        country: 'Tanzania',
        category: 'Beach & Island',
        duration_days: 5,
        duration_label: '5 Days / 4 Nights',
        price_per_person: 840,
        min_participants: 2,
        max_participants: 16,
        description: 'Escape to the idyllic shores of Zanzibar. Enjoy beachfront half-board resort living in Nungwi, a guided Stone Town cultural walk, an aromatic organic spice plantation tour, Prison Island giant tortoises, and a full-day Safari Blue dhow sailing & seafood feast.',
        itinerary_json: JSON.stringify([
          { day: 1, title: 'Arrival in Zanzibar & Nungwi Beach Transfer', description: 'Warm Swahili welcome at Abeid Amani Karume International Airport (ZNZ) and scenic transfer to your beachfront resort in Nungwi.', meals: 'Dinner', accommodation: 'Zuri Zanzibar / Royal Zanzibar Beach Resort (or similar)' },
          { day: 2, title: 'Historic Stone Town, Spice Farm & Prison Island Boat Trip', description: 'Walk the labyrinth alleys of UNESCO Stone Town, sample fresh cloves and vanilla at a spice farm with Swahili lunch, and boat to Changuu (Prison) Island.', meals: 'Breakfast, Swahili Spice Lunch, Dinner', accommodation: 'Beachfront Resort' },
          { day: 3, title: 'Safari Blue Full-Day Traditional Dhow & Sandbank Picnic', description: 'Sail across Menai Bay Conservation Area, snorkel vibrant coral reefs, relax on a powder-white sandbank, and feast on grilled lobster and tropical fruits.', meals: 'Breakfast, Seafood Grill Lunch, Dinner', accommodation: 'Beachfront Resort' },
          { day: 4, title: 'Mnemba Atoll Dolphin Snorkeling & Sunset Nungwi Cruise', description: 'Morning boat excursion to Mnemba Atoll marine reserve followed by a golden-hour sunset dhow cruise with live acoustic taarab rhythms.', meals: 'Breakfast, Dinner', accommodation: 'Beachfront Resort' },
          { day: 5, title: 'Beach Leisure & Airport Transfer', description: 'Final morning swim in the Indian Ocean before your private transfer to Zanzibar Airport.', meals: 'Breakfast', accommodation: 'Departure' }
        ]),
        accommodation_details: '4 Nights beachfront resort in Nungwi or Kendwa on Half-Board or All-Inclusive basis.',
        transportation_details: 'Private air-conditioned minivan transfers and traditional wooden motor dhows with life jackets and snorkeling gear.',
        activities_json: JSON.stringify(['UNESCO Stone Town Walking Tour', 'Organic Spice Plantation & Swahili Lunch', 'Safari Blue Dhow & Sandbank Seafood BBQ', 'Prison Island Giant Tortoise Sanctuary', 'Sunset Dhow Cruise']),
        included_json: JSON.stringify(['4 Nights oceanfront resort accommodation', 'Daily breakfast & dinner + 2 excursion lunches', 'Return Zanzibar Airport transfers', 'All marine park conservation fees & boat charters', 'English/Swahili speaking local guide']),
        excluded_json: JSON.stringify(['Regional flights (Entebbe/Nairobi to Zanzibar available on request)', 'Zanzibar mandatory inbound travel insurance ($44 pp)', 'Infrastructure tax ($5 per person/night)']),
        gallery_json: JSON.stringify([
          'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80'
        ]),
        available_dates_json: JSON.stringify(['Nov 20 – Nov 24, 2026', 'Dec 18 – Dec 22, 2026', 'Dec 28, 2026 – Jan 1, 2027', 'Feb 12 – Feb 16, 2027']),
        hero_image: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80',
        featured: 1
      },
      {
        title: 'Pearl of Africa Gorilla & Savannah Expedition',
        slug: 'pearl-of-africa-gorilla-savannah-expedition',
        destination: 'Bwindi & Queen Elizabeth Park',
        country: 'Uganda',
        category: 'Safari & Wildlife',
        duration_days: 7,
        duration_label: '7 Days / 6 Nights',
        price_per_person: 2450,
        min_participants: 2,
        max_participants: 8,
        description: 'An iconic Ugandan wildlife journey through Lake Mburo, Kazinga Channel in Queen Elizabeth National Park, the tree-climbing lions of Ishasha, and a once-in-a-lifetime mountain gorilla trekking experience in Bwindi Impenetrable Forest.',
        itinerary_json: JSON.stringify([
          { day: 1, title: 'Entebbe/Kampala to Lake Mburo National Park', description: 'Stop at the Uganda Equator monument in Kayabwe before continuing to Lake Mburo for an afternoon game drive among zebras, elands, and giraffes.', meals: 'Lunch, Dinner', accommodation: 'Mihingo Lodge / Rwakobo Rock' },
          { day: 2, title: 'Walking Safari & Transfer to Queen Elizabeth National Park', description: 'Guided morning bush walk in Lake Mburo, then drive past crater lakes to Queen Elizabeth National Park.', meals: 'Breakfast, Lunch, Dinner', accommodation: 'Mweya Safari Lodge / Elephant Plains Lodge' },
          { day: 3, title: 'Kasenyi Plains Game Drive & Kazinga Channel Boat Cruise', description: 'Early morning lion and leopard tracking on Kasenyi plains; afternoon boat safari along Kazinga Channel with hundreds of hippos, buffalo, and waterbirds.', meals: 'Breakfast, Lunch, Dinner', accommodation: 'Mweya Safari Lodge / Elephant Plains Lodge' },
          { day: 4, title: 'Ishasha Tree-Climbing Lions to Bwindi Impenetrable Forest', description: 'Drive south through the Ishasha sector searching for fig-tree lions, ascending into the misty hills of Bwindi.', meals: 'Breakfast, Lunch, Dinner', accommodation: 'Mahogany Springs / Buhoma Lodge' },
          { day: 5, title: 'Mountain Gorilla Trekking in Bwindi Rainforest', description: 'Early briefing at park headquarters before trekking through ancient montane forest to spend one magical hour with a habituated mountain gorilla family.', meals: 'Breakfast, Packed Lunch, Dinner', accommodation: 'Mahogany Springs / Buhoma Lodge' },
          { day: 6, title: 'Lake Bunyonyi Canoeing & Island Relaxation', description: 'Journey to scenic Lake Bunyonyi ("Place of Many Little Birds") for dugout canoeing and serene lakeside relaxation.', meals: 'Breakfast, Lunch, Dinner', accommodation: 'BirdNest Resort Lake Bunyonyi' },
          { day: 7, title: 'Return to Entebbe International Airport', description: 'Scenic drive back to Kampala/Entebbe (or optional domestic bush flight from Kihihi to Entebbe).', meals: 'Breakfast, Lunch', accommodation: 'Departure' }
        ]),
        accommodation_details: '6 Nights handpicked luxury and mid-luxury eco-safari lodges on Full-Board basis.',
        transportation_details: 'Custom 4x4 Toyota Land Cruiser Safari Jeep with pop-up photographic roof, inverter charging ports, and onboard cooler box.',
        activities_json: JSON.stringify(['UWA Mountain Gorilla Trekking Permit Included', 'Kazinga Channel Private Launch Cruise', 'Ishasha Tree-Climbing Lion Game Drive', 'Lake Mburo Guided Walking Safari', 'Lake Bunyonyi Island Canoe Excursion']),
        included_json: JSON.stringify(['Official Uganda Wildlife Authority Gorilla Permit ($800 value)', '6 Nights full-board safari lodge accommodation', 'Private 4x4 Safari Land Cruiser & professional driver-guide', 'All National Park entry fees & boat cruise tickets', 'Bottled drinking water throughout the safari']),
        excluded_json: JSON.stringify(['International flights', 'East African Tourist Visa ($100)', 'Optional domestic flight Kihihi–Entebbe ($290)', 'Ranger & porter tips']),
        gallery_json: JSON.stringify([
          'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=1000&q=80'
        ]),
        available_dates_json: JSON.stringify(['Dec 05 – Dec 11, 2026', 'Jan 08 – Jan 14, 2027', 'Feb 14 – Feb 20, 2027', 'Jun 10 – Jun 16, 2027']),
        hero_image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
        featured: 1
      },
      {
        title: 'Maasai Mara & Nairobi Signature Big Five Safari',
        slug: 'maasai-mara-nairobi-big-five-safari',
        destination: 'Nairobi & Maasai Mara',
        country: 'Kenya',
        category: 'Safari & Wildlife',
        duration_days: 5,
        duration_label: '5 Days / 4 Nights',
        price_per_person: 1320,
        min_participants: 2,
        max_participants: 12,
        description: 'Witness the drama of the African savannah across Kenya’s Great Rift Valley, Lake Nakuru flamingo & rhino sanctuary, and the legendary Maasai Mara National Reserve.',
        itinerary_json: JSON.stringify([
          { day: 1, title: 'Arrival at Jomo Kenyatta Airport & Nairobi Boutique Stay', description: 'VIP airport pickup and check-in at your Karen or Westlands hotel; afternoon visit to the Giraffe Centre.', meals: 'Breakfast', accommodation: 'Tamarind Tree Hotel / Hemingways Eden' },
          { day: 2, title: 'Great Rift Valley Escarpment to Maasai Mara', description: 'Drive across the Great Rift Valley viewpoint into the Maasai Mara in time for lunch and an afternoon game drive.', meals: 'Breakfast, Lunch, Dinner', accommodation: 'Sarova Mara Game Camp / Ashnil Mara Camp' },
          { day: 3, title: 'Full-Day Maasai Mara Savannah Exploration', description: 'Sunrise to sunset game tracking across the Mara River, spotting prides of lions, cheetahs, elephants, and hippos, with bush picnic lunch.', meals: 'Breakfast, Picnic Lunch, Dinner', accommodation: 'Sarova Mara Game Camp / Ashnil Mara Camp' },
          { day: 4, title: 'Maasai Cultural Manyatta Visit & Lake Nakuru', description: 'Optional dawn hot-air balloon safari; visit a Maasai village before transferring to Lake Nakuru National Park.', meals: 'Breakfast, Lunch, Dinner', accommodation: 'Sarova Lion Hill Game Lodge' },
          { day: 5, title: 'Lake Nakuru Rhino Drive & Return to Nairobi', description: 'Morning game drive viewing white and black rhinos and Rothschild giraffes before returning to Nairobi Jomo Kenyatta Airport.', meals: 'Breakfast, Lunch', accommodation: 'Departure' }
        ]),
        accommodation_details: '1 Night Nairobi hotel + 2 Nights luxury tented camp in Maasai Mara + 1 Night Lake Nakuru lodge.',
        transportation_details: '4x4 Safari Land Cruiser with guaranteed window seats and VHF radio communication.',
        activities_json: JSON.stringify(['Nairobi Giraffe Centre Visit', 'Full-Day Maasai Mara Game Drives', 'Mara River Hippo & Crocodile Pools', 'Lake Nakuru Rhino Sanctuary Drive', 'Maasai Cultural Village Interaction']),
        included_json: JSON.stringify(['4 Nights accommodation & meals per itinerary', '4x4 Land Cruiser safari transport', 'All Maasai Mara & Lake Nakuru park fees', 'Airport transfers in Nairobi', 'Flying Doctors emergency medical evacuation cover']),
        excluded_json: JSON.stringify(['Optional Maasai Mara Hot Air Balloon ($450 pp)', 'International flights', 'Beverages & personal gratuities']),
        gallery_json: JSON.stringify([
          'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1000&q=80'
        ]),
        available_dates_json: JSON.stringify(['Nov 25 – Nov 29, 2026', 'Dec 19 – Dec 23, 2026', 'Jul 15 – Jul 19, 2027', 'Aug 05 – Aug 09, 2027']),
        hero_image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80',
        featured: 1
      },
      {
        title: 'Istanbul & Cappadocia Imperial Heritage & Balloons',
        slug: 'istanbul-cappadocia-imperial-heritage',
        destination: 'Istanbul',
        country: 'Türkiye',
        category: 'Cultural & Heritage',
        duration_days: 7,
        duration_label: '7 Days / 6 Nights',
        price_per_person: 1390,
        min_participants: 2,
        max_participants: 18,
        description: 'Discover two magical worlds in one seamless itinerary: imperial Ottoman and Byzantine treasures along the Bosphorus in Istanbul, paired with the fairy chimneys, cave suites, and sunrise hot-air balloons of Cappadocia.',
        itinerary_json: JSON.stringify([
          { day: 1, title: 'Arrival in Istanbul & Sultanahmet Check-In', description: 'Private transfer from Istanbul Airport (IST) to your hotel in historic Sultanahmet or Taksim.', meals: 'None', accommodation: 'Romance Istanbul Boutique Hotel' },
          { day: 2, title: 'Hagia Sophia, Blue Mosque, Topkapi Palace & Grand Bazaar', description: 'Full-day guided walking tour of Istanbul’s UNESCO historic peninsula and ancient Hippodrome.', meals: 'Breakfast, Turkish Lunch', accommodation: 'Romance Istanbul Boutique Hotel' },
          { day: 3, title: 'Bosphorus Strait Cruise & Flight to Cappadocia', description: 'Morning spice market visit and scenic Bosphorus boat cruise; evening domestic flight to Kayseri/Nevşehir and check-in at your authentic cave hotel.', meals: 'Breakfast', accommodation: 'Sultan Cave Suites / Mithra Cave Hotel' },
          { day: 4, title: 'Sunrise Hot-Air Balloon & Göreme Open-Air Museum', description: 'Early morning Cappadocia balloon flight over Love Valley and Pasabag fairy chimneys, followed by Avanos pottery workshops.', meals: 'Breakfast, Lunch', accommodation: 'Cave Hotel in Göreme' },
          { day: 5, title: 'Kaymakli Underground City & Ihlara Valley', description: 'Explore multi-level ancient underground cities and hike along the lush Ihlara Gorge.', meals: 'Breakfast, Lunch', accommodation: 'Cave Hotel in Göreme' },
          { day: 6, title: 'Return Flight to Istanbul & Galata Evening', description: 'Morning flight back to Istanbul with afternoon free for Istiklal Avenue and Galata Tower cafés.', meals: 'Breakfast', accommodation: 'Romance Istanbul Boutique Hotel' },
          { day: 7, title: 'Istanbul Departure Transfer', description: 'Private transfer to Istanbul Airport for your onward international flight.', meals: 'Breakfast', accommodation: 'Departure' }
        ]),
        accommodation_details: '4 Nights Boutique Hotel in Istanbul + 2 Nights Authentic Cave Suite in Cappadocia.',
        transportation_details: 'Domestic return flights (Istanbul–Cappadocia–Istanbul) included, plus private Mercedes Sprinter transfers.',
        activities_json: JSON.stringify(['Hagia Sophia & Topkapi Palace Guided Tour', 'Bosphorus Scenic Boat Cruise', 'Domestic Flights Istanbul–Cappadocia Included', 'Göreme Open-Air Museum & Fairy Chimneys', 'Kaymakli Underground City Tour']),
        included_json: JSON.stringify(['6 Nights boutique & cave hotel accommodation', 'Domestic flights within Türkiye (20kg luggage)', 'All airport transfers & guided excursions', 'Turkish Visa documentation guidance']),
        excluded_json: JSON.stringify(['International airfare', 'Optional Hot Air Balloon flight ($240 pp weather permitting)', 'Turkish visa fee']),
        gallery_json: JSON.stringify([
          'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=1000&q=80'
        ]),
        available_dates_json: JSON.stringify(['Nov 18 – Nov 24, 2026', 'Mar 15 – Mar 21, 2027', 'Apr 10 – Apr 16, 2027', 'May 05 – May 11, 2027']),
        hero_image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80',
        featured: 1
      },
      {
        title: 'Cape Town, Table Mountain & Stellenbosch Winelands',
        slug: 'cape-town-table-mountain-winelands',
        destination: 'Cape Town',
        country: 'South Africa',
        category: 'Honeymoon & Romance',
        duration_days: 6,
        duration_label: '6 Days / 5 Nights',
        price_per_person: 1290,
        min_participants: 2,
        max_participants: 14,
        description: 'Celebrate life along South Africa’s dramatic Atlantic seaboard. Includes Table Mountain aerial cableway, Cape Point & Boulders Beach penguin colony, Robben Island museum, and private wine & cheese tastings in Stellenbosch and Franschhoek.',
        itinerary_json: JSON.stringify([
          { day: 1, title: 'Arrival in Cape Town & V&A Waterfront Sunset', description: 'Private transfer from Cape Town International Airport (CPT) to your hotel near the Victoria & Alfred Waterfront.', meals: 'Welcome Drinks', accommodation: 'The Table Bay / Radisson RED Waterfront' },
          { day: 2, title: 'Table Mountain Cableway, Bo-Kaap & City Orientation', description: 'Ascend Table Mountain by revolving cable car, stroll the colorful Cape Malay quarter of Bo-Kaap, and visit Kirstenbosch Botanical Gardens.', meals: 'Breakfast', accommodation: 'Waterfront Hotel' },
          { day: 3, title: 'Cape Peninsula, Chapman’s Peak & Boulders Penguins', description: 'Scenic coastal drive via Camps Bay, Hout Bay seal island boat trip, Chapman’s Peak Drive, Cape of Good Hope, and African penguins at Boulders Beach.', meals: 'Breakfast, Seafood Lunch', accommodation: 'Waterfront Hotel' },
          { day: 4, title: 'Stellenbosch & Franschhoek Wine Tram & Cellar Tour', description: 'Full day tasting award-winning Pinotage and Chenin Blanc wines across three historic Cape Dutch estates.', meals: 'Breakfast, Wine & Cheese Pairing', accommodation: 'Waterfront Hotel' },
          { day: 5, title: 'Robben Island Ferry & Sunset Catamaran Cruise', description: 'Morning ferry to UNESCO-listed Robben Island followed by an Atlantic sunset champagne cruise from the Waterfront.', meals: 'Breakfast', accommodation: 'Waterfront Hotel' },
          { day: 6, title: 'Cape Town Departure', description: 'Private transfer to Cape Town International Airport.', meals: 'Breakfast', accommodation: 'Departure' }
        ]),
        accommodation_details: '5 Nights 4-Star Superior or 5-Star hotel at V&A Waterfront or Sea Point with daily breakfast.',
        transportation_details: 'Private luxury touring vehicle with registered South African cultural guide.',
        activities_json: JSON.stringify(['Table Mountain Aerial Cableway Ticket', 'Cape of Good Hope & Boulders Penguins', 'Stellenbosch & Franschhoek Wine Estates', 'Robben Island Museum Ferry', 'Atlantic Sunset Champagne Cruise']),
        included_json: JSON.stringify(['5 Nights hotel stay with breakfast', 'All private airport & touring transfers', 'Entrance tickets to Table Mountain, Cape Point, Boulders & wine tastings', 'South Africa Visa documentation preparation']),
        excluded_json: JSON.stringify(['International flights', 'Dinners & personal expenses']),
        gallery_json: JSON.stringify([
          'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1576485290814-1c72aa4bbb8e?auto=format&fit=crop&w=1000&q=80'
        ]),
        available_dates_json: JSON.stringify(['Dec 12 – Dec 17, 2026', 'Jan 20 – Jan 25, 2027', 'Feb 11 – Feb 16, 2027', 'Mar 08 – Mar 13, 2027']),
        hero_image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1200&q=80',
        featured: 1
      }
    ];

    const insertPkg = db.prepare(`
      INSERT INTO tour_packages (
        title, slug, destination, country, category, duration_days, duration_label,
        price_per_person, min_participants, max_participants, description,
        itinerary_json, accommodation_details, transportation_details,
        activities_json, included_json, excluded_json, gallery_json,
        available_dates_json, hero_image, featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of packages) {
      insertPkg.run(
        p.title, p.slug, p.destination, p.country, p.category, p.duration_days, p.duration_label,
        p.price_per_person, p.min_participants, p.max_participants, p.description,
        p.itinerary_json, p.accommodation_details, p.transportation_details,
        p.activities_json, p.included_json, p.excluded_json, p.gallery_json,
        p.available_dates_json, p.hero_image, p.featured
      );
    }
  }

  // 5. Seed Hotels
  const hotelCount = db.prepare('SELECT COUNT(*) as c FROM hotels').get().c;
  if (hotelCount === 0) {
    const hotels = [
      {
        name: 'Address Downtown & Marina Collection',
        slug: 'address-downtown-dubai',
        destination: 'Dubai',
        country: 'United Arab Emirates',
        address: 'Sheikh Mohammed bin Rashid Blvd, Downtown Dubai, UAE',
        star_rating: 5,
        accommodation_type: 'Luxury Hotel',
        description: 'Directly facing the iconic Burj Khalifa and connected to The Dubai Mall via air-conditioned skywalk, offering infinity pools, holistic spa suites, and award-winning fine dining.',
        facilities_json: JSON.stringify(['Infinity Pool with Burj Khalifa Views', 'Complimentary High-Speed Wi-Fi', '24-Hour Chauffeur & Airport Limousine', 'Luxury Spa & Hammam', '5 Signature Restaurants & Lounges', 'Kids Club & Family Suites']),
        room_types_json: JSON.stringify([
          { name: 'Deluxe Room King/Twin', capacity: '2 Adults + 1 Child', price_per_night: 320, perks: 'Daily Buffet Breakfast, Free Wi-Fi' },
          { name: 'Premier Fountain View Room', capacity: '2 Adults + 2 Children', price_per_night: 460, perks: 'Direct Burj Khalifa & Fountain Balcony, Breakfast' },
          { name: 'Executive Club Suite', capacity: '3 Adults', price_per_night: 690, perks: 'Club Lounge Access, Airport Transfer, Breakfast & Evening Canapés' }
        ]),
        indicative_price_usd: 320,
        images_json: JSON.stringify([
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80'
        ]),
        hero_image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80',
        featured: 1
      },
      {
        name: 'Royal Zanzibar Beach Resort & Spa',
        slug: 'royal-zanzibar-beach-resort',
        destination: 'Zanzibar',
        country: 'Tanzania',
        address: 'North Coast Nungwi Beach, Zanzibar Island, Tanzania',
        star_rating: 5,
        accommodation_type: 'Beach Resort',
        description: 'Set on 20 acres of tropical gardens overlooking the coral cliffs and white sands of Nungwi, featuring four cascading swimming pools, Swahili architecture, and an oceanfront PADI dive center.',
        facilities_json: JSON.stringify(['Private White-Sand Beachfront', '4 Infinity & Lagoon Pools', 'All-Inclusive Dining & Beach Bar', 'PADI Scuba & Snorkeling Center', 'Oceanfront Massage Pavilions', 'Evening Cultural Entertainment']),
        room_types_json: JSON.stringify([
          { name: 'Superior Garden & Ocean Terrace', capacity: '2 Adults + 1 Child', price_per_night: 260, perks: 'All-Inclusive Meals & Selected Drinks' },
          { name: 'Oceanfront Suite', capacity: '2 Adults + 2 Children', price_per_night: 390, perks: 'Panoramic Indian Ocean Balcony, All-Inclusive' },
          { name: 'Royal Bahari Villa', capacity: '4 Adults', price_per_night: 620, perks: 'Private Plunge Pool, Butler Service, All-Inclusive' }
        ]),
        indicative_price_usd: 260,
        images_json: JSON.stringify([
          'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=80'
        ]),
        hero_image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1000&q=80',
        featured: 1
      },
      {
        name: 'Kampala Serena Hotel & Conference Centre',
        slug: 'kampala-serena-hotel',
        destination: 'Bwindi & Queen Elizabeth Park',
        country: 'Uganda',
        address: 'Kintu Road, Nakasero Hill, Kampala, Uganda',
        star_rating: 5,
        accommodation_type: 'Luxury Hotel',
        description: 'An oasis of cool tropical gardens and cascading water terraces in the heart of Kampala, ideal for diplomatic stays, international conferences, and pre-safari luxury relaxation.',
        facilities_json: JSON.stringify(['Maisha Mind Body & Spirit Spa', 'Heated Outdoor Waterfall Pool', 'The Pearl of Africa Fine Dining', '24/7 Secure Entebbe Airport Shuttles', 'VIP Executive Lounge & Boardrooms', 'High-Speed Fiber Wi-Fi']),
        room_types_json: JSON.stringify([
          { name: 'Deluxe Garden Room', capacity: '2 Adults', price_per_night: 245, perks: 'Full English & Ugandan Breakfast, Spa Sauna Access' },
          { name: 'Executive Suite', capacity: '2 Adults', price_per_night: 380, perks: 'Private Living Lounge, Executive Club Benefits' },
          { name: 'Royal Bambara Suite', capacity: '2 Adults', price_per_night: 750, perks: 'Private Dining Room, Chauffeur Airport Pickup' }
        ]),
        indicative_price_usd: 245,
        images_json: JSON.stringify([
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1000&q=80'
        ]),
        hero_image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1000&q=80',
        featured: 1
      },
      {
        name: 'Sarova Mara Game Camp & Luxury Tents',
        slug: 'sarova-mara-game-camp',
        destination: 'Nairobi & Maasai Mara',
        country: 'Kenya',
        address: 'Sekenani Gate Sector, Maasai Mara National Reserve, Kenya',
        star_rating: 5,
        accommodation_type: 'Safari Lodge',
        description: 'Surrounded by two natural streams in the heart of the Maasai Mara migration corridor, blending canvas safari authenticity with gourmet bush dining and evening Maasai boma fires.',
        facilities_json: JSON.stringify(['Full-Board Bush Dining', 'Freeform Swimming Pool', 'Tulia Wellness Tent', 'Guided Nature Walks & Birding', 'Solar & Backup 24-Hour Power', 'Airstrip Transfers']),
        room_types_json: JSON.stringify([
          { name: 'Deluxe Safari Tent', capacity: '2 Adults', price_per_night: 290, perks: 'Full Board (Breakfast, Lunch & Dinner)' },
          { name: 'Club Tent (Private Deck)', capacity: '2 Adults', price_per_night: 385, perks: 'Panoramic Savannah Deck, Bush Breakfast Included' },
          { name: 'Two-Bedroom Family Tent', capacity: '4 Guests', price_per_night: 560, perks: 'Interconnecting Canvas Suites, Full Board' }
        ]),
        indicative_price_usd: 290,
        images_json: JSON.stringify([
          'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1000&q=80'
        ]),
        hero_image: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1000&q=80',
        featured: 1
      },
      {
        name: 'Swahili Beach Resort Diani',
        slug: 'swahili-beach-resort-diani',
        destination: 'Mombasa & Diani Coast',
        country: 'Kenya',
        address: 'Diani Beach Road, Ukunda, South Coast Mombasa, Kenya',
        star_rating: 5,
        accommodation_type: 'Beach Resort',
        description: 'Architectural fusion of Swahili, Arabian, and Indian influences overlooking seven tiered saltwater infinity pools that flow down to the white sands of Diani Beach.',
        facilities_json: JSON.stringify(['7 Tiered Cascading Ocean Pools', 'Spice Route & Seafood Restaurants', 'Kite Surfing & Reef Diving Center', 'Oceanfront Spa & Gym', 'Ukunda & Moi Airport Transfers']),
        room_types_json: JSON.stringify([
          { name: 'Standard Pool & Garden Room', capacity: '2 Adults', price_per_night: 215, perks: 'Half Board (Breakfast & Dinner)' },
          { name: 'Superior Rooftop Suite', capacity: '2 Adults + 1 Child', price_per_night: 295, perks: 'Private Sun Terrace, Half Board' }
        ]),
        indicative_price_usd: 215,
        images_json: JSON.stringify([
          'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80'
        ]),
        hero_image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80',
        featured: 1
      },
      {
        name: 'One&Only Gorilla’s Nest & Kigali Retreat',
        slug: 'kigali-volcanoes-luxury-lodge',
        destination: 'Kigali & Volcanoes',
        country: 'Rwanda',
        address: 'Kinigi Foothills, Volcanoes National Park, Musanze, Rwanda',
        star_rating: 5,
        accommodation_type: 'Safari Lodge',
        description: 'Cradled in a fragrant eucalyptus forest on the slopes of the Virunga Volcanoes, offering treehouse-style suites, farm-to-table Rwandan cuisine, and seamless gorilla trekking preparation.',
        facilities_json: JSON.stringify(['Eucalyptus Forest Infinity Pool', 'Gorilla Trek Gear & Boot Cleaning Service', 'Private Fireplace Decks', 'Helipad & Kigali SUV Transfers', 'Wellness & Recovery Spa']),
        room_types_json: JSON.stringify([
          { name: 'Forest King Lodge Room', capacity: '2 Adults', price_per_night: 420, perks: 'Full Board + Non-Alcoholic Beverages' },
          { name: 'Virunga Volcano Suite', capacity: '2 Adults', price_per_night: 650, perks: 'Outdoor Viewing Deck, Private Fireplace, Full Board' }
        ]),
        indicative_price_usd: 420,
        images_json: JSON.stringify([
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80'
        ]),
        hero_image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=80',
        featured: 1
      }
    ];

    const insertHotel = db.prepare(`
      INSERT INTO hotels (
        name, slug, destination, country, address, star_rating, accommodation_type,
        description, facilities_json, room_types_json, indicative_price_usd,
        images_json, hero_image, featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const h of hotels) {
      insertHotel.run(
        h.name, h.slug, h.destination, h.country, h.address, h.star_rating, h.accommodation_type,
        h.description, h.facilities_json, h.room_types_json, h.indicative_price_usd,
        h.images_json, h.hero_image, h.featured
      );
    }
  }

  // 6. Seed Testimonials
  const testCount = db.prepare('SELECT COUNT(*) as c FROM testimonials').get().c;
  if (testCount === 0) {
    const testimonials = [
      {
        customer_name: 'Dr. Ronald Mugisha & Family',
        customer_role_location: 'Kampala, Uganda',
        service_used: 'Dubai Family Holiday Package & UAE Visas',
        rating: 5,
        comment: 'KOLA TOURS AND TRAVEL organized our 6-day family holiday to Dubai flawlessly. From UAE tourist visa processing to our hotel near Dubai Mall and the desert safari, every transfer was on time and transparent.'
      },
      {
        customer_name: 'Sarah Jenkins & Mark Thompson',
        customer_role_location: 'London, United Kingdom',
        service_used: 'Custom 7-Day Uganda Gorilla & Queen Elizabeth Safari',
        rating: 5,
        comment: 'Our custom itinerary through Bwindi and Queen Elizabeth National Park exceeded every expectation. Our 4x4 Land Cruiser was spotless, our gorilla permits were secured months ahead, and the lodges were breathtaking.'
      },
      {
        customer_name: 'Eng. Patrick Ochieng',
        customer_role_location: 'Nairobi, Kenya / Entebbe',
        service_used: 'Corporate Flight Ticketing & UK Business Visa Assistance',
        rating: 5,
        comment: 'As a frequent regional and international traveler, having KOLA Tours manage our company flight quotations and UK visa document checklists has saved us countless hours. Honest pricing and rapid response.'
      },
      {
        customer_name: 'Amina & Tariq Hassan',
        customer_role_location: 'Kigali, Rwanda',
        service_used: 'Zanzibar Honeymoon Beach Resort & Transfers',
        rating: 5,
        comment: 'We submitted a custom honeymoon request and received a detailed quotation within hours. Our beachfront suite in Nungwi and private Safari Blue dhow excursion made our honeymoon unforgettable.'
      }
    ];
    const insertTest = db.prepare(`
      INSERT INTO testimonials (customer_name, customer_role_location, service_used, rating, comment, is_approved, featured)
      VALUES (?, ?, ?, ?, ?, 1, 1)
    `);
    for (const t of testimonials) {
      insertTest.run(t.customer_name, t.customer_role_location, t.service_used, t.rating, t.comment);
    }
  }

  // 7. Seed Blog Posts / Destination Guides
  const blogCount = db.prepare('SELECT COUNT(*) as c FROM blog_posts').get().c;
  if (blogCount === 0) {
    const posts = [
      {
        title: 'Ultimate Guide to Mountain Gorilla Trekking in Uganda & Rwanda (2026/2027)',
        slug: 'ultimate-guide-gorilla-trekking-uganda-rwanda',
        category: 'Safari Guides',
        excerpt: 'Everything you need to know about securing UWA & RDB gorilla permits, best trekking sectors in Bwindi, packing essentials, and fitness preparation.',
        content: `Trekking through the misty montane rainforests of Bwindi Impenetrable National Park or Volcanoes National Park to spend an hour with a habituated mountain gorilla family is one of Earth's most moving wildlife encounters.\n\n### 1. When to Book Your Gorilla Permit\nBecause daily visitor numbers are strictly limited to 8 trekkers per gorilla family to protect conservation and health, permits should be requested through KOLA TOURS AND TRAVEL at least 3 to 6 months in advance—especially for peak dry seasons (June–September and December–February).\n\n### 2. What to Pack for the Rainforest\n- Waterproof hiking boots with strong ankle support\n- Gardening gloves to grip vines and protect against nettles\n- Lightweight rain jacket and long breathable trousers\n- Insect repellent and high-energy trail snacks\n\n### 3. Combining Gorilla Trekking with Savannah or Beach\nMost travelers pair a 3- or 4-day Bwindi trek with game drives along the Kazinga Channel in Queen Elizabeth National Park or a direct regional flight to Zanzibar for Indian Ocean relaxation.`,
        cover_image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1000&q=80',
        read_time: '6 min read'
      },
      {
        title: 'Checklist: How to Prepare a Strong Schengen, UK, or UAE Visa Application from East Africa',
        slug: 'visa-application-checklist-schengen-uk-uae',
        category: 'Visa & Passports',
        excerpt: 'Avoid common documentation pitfalls with our structured checklist covering bank statements, employment letters, flight reservations, and passport validity.',
        content: `Applying for an international tourist, business, or student visa requires accuracy, consistency, and complete supporting documentation. While final visa issuance decisions always rest solely with the respective embassies and government authorities, proper preparation dramatically reduces avoidable delays.\n\n### Essential Documents Across Major Consulates\n1. **Passport Validity:** Ensure your passport is valid for at least 6 months beyond your intended return date and has at least 2 blank adjacent visa pages.\n2. **Verifiable Travel Itinerary & Hotel Reservation:** Consulates require a coherent travel plan and flight reservation hold (without necessarily purchasing non-refundable tickets prior to visa outcome).\n3. **Financial Proof:** Certified 3- to 6-month bank statements reflecting consistent income and sufficient funds to cover your stay.\n4. **Ties to Home Country:** Employment verification, approved leave letter, business registration certificates, or academic enrollment letters.`,
        cover_image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1000&q=80',
        read_time: '5 min read'
      },
      {
        title: 'Zanzibar vs. Mombasa & Diani: Choosing Your Perfect Indian Ocean Escape',
        slug: 'zanzibar-vs-mombasa-diani-beach-comparison',
        category: 'Destination Spotlight',
        excerpt: 'Comparing Stone Town spice culture and Nungwi sunsets with Kenya’s Diani Beach resorts and marine parks for couples, families, and groups.',
        content: `East Africa's Indian Ocean coastline offers two world-class beach holidays just a short regional flight from Entebbe, Nairobi, or Kigali.\n\n### Choose Zanzibar If You Love:\n- UNESCO heritage alleys in Stone Town, spice farm tours, and sunset wooden dhow cruises\n- Powder-white coral sands in Nungwi and Kendwa with minimal tidal retreat\n- Boutique honeymoon villas and snorkeling around Mnemba Atoll\n\n### Choose Mombasa & Diani Beach If You Love:\n- Pairing a coastal beach holiday seamlessly with a Tsavo or Maasai Mara wildlife safari\n- Expansive family-friendly resorts, skydiving over Diani Reef, and Wasini Island dolphin excursions.`,
        cover_image: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1000&q=80',
        read_time: '4 min read'
      }
    ];
    const insertPost = db.prepare(`
      INSERT INTO blog_posts (title, slug, category, excerpt, content, cover_image, read_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const b of posts) {
      insertPost.run(b.title, b.slug, b.category, b.excerpt, b.content, b.cover_image, b.read_time);
    }
  }

  // 8. Seed FAQs
  const faqCount = db.prepare('SELECT COUNT(*) as c FROM faqs').get().c;
  if (faqCount === 0) {
    const faqs = [
      {
        category: 'Bookings & Quotations',
        question: 'How does the booking request and quotation process work on KOLA TOURS AND TRAVEL?',
        answer: 'When you submit a flight, hotel, tour, custom itinerary, or visa inquiry, our system immediately assigns a unique traceable Reference Number (e.g., KTT-FLT-2026-XXXX). Our travel consultants review availability and prepare an itemized official Quotation. You receive an email and dashboard notification to review and accept or decline the quotation before any payment is requested.',
        sort_order: 1
      },
      {
        category: 'Flights & Ticketing',
        question: 'Are flight tickets issued automatically upon submitting the flight inquiry form?',
        answer: 'No. Because international and regional airfares depend on live airline seat classes, baggage rules, and routing options, submitting a flight inquiry sends your requirements to our ticketing desk. We respond promptly with actual flight routing options and fare quotations for your approval prior to ticket issuance.',
        sort_order: 2
      },
      {
        category: 'Visa & Passport Assistance',
        question: 'Can KOLA TOURS AND TRAVEL guarantee visa approval or issue passports?',
        answer: 'No travel agency can legally issue passports or guarantee visa approvals—final decisions belong strictly to the Directorate of Citizenship and Immigration Control and respective foreign embassies/consulates. Our role is to provide expert consultation, accurate document checklists, application form review, flight/hotel itinerary reservations for visa purposes, and appointment scheduling guidance.',
        sort_order: 3
      },
      {
        category: 'Payments & Currency',
        question: 'What payment methods do you support in Uganda and internationally?',
        answer: 'We support MTN Mobile Money, Airtel Money, USD and UGX Bank Transfers, and Visa/Mastercard payments. Every payment is verified against your booking reference and an official KOLA TOURS receipt is generated in your Customer Dashboard.',
        sort_order: 4
      },
      {
        category: 'Custom Tours',
        question: 'Can we customize any tour package for a private family, honeymoon, or corporate retreat?',
        answer: 'Absolutely! Every package can be tailored to your preferred travel dates, accommodation tier (budget, mid-range, or 5-star luxury), dietary needs, and group size via our Custom Travel Planner.',
        sort_order: 5
      }
    ];
    const insertFaq = db.prepare('INSERT INTO faqs (category, question, answer, sort_order) VALUES (?, ?, ?, ?)');
    for (const f of faqs) {
      insertFaq.run(f.category, f.question, f.answer, f.sort_order);
    }
  }

  // 9. Seed Sample Requests & Quotations for Demo Customer so both Admin & Customer Dashboards have rich real data immediately
  const reqCount = db.prepare('SELECT COUNT(*) as c FROM service_requests').get().c;
  if (reqCount === 0 && demoCustomerId) {
    const r1 = db.prepare(`
      INSERT INTO service_requests (
        reference_number, user_id, customer_name, customer_email, customer_phone, customer_nationality,
        service_type, title, related_entity_id, details_json, status,
        admin_notes, admin_response, total_quoted_amount, total_paid_amount, currency
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'KTT-TUR-2026-1042',
      demoCustomerId,
      'Grace Nakato',
      demoCustomerEmail,
      '+256 775 432 198',
      'Ugandan',
      'tour_fixed',
      'Dubai Royal Sands & Skyline Escape (2 Travelers)',
      1,
      JSON.stringify({
        packageTitle: 'Dubai Royal Sands & Skyline Escape',
        destination: 'Dubai, UAE',
        preferredDates: 'Dec 10 – Dec 15, 2026',
        travelersCount: 2,
        roomPreference: '1 Double Room (Premier Fountain View)',
        includeFlights: true,
        departureCity: 'Entebbe (EBB)',
        specialRequests: 'Anniversary celebration — please include UAE tourist visa assistance for 2 Ugandan passports.'
      }),
      'Quotation Sent',
      'Checked Emirates & Flydubai availability for Dec 10-15. Sent comprehensive quotation including 5-star Marina hotel and UAE visas.',
      'Dear Grace, congratulations on your upcoming anniversary! We have prepared Quotation #QT-2026-8801 covering your 6-Day Dubai Royal Sands package plus return flights from Entebbe and UAE tourist visas. Please review and approve in your Quotations tab.',
      3140,
      0,
      'USD'
    );

    const req1Id = Number(r1.lastInsertRowid);
    db.prepare(`
      INSERT INTO quotations (
        quotation_number, request_id, user_id, title, summary, line_items_json,
        itinerary_proposal_json, subtotal, taxes_fees, total_amount, currency,
        valid_until, payment_instructions, terms_notes, customer_decision
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'QT-2026-8801',
      req1Id,
      demoCustomerId,
      'Dubai Royal Sands 6D/5N Package + Return Flights (EBB–DXB) + UAE Visas',
      'Comprehensive couple package for Dec 10–15, 2026 including 5-Star Dubai Marina stay, return Emirates economy flights from Entebbe, UAE 30-day single-entry tourist visas, Burj Khalifa tickets, and private DXB airport transfers.',
      JSON.stringify([
        { description: 'Dubai Royal Sands & Skyline Escape (5 Nights, 5-Star Marina Hotel, Tours & Transfers)', quantity: 2, unit_price: 1180, total: 2360 },
        { description: 'Return Economy Flights: Entebbe (EBB) – Dubai (DXB) incl. 2x23kg Baggage', quantity: 2, unit_price: 295, total: 590 },
        { description: 'UAE 30-Day Tourist Visa Processing & Mandatory UAE Medical Insurance', quantity: 2, unit_price: 95, total: 190 }
      ]),
      JSON.stringify([
        { day: 'Day 1 (Dec 10)', activity: 'Depart Entebbe (EBB) 16:35, arrive Dubai (DXB) 23:15; VIP Chauffeur check-in at Address Dubai Marina.' },
        { day: 'Day 2–5 (Dec 11–14)', activity: 'Burj Khalifa 124th Floor, Red Dunes 4x4 Desert Safari & BBQ, Marina Luxury Yacht Dinner with Anniversary Cake, Old Dubai Gold Souk.' },
        { day: 'Day 6 (Dec 15)', activity: 'Private transfer to DXB Airport for return flight to Entebbe.' }
      ]),
      3140,
      0,
      3140,
      'USD',
      '2026-11-25',
      '50% deposit ($1,570 USD or UGX equivalent) required upon acceptance to lock airline seats and hotel allocation; balance due 14 days before departure.',
      'Airfare subject to airline class availability until ticketed. UAE Visa decisions remain with UAE Immigration authorities.',
      'Pending'
    );

    // Sample Flight Inquiry
    db.prepare(`
      INSERT INTO service_requests (
        reference_number, user_id, customer_name, customer_email, customer_phone, customer_nationality,
        service_type, title, details_json, status, admin_response, total_quoted_amount, total_paid_amount, currency
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'KTT-FLT-2026-1049',
      demoCustomerId,
      'Grace Nakato',
      demoCustomerEmail,
      '+256 775 432 198',
      'Ugandan',
      'flight',
      'Return Flight: Entebbe (EBB) to Nairobi (NBO)',
      JSON.stringify({
        tripType: 'Return',
        departureCity: 'Entebbe International Airport (EBB)',
        destinationCity: 'Nairobi Jomo Kenyatta (NBO)',
        departureDate: '2026-11-22',
        returnDate: '2026-11-25',
        passengers: { adults: 1, children: 0, infants: 0 },
        travelClass: 'Economy',
        preferredAirline: 'Uganda Airlines or Kenya Airways',
        additionalRequirements: 'Morning departure preferred; 1 checked bag.'
      }),
      'Confirmed',
      'Confirmed on Uganda Airlines UR 202 (07:00 EBB–08:15 NBO) and return UR 207 (18:30 NBO–19:45 EBB). Payment verified and e-ticket reference issued.',
      340,
      340,
      'USD'
    );

    const fltReqId = Number(db.prepare("SELECT id FROM service_requests WHERE reference_number = 'KTT-FLT-2026-1049'").get().id);
    db.prepare(`
      INSERT INTO payments (
        receipt_number, request_id, user_id, amount, currency, payment_method,
        transaction_reference, payer_name, payer_phone_or_account, status, verified_at, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Verified', datetime('now'), ?)
    `).run(
      'RCP-KTT-2026-501',
      fltReqId,
      demoCustomerId,
      340,
      'USD',
      'MTN Mobile Money',
      'MOMO-TXN-994827162',
      'Grace Nakato',
      '+256 775 432 198',
      'Full payment verified for Entebbe-Nairobi return ticket.'
    );

    // Sample Visa Assistance Request
    db.prepare(`
      INSERT INTO service_requests (
        reference_number, user_id, customer_name, customer_email, customer_phone, customer_nationality,
        service_type, title, details_json, status, admin_response, total_quoted_amount, total_paid_amount, currency
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'KTT-VSA-2026-1055',
      demoCustomerId,
      'Grace Nakato',
      demoCustomerEmail,
      '+256 775 432 198',
      'Ugandan',
      'visa_passport',
      'United Kingdom — Tourist Visa Consultation & Document Review',
      JSON.stringify({
        category: 'Visa Assistance',
        assistanceType: 'Tourist Visa Assistance',
        destinationCountry: 'United Kingdom',
        nationality: 'Ugandan',
        intendedTravelDate: '2027-02-10',
        durationOfStay: '10 Days',
        travelPurpose: 'Visiting family in London and sightseeing.',
        hasValidPassport: 'Yes (Expires 2031)',
        additionalNotes: 'Need review of 6-month bank statement and employer leave letter before TLScontact biometrics appointment.'
      }),
      'Under Review',
      'Our Immigration Documentation Consultant is reviewing your initial details and preparing your customized UK Standard Visitor Visa document checklist.',
      0,
      0,
      'USD'
    );

    // Seed Notifications
    db.prepare(`
      INSERT INTO notifications (user_id, is_admin_target, title, message, type, related_request_ref)
      VALUES (?, 0, ?, ?, 'quotation', 'KTT-TUR-2026-1042')
    `).run(
      demoCustomerId,
      'New Quotation Ready: QT-2026-8801',
      'Your itemized quotation ($3,140 USD) for Dubai Royal Sands & Skyline Escape is ready for your review and approval.'
    );

    db.prepare(`
      INSERT INTO notifications (user_id, is_admin_target, title, message, type, related_request_ref)
      VALUES (?, 0, ?, ?, 'payment', 'KTT-FLT-2026-1049')
    `).run(
      demoCustomerId,
      'Payment Verified & Receipt Issued (RCP-KTT-2026-501)',
      'Your payment of $340 USD for Flight Request KTT-FLT-2026-1049 has been verified and your booking is Confirmed.'
    );

    db.prepare(`
      INSERT INTO notifications (user_id, is_admin_target, title, message, type, related_request_ref)
      VALUES (NULL, 1, ?, ?, 'alert', 'KTT-VSA-2026-1055')
    `).run(
      'New Visa Assistance Inquiry: KTT-VSA-2026-1055',
      'Grace Nakato submitted a UK Tourist Visa Assistance inquiry requiring consultant review.'
    );
  }
}

function createDatabaseBackup(reason = 'manual') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `kola_tours_backup_${timestamp}_${reason}.sqlite`;
  const targetPath = path.join(backupDir, backupFilename);
  fs.copyFileSync(dbPath, targetPath);
  const stat = fs.statSync(targetPath);
  return {
    filename: backupFilename,
    path: targetPath,
    sizeBytes: stat.size,
    createdAt: new Date().toISOString()
  };
}

function listDatabaseBackups() {
  if (!fs.existsSync(backupDir)) return [];
  return fs.readdirSync(backupDir)
    .filter((f) => f.endsWith('.sqlite'))
    .map((f) => {
      const s = fs.statSync(path.join(backupDir, f));
      return {
        filename: f,
        sizeBytes: s.size,
        createdAt: s.mtime.toISOString()
      };
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function logAudit({ actorId = null, actorEmail = 'system', actorRole = 'system', action, targetType, targetRef = '', details = '', ipAddress = '' }) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (actor_id, actor_email, actor_role, action, target_type, target_ref, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(actorId, actorEmail, actorRole, action, targetType, targetRef, details, ipAddress);
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

runMigrations();
seedInitialData();

module.exports = {
  db,
  uploadDir,
  publicUploadDir,
  backupDir,
  createDatabaseBackup,
  listDatabaseBackups,
  logAudit
};

