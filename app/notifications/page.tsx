'use client';

import { ArrowLeft, Wifi, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LogoutConfirmModal from '@/components/LogoutConfirmModal';
import { fetchApi, API_BASE_URL } from '@/lib/api';
import { getAccessToken, clearSession } from '@/lib/auth';

export default function NotificationsPage() {
  const router = useRouter();
  const [newOrders, setNewOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingMap, setConfirmingMap] = useState<Record<string, boolean>>({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    try {
      const token = getAccessToken();

      // Load new orders from localStorage
      const stored = localStorage.getItem('newWaiterOrders');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Ensure each stored order has a unique notificationId
          const withIds = parsed.map((o: any) => ({
            ...o,
            notificationId: o.notificationId || Date.now() + Math.random(),
          }));
          setNewOrders(withIds);
        } catch (e) {
          console.warn('Failed to parse stored orders');
        }
      }

      // Only connect to socket if token exists
      if (!token) {
        setLoading(false);
        // Optionally redirect to the menu if no token - but allow viewing the page
        return;
      }

      // Connect to socket.io and listen for real-time updates
      (async () => {
        try {
          const mod = await import('socket.io-client');
          const { io } = mod;
          const socket = io(API_BASE_URL, { auth: { token } });
          socket.emit('join_waiter_room');

          socket.on('waiter_new_order', (order: any) => {
            setNewOrders((prev) => {
              // Check if this order already exists by ID
              if (prev.some((o) => o.id === order.id)) {
                return prev;
              }
              const updated = [
                { ...order, receivedAt: new Date().toISOString(), notificationId: Date.now() + Math.random() },
                ...prev,
              ];
              try {
                localStorage.setItem('newWaiterOrders', JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
          });

          return () => {
            socket.disconnect();
          };
        } catch (e) {
          console.warn('socket.io not available', e);
        }
      })();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const formatTimeAgo = (isoTime: string) => {
    try {
      const now = new Date();
      const received = new Date(isoTime);
      const diffMs = now.getTime() - received.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins === 1) return '1 phút trước';
      if (diffMins < 60) return `${diffMins} phút trước`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours === 1) return '1 giờ trước';
      if (diffHours < 24) return `${diffHours} giờ trước`;

      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} ngày trước`;
    } catch (e) {
      return 'Không rõ';
    }
  };

  const removeNotification = (notificationId: any) => {
    setNewOrders((prev) => {
      const updated = prev.filter((o) => o.notificationId !== notificationId);
      try {
        localStorage.setItem('newWaiterOrders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleConfirm = async (order: any) => {
    const notificationId = order?.notificationId;
    const orderId = order?.id;
    const key = String(notificationId ?? orderId ?? '');
    if (!orderId) {
      alert('Không tìm thấy mã đơn để xác nhận');
      return;
    }

    setConfirmingMap((prev) => ({ ...prev, [key]: true }));
    try {
      if (!getAccessToken()) {
        alert('Vui lòng đăng nhập lại');
        return;
      }

      const doRequest = async (method: 'POST' | 'PATCH') => {
        return await fetchApi(`/orders/${orderId}/next`, { method });
      };

      // Backend có thể implement "next" bằng POST hoặc PATCH.
      let res = await doRequest('POST');
      if (!res.ok) {
        const txt = await res.text();
        // Trường hợp backend không có route POST nhưng có PATCH (thường gặp)
        const shouldTryPatch =
          res.status === 404 &&
          (txt.includes('Cannot POST') || txt.includes('Not Found') || txt.includes('/orders/'));
        if (shouldTryPatch) {
          res = await doRequest('PATCH');
        } else {
          throw new Error(txt || 'Không thể xác nhận đơn');
        }
      }

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Không thể xác nhận đơn');
      }

      removeNotification(notificationId);
    } catch (e: any) {
      alert('Lỗi: ' + (e?.message || 'Lỗi kết nối'));
    } finally {
      setConfirmingMap((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const getItemCount = (order: any) => {
    if (!Array.isArray(order.items)) return 0;
    return order.items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-4 pt-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100">
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-lg font-bold">Đơn mới</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <Wifi size={14} />
              Trực tuyến
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="text-gray-600 hover:text-gray-800"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="mt-4 space-y-3">
          {loading && <div className="text-sm text-gray-500">Đang tải...</div>}

          {!loading && newOrders.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              Không có đơn mới
            </div>
          )}

          {!loading &&
            newOrders.map((order: any) => (
              <div key={order.notificationId || order.id} className="p-4 border rounded-lg">
                {/* Table info */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-500 text-white px-3 py-1 rounded font-bold text-sm">
                      {order.table?.number || 'B??'}
                    </div>
                    <div>
                      <div className="font-medium">Bàn {order.table?.number || '??'}</div>
                      <div className="text-sm text-gray-500">
                        🕐 {formatTimeAgo(order.receivedAt || new Date().toISOString())}
                      </div>
                    </div>
                  </div>
                  {order.items?.some((it: any) => it.note) && (
                    <div className="text-orange-600 text-sm font-medium">Có ghi chú</div>
                  )}
                </div>

                {/* Item count */}
                <div className="text-sm text-gray-600 mb-3">{getItemCount(order)} món</div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Navigate to order detail using tableId and orderId
                      if (order.tableId) {
                        router.push(`/dashboard/table/${order.tableId}/order/${order.id}`);
                      }
                    }}
                    className="flex-1 py-2 px-3 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium"
                  >
                    Xem
                  </button>
                  <button
                    onClick={() => handleConfirm(order)}
                    disabled={!!confirmingMap[String(order.notificationId ?? order.id ?? '')]}
                    className="flex-1 py-2 px-3 bg-orange-500 text-white rounded-lg text-sm font-medium"
                  >
                    {confirmingMap[String(order.notificationId ?? order.id ?? '')] ? 'Đang xác nhận...' : 'Xác nhận'}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      <LogoutConfirmModal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={clearSession}
      />
    </div>
  );
}
