import React from 'react';
import {
  Clock,
  Eye,
  AlertCircle,
  FileSpreadsheet,
  UserCheck,
  CreditCard,
  CheckCircle2,
  Award,
  XCircle
} from 'lucide-react';

const STATUS_CONFIG = {
  Submitted: {
    bg: 'bg-blue-50 text-blue-800 border-blue-200',
    icon: Clock
  },
  'Under Review': {
    bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    icon: Eye
  },
  'Awaiting Information': {
    bg: 'bg-amber-50 text-amber-800 border-amber-300',
    icon: AlertCircle
  },
  'Quotation Sent': {
    bg: 'bg-purple-50 text-purple-800 border-purple-200',
    icon: FileSpreadsheet
  },
  'Awaiting Customer Approval': {
    bg: 'bg-violet-50 text-violet-800 border-violet-200',
    icon: UserCheck
  },
  'Payment Pending': {
    bg: 'bg-orange-50 text-orange-800 border-orange-300',
    icon: CreditCard
  },
  Confirmed: {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    icon: CheckCircle2
  },
  Completed: {
    bg: 'bg-teal-50 text-teal-800 border-teal-300',
    icon: Award
  },
  Cancelled: {
    bg: 'bg-rose-50 text-rose-800 border-rose-200',
    icon: XCircle
  }
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Submitted;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{status}</span>
    </span>
  );
}

