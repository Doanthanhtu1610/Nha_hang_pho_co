'use client';

import { ArrowLeft, User, Eye, Wifi } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  return (
    <div className="min-h-screen bg-[#FFF7ED] flex items-center justify-center px-4">
      
      {/* Back & status */}
      <div className="absolute top-4 left-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-200"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="absolute top-4 right-4 flex items-center gap-1 text-green-600 text-sm">
        <Wifi size={16} />
        Trực tuyến
      </div>

      {/* Card */}
      <div className="w-full max-w-sm text-center">
        
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-xl bg-orange-500 flex items-center justify-center">
            <User className="text-white" size={26} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900">
          Đăng nhập nhân viên
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Nhà hàng Phố Cổ
        </p>

        {/* Form */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-5 text-left">
          {/* Username */}
          <label className="text-sm text-gray-600">Tài khoản</label>
          <input
            type="text"
            placeholder="Nhập tài khoản"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 mb-4 w-full px-4 py-2 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
          />

          {/* Password */}
          <label className="text-sm text-gray-600">Mật khẩu</label>
          <div className="relative mt-1 mb-4">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <Eye size={18} />
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-600 mb-3">{error}</div>
          )}

          {/* Submit */}
          <button
            onClick={async () => {
              setError('');
              setLoading(true);
              try {
                const res = await fetch('http://localhost:3000/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ username, password: password }),
                });

                const data = await res.json();
                if (!res.ok) {
                  setError(data?.message || 'Đăng nhập thất bại');
                  setLoading(false);
                  return;
                }

                const token = data?.access_token || data?.token || null;
                if (!token) {
                  setError('Không nhận được access token');
                  setLoading(false);
                  return;
                }

                const roleRaw =
                  data?.role ??
                  data?.user?.role ??
                  data?.user?.type ??
                  data?.user?.position ??
                  data?.user?.job ??
                  null;

                const userName =
                  data?.username ??
                  data?.user?.username ??
                  data?.user?.name ??
                  data?.fullName ??
                  '';

                try {
                  localStorage.setItem('accessToken', token);
                  if (userName) localStorage.setItem('userName', String(userName));
                  if (roleRaw) localStorage.setItem('userRole', String(roleRaw));
                } catch (e) {
                  // ignore storage errors
                }

                router.push('/login-success');
              } catch (err) {
                setError('Lỗi kết nối tới server');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition disabled:opacity-60"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}
