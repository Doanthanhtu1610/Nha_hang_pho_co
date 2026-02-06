'use client';

import { Users, Wifi } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function LoginSuccessPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');

  const resolveRole = (): string => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
      if (stored) return String(stored);

      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) return '';

      const parts = token.split('.');
      if (parts.length < 2) return '';
      const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = payloadB64 + '='.repeat((4 - (payloadB64.length % 4)) % 4);
      const json = atob(padded);
      const payload = JSON.parse(json);
      const role =
        payload?.role ??
        payload?.userRole ??
        payload?.type ??
        (Array.isArray(payload?.roles) ? payload.roles[0] : '') ??
        '';

      if (role) {
        try {
          localStorage.setItem('userRole', String(role));
        } catch (e) {}
      }
      return String(role || '');
    } catch (e) {
      return '';
    }
  };

  useEffect(() => {
    try {
      const name = typeof window !== 'undefined' ? localStorage.getItem('userName') : null;
      setUserName(name || '');
    } catch (e) {
      setUserName('');
    }
  }, []);

  const welcomeName = userName.trim() || 'Nguyễn Văn A';

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center px-4">
      {/* Trực tuyến - badge xanh, chữ trắng */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-green-500 text-white text-sm font-medium px-3 py-1.5 rounded-full">
        <Wifi size={16} className="text-white" />
        Trực tuyến
      </div>

      {/* Nội dung chính */}
      <div className="text-center max-w-sm">
        {/* Icon hai người - xanh lá nhạt */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-200 flex items-center justify-center">
            <Users className="text-green-600" size={40} />
          </div>
        </div>

        <h1 className="text-xl font-bold text-black">
          Đăng nhập thành công!
        </h1>
        <p className="text-gray-900 text-base mt-2">
          Chào mừng {welcomeName}
        </p>

        <button
          onClick={() => {
            const role = resolveRole().toUpperCase().trim();
            if (role === 'CHEF') {
              router.push('/kds');
              return;
            }
            router.push('/dashboard');
          }}
          className="mt-8 w-full max-w-xs py-3.5 rounded-xl bg-orange-500 text-white font-bold shadow-sm hover:bg-orange-600 transition mx-auto block"
        >
          Bắt đầu ca
        </button>
      </div>
    </div>
  );
}