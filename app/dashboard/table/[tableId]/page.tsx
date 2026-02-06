'use client';

import { ArrowLeft, Wifi, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function TableOrdersPage() {
  const params = useParams();
  const router = useRouter();
  const tableIdParam = params?.tableId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [table, setTable] = useState<any | null>(null);

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
        console.log(data);
        const list = Array.isArray(data) ? data : data?.tables || [];

        // match by id or number
        const match = list.find((t: any) => String(t.id) === String(tableIdParam) || String(t.number) === String(tableIdParam));
        if (!match) {
          setError('Không tìm thấy thông tin bàn');
          setLoading(false);
          return;
        }
        console.log(match);
        setTable(match);
      } catch (e) {
        console.error(e);
        setError('Lỗi kết nối tới server');
      } finally {
        setLoading(false);
      }
    })();
  }, [tableIdParam, router]);

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="text-lg font-bold">{table?.number || `B${table?.id ?? tableIdParam}`}</div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Wifi size={14} />
              Trực tuyến
            </div>
          </div>
        </div>
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
        </div>

        <div className="mt-4">
          {loading && <div className="text-sm text-gray-500">Đang tải...</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}

          {!loading && !error && table && (
            <div className="mt-4 space-y-3">
              {(Array.isArray(table.orders) ? table.orders : []).map((o: any) => (
                <div key={o.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">Đơn #{o.id}</div>
                      <div className="text-sm text-gray-500">{o.status}</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="text-sm text-gray-500 mr-4">Tổng: {Number(o.totalAmount).toLocaleString('vi-VN')} ₫</div>
                      <button
                        onClick={() => router.push(`/dashboard/table/${table.id}/order/${o.id}`)}
                        className="py-1 px-3 rounded-lg bg-orange-500 text-white text-sm"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {(!Array.isArray(table.orders) || table.orders.length === 0) && (
                <div className="text-sm text-gray-500">Chưa có đơn cho bàn này</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
