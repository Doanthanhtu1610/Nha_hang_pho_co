'use client';

import { ArrowLeft, Wifi, Wallet, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

function formatCurrency(v: number) {
  return Number(v || 0).toLocaleString('vi-VN') + ' ₫';
}

export default function TablePaymentPage() {
  const params = useParams();
  const router = useRouter();
  const tableIdParam = params?.tableId as string | undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [table, setTable] = useState<any | null>(null);
  const [orderIds, setOrderIds] = useState<number[]>([]);
  const [allItems, setAllItems] = useState<{ quantity: number; name: string; price: number; lineTotal: number }[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (!tableIdParam) return;
    (async () => {
      setError('');
      setLoading(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (!token) {
          if (typeof window !== 'undefined') window.location.href = '/';
          return;
        }

        const res = await fetch('http://localhost:3000/tables/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setError('Không thể tải dữ liệu');
          setLoading(false);
          return;
        }

        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.tables || [];
        const match = list.find(
          (t: any) =>
            String(t.id) === String(tableIdParam) ||
            String(t.number) === String(tableIdParam) ||
            String(t.number) === tableIdParam
        );

        if (!match) {
          setError('Không tìm thấy thông tin bàn');
          setLoading(false);
          return;
        }

        setTable(match);
        const orders = Array.isArray(match.orders) ? match.orders : [];
        setOrderIds(orders.map((o: any) => o.id).filter((id: any) => id != null));
        const items: { quantity: number; name: string; price: number; lineTotal: number }[] = [];
        let total = 0;

        orders.forEach((order: any) => {
          const orderItems = Array.isArray(order.items) ? order.items : [];
          orderItems.forEach((it: any) => {
            const qty = it.quantity || 1;
            const price = Number(it.price || 0);
            const lineTotal = qty * price;
            items.push({
              quantity: qty,
              name: it.product?.name || 'Món',
              price,
              lineTotal,
            });
            total += lineTotal;
          });
        });

        setAllItems(items);
        setTotalAmount(total);
      } catch (e) {
        console.error(e);
        setError('Lỗi kết nối tới server');
      } finally {
        setLoading(false);
      }
    })();
  }, [tableIdParam]);

  const tableDisplayName =
    table?.number != null ? String(table.number) : table?.id != null ? `B${table?.id}` : tableIdParam || '—';

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Thanh toán</h1>
              <p className="text-sm text-gray-500">Bàn {tableDisplayName}</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <Wifi size={14} />
            Trực tuyến
          </span>
        </div>
      </div>

      <div className="px-4 pt-6">
        {loading && (
          <div className="text-gray-500 text-sm py-8">Đang tải...</div>
        )}
        {error && (
          <div className="text-red-600 text-sm py-4">{error}</div>
        )}

        {!loading && !error && (
          <>
            <h2 className="text-base font-semibold text-gray-800 mb-4">Chi tiết đơn</h2>
            <div className="space-y-3">
              {allItems.length === 0 ? (
                <p className="text-gray-500 text-sm">Chưa có món trong đơn.</p>
              ) : (
                allItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-gray-800"
                  >
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium">{formatCurrency(item.lineTotal)}</span>
                  </div>
                ))
              )}
            </div>

            {/* Tạm tính / Tổng cộng */}
            <div className="mt-6 bg-orange-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Tạm tính</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-orange-100">
                <span className="font-semibold text-gray-800">Tổng cộng (ước tính)</span>
                <span className="text-lg font-bold text-orange-600">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action buttons - fixed bottom */}
      {!loading && !error && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 space-y-3">
          <button
            onClick={async () => {
              const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
              if (!token) return;
              if (orderIds.length === 0) {
                setError('Không có đơn nào để thanh toán');
                return;
              }
              setCheckoutLoading(true);
              setError('');
              try {
                for (const orderId of orderIds) {
                  const res = await fetch(`http://localhost:3000/orders/${orderId}/checkout`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                  });
                  if (!res.ok) {
                    const body = await res.text();
                    throw new Error(body || `Thanh toán đơn #${orderId} thất bại`);
                  }
                }
                router.back();
              } catch (e: any) {
                setError(e?.message || 'Thanh toán thất bại');
              } finally {
                setCheckoutLoading(false);
              }
            }}
            disabled={checkoutLoading || orderIds.length === 0}
            className="w-full py-3.5 rounded-xl bg-orange-500 text-white font-semibold flex items-center justify-center gap-2 hover:bg-orange-600 disabled:opacity-60 disabled:pointer-events-none"
          >
            <Wallet size={20} />
            {checkoutLoading ? 'Đang xử lý...' : 'Thanh toán'}
          </button>
          <button
            onClick={() => {
              // In tạm tính - có thể mở print dialog hoặc gửi máy in
              if (typeof window !== 'undefined') window.print();
            }}
            className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-medium flex items-center justify-center gap-2 hover:bg-gray-200"
          >
            <Printer size={18} />
            In tạm tính
          </button>
        </div>
      )}
    </div>
  );
}
