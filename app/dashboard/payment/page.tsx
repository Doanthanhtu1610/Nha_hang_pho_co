'use client';

import { Wallet, Wifi, LogOut, LayoutGrid, Clock, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LogoutConfirmModal from '@/components/LogoutConfirmModal';
import { fetchApi, API_BASE_URL } from '@/lib/api';
import { getAccessToken, redirectToLoginIfNeeded, clearSession } from '@/lib/auth';

const STORAGE_KEY = 'paymentRequests';

type PaymentRequest = { tableNumber: string; requestedAt: string };

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

function formatCurrency(v: number) {
  return Number(v || 0).toLocaleString('vi-VN') + ' ₫';
}

export default function PaymentPage() {
  const router = useRouter();
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [tablesWithOrders, setTablesWithOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    let socket: any;
    (async () => {
      if (redirectToLoginIfNeeded()) return;
      const token = getAccessToken();

      try {
        const pr = localStorage.getItem(STORAGE_KEY);
        if (pr) {
          const parsed = JSON.parse(pr);
          if (Array.isArray(parsed)) setPaymentRequests(parsed);
        }
      } catch (e) {}

      try {
        const mod = await import('socket.io-client');
        const { io } = mod;
        socket = io(API_BASE_URL, { auth: { token } });
        socket.emit('join_waiter_room');
        socket.on('waiter_notification', (data: { type?: string; tableNumber?: string | number; message?: string }) => {
          if (data?.type !== 'SERVER_REQUEST' || data.tableNumber == null) return;
          const key = String(data.tableNumber).trim();
          if (!key) return;
          const content = (data.message || '').toLowerCase().trim();
          if (!content.includes('thanh toán') && content !== 'thanh toán') return;
          setPaymentRequests((prev) => {
            if (prev.some((p) => p.tableNumber === key)) return prev;
            const next = [...prev, { tableNumber: key, requestedAt: new Date().toISOString() }];
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch (e) {}
            return next;
          });
        });
      } catch (e) {
        console.warn('socket not available', e);
      }

      try {
        const res = await fetchApi('/tables/orders');
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data?.tables || [];
          setTablesWithOrders(list);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      try {
        if (socket && socket.disconnect) socket.disconnect();
      } catch (e) {}
    };
  }, []);

  const removePaymentRequest = (tableNumber: string) => {
    setPaymentRequests((prev) => {
      const next = prev.filter((p) => p.tableNumber !== tableNumber);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('paymentRequestsUpdated'));
      } catch (e) {}
      return next;
    });
  };

  // Ghép yêu cầu thanh toán với dữ liệu bàn/đơn từ API (backend có thể gửi "B02" hoặc "2")
  const tableKeyMatch = (t: any, key: string) => {
    const num = t.number != null ? String(t.number) : null;
    const idStr = t.id != null ? `B${t.id}` : null;
    const normalized = /^\d+$/.test(key) ? `B${key.padStart(2, '0')}` : key;
    return (
      key === num ||
      key === idStr ||
      normalized === num ||
      normalized === idStr ||
      (t.number && String(t.number) === key)
    );
  };

  const cards = paymentRequests.map((req) => {
    const table = tablesWithOrders.find((t: any) => tableKeyMatch(t, req.tableNumber));
    const orders = table && Array.isArray(table.orders) ? table.orders : [];
    const order = orders[0];
    const tableName = table?.number || req.tableNumber;
    const displayName = String(tableName).startsWith('B') ? tableName : `B${tableName}`;
    const items = order && Array.isArray(order.items) ? order.items : [];
    const total = order?.totalAmount ?? items.reduce((s: number, it: any) => s + (it.quantity || 0) * (it.price || 0), 0);
    return {
      tableNumber: req.tableNumber,
      displayName: String(displayName),
      requestedAt: req.requestedAt,
      items,
      total,
      tableId: table?.id,
      orderId: order?.id,
    };
  });

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Nhân viên phục vụ</h1>
            <p className="text-sm text-gray-500 font-medium">Nguyễn Văn A</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-green-600 text-sm">
              <Wifi size={14} />
              Trực tuyến
            </span>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-800 p-1"
              title="Sơ đồ"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="text-gray-600 hover:text-gray-800 p-1"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Yêu cầu thanh toán ({paymentRequests.length})
        </h2>

        {loading && (
          <div className="mt-4 text-gray-500 text-sm">Đang tải...</div>
        )}

        {!loading && cards.length === 0 && (
          <div className="mt-6 bg-white rounded-xl p-6 text-center text-gray-500">
            Chưa có yêu cầu thanh toán nào.
          </div>
        )}

        <div className="mt-4 space-y-4">
          {cards.map((card) => (
            <div
              key={card.tableNumber}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-orange-500 text-white text-sm font-medium rounded-lg px-2.5 py-1">
                      {card.displayName}
                    </span>
                    <span className="font-semibold text-gray-800">Bàn {card.displayName}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-600">
                      {formatCurrency(card.total)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-1 text-gray-500 text-sm">
                  <Clock size={14} />
                  {timeAgo(card.requestedAt)}
                </div>

                <div className="mt-4 space-y-2">
                  {card.items.length === 0 ? (
                    <div className="text-sm text-gray-400">Chưa có món trong đơn</div>
                  ) : (
                    card.items.map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {it.quantity || 1}× {it.product?.name || 'Món'}
                        </span>
                        <span className="text-gray-600">
                          {formatCurrency((it.quantity || 1) * (it.price || 0))}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => {
                    removePaymentRequest(card.tableNumber);
                    const tableId = card.tableId ?? card.tableNumber;
                    if (tableId) {
                      router.push(`/dashboard/table/${tableId}/payment`);
                    }
                  }}
                  className="mt-4 w-full py-3 rounded-xl bg-orange-500 text-white font-medium flex items-center justify-center gap-2 hover:bg-orange-600"
                >
                  <CheckCircle size={18} />
                  Thanh toán
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white flex">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex-1 py-3 text-gray-400 flex flex-col items-center gap-0.5"
        >
          <LayoutGrid size={20} />
          Sơ đồ
        </button>
        <button className="flex-1 py-3 text-orange-500 font-medium flex flex-col items-center gap-0.5 relative">
          <Wallet size={20} />
          Thanh toán
          {paymentRequests.length > 0 && (
            <span className="absolute top-1.5 right-1/4 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {paymentRequests.length}
            </span>
          )}
        </button>
      </div>

      <LogoutConfirmModal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={clearSession}
      />
    </div>
  );
}
