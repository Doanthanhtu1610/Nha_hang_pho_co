'use client';

import { User, Wifi } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FFF7ED] flex items-center justify-center px-4">
      
      {/* Status */}
      <div className="absolute top-4 right-4 flex items-center gap-1 text-green-600 text-sm">
        <Wifi size={16} />
        Trực tuyến
      </div>

      {/* Content */}
      <div className="text-center">
        
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <User className="text-green-600" size={28} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900">
          Đăng nhập thành công!
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Chào mừng Nguyễn Văn A
        </p>

        {/* Button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-6 w-64 py-3 rounded-xl bg-orange-500 text-white font-medium shadow-md hover:bg-orange-600 transition"
        >
          Bắt đầu ca
        </button>
      </div>
    </div>
  );
}