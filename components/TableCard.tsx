'use client'
import { Users } from 'lucide-react';

type Status = 'empty' | 'serving' | 'help';

const STATUS_STYLE = {
  empty: {
    wrapper: 'bg-gray-100 border-gray-200',
    text: 'text-gray-500',
    label: 'Trống',
  },
  serving: {
    wrapper: 'bg-orange-100 border-orange-300',
    text: 'text-orange-600',
    label: 'Đang phục vụ',

  },
  help: {
    wrapper: 'bg-red-50 border-red-300',
    text: 'text-red-600',
    label: 'Cần hỗ trợ',
  },
};

interface Props {
  name: string;
  status: Status;
  guests?: number;
  onView?: () => void;
}

export default function TableCard({ name, status, guests, onView }: Props) {
  const style = STATUS_STYLE[status];

  return (
    <div className={`rounded-xl border p-4 ${style.wrapper}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="font-bold text-gray-900">{name}</div>
          <div className={`text-sm font-medium ${style.text}`}>{style.label}</div>
        </div>

        {guests && (
          <div className="flex items-center text-sm text-orange-600 gap-1">
            <Users size={14} />
            {guests}
          </div>
        )}
      </div>

      {status !== 'empty' && (
        <div className="mt-3 flex gap-2">
          <button onClick={onView} className="flex-1 py-1.5 rounded-lg bg-white text-sm border hover:bg-gray-50 text-gray-400">
            Xem đơn
          </button>
          <button className="flex-1 py-1.5 rounded-lg bg-orange-500 text-white text-sm hover:bg-orange-600">
            Thanh toán
          </button>
        </div>
      )}
    </div>
  );
}