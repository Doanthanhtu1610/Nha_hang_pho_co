'use client';

import { ArrowLeft, Wifi, Edit3, Trash2, CheckCircle, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tableIdParam = params?.tableId;
  const orderIdParam = params?.orderId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [table, setTable] = useState<any | null>(null);
  const [order, setOrder] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      setError('');
      setLoading(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (!token) {
          if (typeof window !== 'undefined') window.location.href = 'http://10.191.32.119:3001/';
          return;
        }

        const res = await fetch('http://localhost:3000/tables/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const txt = await res.text();
          setError(txt || 'Không thể tải dữ liệu');
          setLoading(false);
          return;
        }

        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.tables || [];

        const match = list.find((t: any) => String(t.id) === String(tableIdParam) || String(t.number) === String(tableIdParam));
        if (!match) {
          setError('Không tìm thấy thông tin bàn');
          setLoading(false);
          return;
        }

        setTable(match);
        const found = (Array.isArray(match.orders) ? match.orders : []).find((o: any) => String(o.id) === String(orderIdParam));
        if (!found) {
          setError('Không tìm thấy đơn hàng');
          setLoading(false);
          return;
        }

        setOrder(found);
      } catch (e) {
        console.error(e);
        setError('Lỗi kết nối tới server');
      } finally {
        setLoading(false);
      }
    })();
  }, [tableIdParam, orderIdParam, router]);

  const formatCurrency = (v: number) => Number(v || 0).toLocaleString('vi-VN') + ' ₫';
  const orderCode = order ? `ORD${String(order.id).padStart(3, '0')}` : '';

  return (
    <div className="min-h-screen bg-white pb-28">
      <div className="px-4 pt-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-bold">Chi tiết đơn</h1>
              <div className="text-sm text-gray-500">Bàn {table?.number || `B${table?.id ?? tableIdParam}`}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-green-600 text-sm">
              <Wifi size={14} />
              Trực tuyến
            </span>
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

        <div className="mt-4 bg-amber-50 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-500">Mã đơn</div>
              <div className="font-medium">{orderCode}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Bàn</div>
              <div className="font-medium">{table?.number || `B${table?.id ?? tableIdParam}`}</div>
            </div>
          </div>
        </div>

        <h2 className="mt-6 font-medium">Danh sách món</h2>

        <div className="mt-3 space-y-3">
          {loading && <div className="text-sm text-gray-500">Đang tải...</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}

          {!loading && !error && order && (
            <>
              <div className="space-y-2">
                {Array.isArray(order.items) && order.items.map((it: any) => (
                  <div key={it.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="font-medium">{it.product?.name || 'Sản phẩm'}</div>
                    <div className="text-sm text-gray-500 mt-1">SL: {it.quantity}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-xl flex justify-between items-center">
                <div className="font-medium">Tổng cộng</div>
                <div className="text-orange-600 font-semibold">{formatCurrency(order.totalAmount)}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="fixed bottom-4 left-0 right-0 px-4">
        <div className="space-y-3">
          <button className="w-full py-3 bg-orange-500 text-white rounded-xl flex items-center justify-center gap-2">
            <CheckCircle size={16} />
            Xác nhận đơn
          </button>

          <div className="flex gap-3">
            <button className="flex-1 py-3 bg-white border rounded-xl flex items-center justify-center gap-2">
              <Edit3 size={14} />
              Chỉnh sửa
            </button>
            <button className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-2">
              <Trash2 size={14} />
              Hủy đơn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
