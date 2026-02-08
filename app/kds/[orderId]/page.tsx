'use client';

import { ArrowLeft, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { getAccessToken, redirectToLoginIfNeeded } from '@/lib/auth';
import type { OrderDetail } from '@/types';

type Area = 'Bếp' | 'Bar';

const mapStatusLabel = (raw?: string) => {
  const s = String(raw || '').toUpperCase();
  if (!s) return 'Mới';
  if (['NEW', 'WAITING', 'PENDING'].includes(s)) return 'Mới';
  if (['IN_PROGRESS', 'COOKING', 'PREPARING'].includes(s)) return 'Đang làm';
  if (['DONE', 'COMPLETED', 'FINISHED', 'PAID'].includes(s)) return 'Hoàn tất';
  return 'Mới';
};

const computeTimeAgo = (createdAt?: string, updatedAt?: string): string => {
  try {
    const src = createdAt || updatedAt;
    if (!src) return '—';
    const t = new Date(src);
    if (Number.isNaN(t.getTime())) return '—';
    const diffMs = Date.now() - t.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins === 1) return '1 phút trước';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours === 1) return '1 giờ trước';
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  } catch {
    return '—';
  }
};

const detectArea = (tableNumber?: string): Area => {
  const n = String(tableNumber || '').toUpperCase();
  if (n.startsWith('B') || n.startsWith('BAR')) return 'Bar';
  return 'Bếp';
};

export default function KdsOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderIdParam = params?.orderId as string | undefined;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!orderIdParam) return;
    (async () => {
      setError('');
      setLoading(true);
      try {
        if (redirectToLoginIfNeeded()) return;

        const res = await fetchApi(`/orders/${orderIdParam}`);

        if (!res.ok) {
          const txt = await res.text();
          setError(txt || 'Không thể tải chi tiết đơn bếp');
          return;
        }

        const data = await res.json();
        setOrder(data);
      } catch (e) {
        console.error(e);
        setError('Lỗi kết nối tới server');
      } finally {
        setLoading(false);
      }
    })();
  }, [orderIdParam]);

  const ticketCode = order ? `TKT${String(order.id).padStart(3, '0')}` : '';
  const tableNumber = order?.table?.number || '—';
  const area: Area = detectArea(tableNumber);
  const timeAgo = computeTimeAgo(order?.createdAt, order?.updatedAt);

  const items = Array.isArray(order?.items) ? order!.items! : [];

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="px-4 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Chi tiết bếp</div>
              <h1 className="text-lg font-bold text-gray-900">
                Ticket #{ticketCode || '—'}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Bàn {tableNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              <Wifi size={14} />
              Trực tuyến
            </div>
          </div>
        </div>

        {/* Status pill */}
        <div className="mt-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-sm font-semibold text-blue-700">
              {mapStatusLabel(order?.status)}
            </span>
          </div>
        </div>

        {/* Meta info */}
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Bàn</span>
            <span className="font-semibold text-gray-900">{tableNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Thời gian</span>
            <span className="font-semibold text-gray-900">{timeAgo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Khu vực</span>
            <span className="font-semibold text-gray-900">{area}</span>
          </div>
        </div>

        {/* Items */}
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Danh sách món</h2>

          {loading && <div className="text-sm text-gray-500">Đang tải...</div>}
          {error && !loading && <div className="text-sm text-red-600">{error}</div>}

          {!loading && !error && (
            <div className="space-y-2">
              {items.length === 0 && (
                <div className="text-sm text-gray-500">Chưa có món trong đơn.</div>
              )}
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-gray-50 px-4 py-3"
                >
                  <div className="font-semibold text-gray-900">
                    {it.product?.name || 'Món'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Số lượng: {it.quantity ?? 1}
                  </div>
                  {it.note && (
                    <div className="mt-1 text-xs text-orange-600 bg-orange-50 inline-flex px-2 py-1 rounded-full">
                      {it.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      {!loading && !error && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 pb-6 pt-3 space-y-2">
          <button
            className="w-full py-3 rounded-xl bg-orange-500 text-white font-semibold text-sm disabled:opacity-60 disabled:pointer-events-none"
            disabled={starting}
            onClick={async () => {
              if (!orderIdParam) return;
              setStarting(true);
              try {
                if (!getAccessToken()) {
                  alert('Vui lòng đăng nhập lại');
                  return;
                }

                const doRequest = async (method: 'POST' | 'PATCH') => {
                  return await fetchApi(`/orders/${orderIdParam}/next`, { method });
                };

                // Thử POST trước, nếu backend không hỗ trợ POST thì fallback sang PATCH
                let res = await doRequest('POST');
                if (!res.ok) {
                  const txt = await res.text();
                  const shouldTryPatch =
                    res.status === 404 &&
                    (txt.includes('Cannot POST') || txt.includes('Not Found') || txt.includes('/orders/'));
                  if (shouldTryPatch) {
                    res = await doRequest('PATCH');
                  } else {
                    throw new Error(txt || 'Không thể cập nhật trạng thái đơn');
                  }
                }

                if (!res.ok) {
                  const txt = await res.text();
                  throw new Error(txt || 'Không thể cập nhật trạng thái đơn');
                }

                // Quay lại trang tổng quan KDS để danh sách tự load lại và cập nhật
                router.push('/kds');
                return;
              } catch (e: any) {
                alert('Lỗi: ' + (e?.message || 'Không thể bắt đầu đơn'));
              } finally {
                setStarting(false);
              }
            }}
          >
            {starting ? 'Đang bắt đầu...' : '▶ Bắt đầu'}
          </button>
          <button
            className="w-full py-3 rounded-xl bg-gray-100 text-gray-800 font-semibold text-sm"
            onClick={() => {
              alert('Chức năng Cần xác nhận lại sẽ được nối với API khi có spec từ backend.');
            }}
          >
            Cần xác nhận lại
          </button>
        </div>
      )}
    </div>
  );
}

