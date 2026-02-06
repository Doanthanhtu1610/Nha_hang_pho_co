'use client';

import { LogOut } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutConfirmModal({ open, onClose, onConfirm }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center">
            <LogOut className="text-orange-500" size={28} />
          </div>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          Xác nhận đăng xuất
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
