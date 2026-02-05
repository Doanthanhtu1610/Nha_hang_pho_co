'use client';

import { Utensils, User, Flame, UserCog, CircleDollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleNavigate = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF7ED]">
      <div className="w-full max-w-sm text-center px-6">
        
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-xl bg-orange-500 flex items-center justify-center">
            <Utensils className="text-white" size={28} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900">
          Nhà hàng Phố Cổ
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Chọn ứng dụng để tiếp tục
        </p>

        {/* Buttons */}
        <div className="mt-6 space-y-4">
          <button onClick={handleNavigate} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 text-white font-medium shadow-md hover:bg-orange-600 transition">
            <User size={18} />
            Nhân viên phục vụ
          </button>

          <button onClick={handleNavigate} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-800 text-white font-medium shadow-md hover:bg-gray-900 transition">
            <Flame size={18} />
            Bếp / Bar
          </button>

        </div>
      </div>
    </div>
  );
}