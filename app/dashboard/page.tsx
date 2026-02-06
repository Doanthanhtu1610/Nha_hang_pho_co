"use client";

import { Bell, LogOut, Wifi } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TableCard from '@/components/TableCard';
import FloorTabs from '@/components/FloorTabs';

export default function DashboardPage() {
  const router = useRouter();
  const [floor, setFloor] = useState(1);
  const [orders, setOrders] = useState<any[] | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<any[] | null>(null);
  const [newOrders, setNewOrders] = useState<any[]>([]);

  const tablesFloor1 = [
    { name: 'B01', status: 'empty' },
    { name: 'B02', status: 'serving', guests: 4 },
    { name: 'B03', status: 'serving', guests: 2 },
    { name: 'B04', status: 'help', guests: 3 },
    { name: 'B05', status: 'empty' },
    { name: 'B06', status: 'serving', guests: 2 },
  ];

  const tablesFloor2 = [
    { name: 'B07', status: 'empty' },
    { name: 'B08', status: 'serving', guests: 6 },
    { name: 'B09', status: 'empty' },
    { name: 'B10', status: 'serving', guests: 2 },
  ];

  // If we have orders from the API, derive tables from that data
  const tables =
    orders && Array.isArray(orders)
      ? orders
          .filter((t) => t.floorId === floor)
          .map((t) => {
            const tableOrders = Array.isArray(t.orders) ? t.orders : [];
            let status: any = 'empty';
            if (tableOrders.some((o: any) => o.status === 'HELP')) status = 'help';
            else if (tableOrders.length > 0) status = 'serving';

            const guests = tableOrders.reduce((acc: number, o: any) => {
              if (!Array.isArray(o.items)) return acc;
              return acc + o.items.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
            }, 0);

            return { id: t.id, floorId: t.floorId, number: t.number, name: t.number || `B${t.id}`, status, guests: guests || undefined, orders: tableOrders };
          })
      : floor === 1
      ? tablesFloor1
      : tablesFloor2;

  useEffect(() => {
    let socket: any;
    (async () => {
      setFetchError('');
      setLoadingOrders(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (!token) {
          if (typeof window !== 'undefined') window.location.href = 'http://10.191.32.119:3001/';
          return;
        }

        // Connect with socket.io-client if available and emit join_waiter_room
        try {
          const mod = await import('socket.io-client');
          const { io } = mod;
          socket = io('http://localhost:3000', { auth: { token } });
          socket.emit('join_waiter_room');

          // Load any stored new orders from localStorage
          try {
            const stored = localStorage.getItem('newWaiterOrders');
            if (stored) {
              const parsed = JSON.parse(stored);
              // Ensure each stored order has a unique notificationId
              const withIds = parsed.map((o: any) => ({
                ...o,
                notificationId: o.notificationId || Date.now() + Math.random(),
              }));
              setNewOrders(withIds);
            }
          } catch (e) {
            console.warn('Failed to load stored orders');
          }

          // Listen for new order events
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
        } catch (e) {
          // socket.io-client not available or connect failed — ignore but continue
          console.warn('socket.io not available or failed to connect', e);
        }

        // Fetch tables/orders
        const res = await fetch('http://localhost:3000/tables/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const body = await res.text();
          setFetchError(body || 'Failed to fetch orders');
          setLoadingOrders(false);
          return;
        }

        const data = await res.json();
        console.log(data);
        // Expecting an array of table objects
        if (Array.isArray(data)) setOrders(data);
        else setOrders(data?.tables || null);
      } catch (err) {
        console.error(err);
        setFetchError('Lỗi khi tải danh sách bàn');
      } finally {
        setLoadingOrders(false);
      }
    })();

    return () => {
      try {
        if (socket && socket.disconnect) socket.disconnect();
      } catch (e) {}
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="px-4 pt-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Sơ đồ bàn</h1>
            <p className="text-sm text-gray-500 font-medium">Nguyễn Văn A</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-green-600 text-sm">
              <Wifi size={14} />
              Trực tuyến
            </span>
            <button 
              onClick={() => router.push('/notifications')}
              className="relative text-gray-600 hover:text-gray-800"
            >
              <Bell size={18} />
              {newOrders.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {newOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem('accessToken');
                  localStorage.removeItem('newWaiterOrders');
                } catch (e) {}
                window.location.href = 'http://10.191.32.119:3001/';
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <FloorTabs floor={floor} setFloor={setFloor} />

        {/* Legend */}
        <div className="mt-4 bg-gray-50 rounded-xl p-3 text-sm flex gap-4">
          <span className="flex items-center gap-1">
            ⬜ Trống
          </span>
          <span className="flex items-center gap-1 text-orange-600">
            🟧 Đang phục vụ
          </span>
          <span className="flex items-center gap-1 text-red-600">
            🟥 Cần hỗ trợ
          </span>
        </div>
      </div>

      {/* Tables */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-4">
        {tables.map((t) => (
            <TableCard
              key={t.name}
              name={t.name}
              status={t.status as any}
              guests={t.guests}
              onView={() => {
                // If table has orders, navigate directly to the first order's detail page.
                const id = t.id ?? t.name;
                if (t.orders && t.orders.length > 0) {
                  const oid = t.orders[0].id;
                  if (id && oid) router.push(`/dashboard/table/${id}/order/${oid}`);
                  return;
                }

                // Otherwise, go to the table page
                if (id) router.push(`/dashboard/table/${id}`);
              }}
            />
          ))}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white flex">
        <button className="flex-1 py-3 text-orange-500 font-medium">
          Sơ đồ
        </button>
        <button className="flex-1 py-3 text-gray-400">
          Thanh toán
        </button>
      </div>

      {/* Orders Modal */}
      {modalOpen && selectedOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md mx-4 bg-white rounded-xl p-4 z-10">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold">Thông tin đơn</h2>
              <button className="text-gray-500" onClick={() => setModalOpen(false)}>Đóng</button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {selectedOrders.map((o: any) => (
                <div key={o.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">Đơn #{o.id}</div>
                    <div className="text-sm text-gray-500">{o.status}</div>
                  </div>
                  <div className="text-sm text-gray-500">Tổng: {o.totalAmount}</div>
                  <div className="mt-2 space-y-1">
                    {Array.isArray(o.items) && o.items.map((it: any) => (
                      <div key={it.id} className="text-sm">
                        {it.quantity} × {it.product?.name || 'Sản phẩm'} {it.note ? `— ${it.note}` : ''}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}