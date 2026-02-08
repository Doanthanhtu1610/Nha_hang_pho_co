'use client';

import { ChevronRight, LogOut, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LogoutConfirmModal from '@/components/LogoutConfirmModal';
import { fetchApi, API_BASE_URL } from '@/lib/api';
import { getAccessToken, redirectToLoginIfNeeded, clearSession } from '@/lib/auth';
import type { KdsCard, KdsStatus } from '@/types';

const mapBackendStatusToColumn = (rawStatus: unknown): KdsStatus => {
  const s = String(rawStatus || '').toUpperCase();
  if (!s) return 'Mới';
  if (['NEW', 'WAITING', 'PENDING'].includes(s)) return 'Mới';
  if (['IN_PROGRESS', 'COOKING', 'PREPARING'].includes(s)) return 'Đang làm';
  if (['DONE', 'COMPLETED', 'FINISHED', 'PAID'].includes(s)) return 'Hoàn tất';
  return 'Mới';
};

const computeMinutesAgo = (createdAt?: string, updatedAt?: string): number => {
  try {
    const src = createdAt || updatedAt;
    if (!src) return 0;
    const t = new Date(src);
    if (Number.isNaN(t.getTime())) return 0;
    const diffMs = Date.now() - t.getTime();
    const mins = Math.floor(diffMs / 60000);
    return mins < 0 ? 0 : mins;
  } catch {
    return 0;
  }
};

/** Map raw order (API hoặc socket) sang KdsCard – tất cả hiển thị bên Bếp */
const mapOrderToKdsCard = (o: any): KdsCard => {
  const tableNumber = o?.table?.number ?? o?.table?.code ?? '—';

  const items = Array.isArray(o?.items) ? o.items : [];
  const lines = items.map((it: any) => {
    const qty = it?.quantity ?? 1;
    const name = it?.product?.name ?? 'Món';
    return `${qty}× ${name}`;
  });

  const hasNote = items.some((it: any) => !!it?.note);

  const rawStatus = o?.status != null ? String(o.status) : undefined;

  return {
    id: String(o.id ?? Math.random()),
    tableCode: String(tableNumber),
    tableName: String(tableNumber),
    minutesAgo: computeMinutesAgo(o.createdAt, o.updatedAt),
    lines,
    status: mapBackendStatusToColumn(o.status),
    hasNote,
    rawStatus,
  };
};

export default function KdsPage() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [cards, setCards] = useState<KdsCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  /** Đơn hàng mới vừa được xác nhận – hiển thị thông báo */
  const [newOrderNotification, setNewOrderNotification] = useState<KdsCard | null>(null);

  useEffect(() => {
    let socket: any;
    (async () => {
      setError('');
      setLoading(true);
      try {
        if (redirectToLoginIfNeeded()) return;
        const token = getAccessToken();

        // 1. Kết nối socket, join_chef_room và lắng nghe đơn mới xác nhận (notifyChefNewConfirmedOrder)
        try {
          const mod = await import('socket.io-client');
          const { io } = mod;
          socket = io(API_BASE_URL, { auth: { token } });
          socket.emit('join_chef_room');

          socket.on('chef_new_confirmed_order', (order: any) => {
            const newCard = mapOrderToKdsCard(order);
            setCards((prev) => [newCard, ...prev]);
            setNewOrderNotification(newCard);
            setTimeout(() => setNewOrderNotification(null), 5000);
          });
        } catch (e) {
          console.warn('socket.io not available for chef room', e);
        }

        // 2. Gọi API lấy danh sách đơn cho KDS
        const res = await fetchApi('/orders/tables');

        if (!res.ok) {
          const txt = await res.text();
          setError(txt || 'Không thể tải danh sách đơn cho bếp/bar');
          return;
        }

        const data = await res.json();
        const list: any[] = Array.isArray(data) ? data : data?.orders || [];
        const mapped: KdsCard[] = list.map((o: any) => mapOrderToKdsCard(o));

        setCards(mapped);
      } catch (e) {
        console.error(e);
        setError('Lỗi kết nối tới server');
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      try {
        if (socket) {
          socket.off('chef_new_confirmed_order');
          if (socket.disconnect) socket.disconnect();
        }
      } catch (e) {}
    };
  }, []);

  /** Tất cả đơn hiển thị bên Bếp, không lọc theo Bar */
  const byStatus = (s: KdsStatus) => cards.filter((c) => c.status === s);

  /** Cột "Mới" chỉ hiển thị đơn có trạng thái CONFIRMED (backend dùng COMFIRMED) */
  const isConfirmed = (raw?: string) => {
    const s = String(raw || '').toUpperCase();
    return s === 'CONFIRMED' || s === 'COMFIRMED';
  };
  const colNew = cards.filter((c) => c.status === 'Mới' && isConfirmed(c.rawStatus));
  const colDoing = byStatus('Đang làm');
  const colDone = byStatus('Hoàn tất');

  const Column = ({
    title,
    count,
    tint,
    items,
  }: {
    title: string;
    count: number;
    tint: 'blue' | 'orange' | 'green';
    items: KdsCard[];
  }) => {
    const headerBg =
      tint === 'blue' ? 'bg-blue-50 text-blue-700' : tint === 'orange' ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700';
    const badgeBg =
      tint === 'blue' ? 'bg-blue-600' : tint === 'orange' ? 'bg-orange-600' : 'bg-green-600';

    return (
      <div className="flex-1 min-w-0">
        <div className={`rounded-xl px-3 py-2 flex items-center justify-between ${headerBg}`}>
          <span className="font-bold text-sm">{title}</span>
          <span className={`${badgeBg} text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center`}>
            {count}
          </span>
        </div>

        <div className="mt-3 space-y-3">
          {items.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 cursor-pointer hover:border-orange-300 hover:shadow-md transition"
              onClick={() => router.push(`/kds/${c.id}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-lg">
                    {c.tableCode}
                  </span>
                  <div className="font-semibold text-gray-900">{c.tableName}</div>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <span>🕒</span>
                  <span>{c.minutesAgo}m</span>
                </div>
              </div>

              <div className="mt-2 space-y-1 text-sm text-gray-700">
                {c.lines.map((l, idx) => (
                  <div key={idx}>{l}</div>
                ))}
              </div>

              {c.hasNote && (
                <div className="mt-2 inline-flex items-center text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                  ít đá
                </div>
              )}

              <button
                type="button"
                className="mt-2 w-full text-sm text-gray-500 flex items-center justify-end gap-1 hover:text-gray-700"
              >
                Chi tiết <ChevronRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 pt-4">
        {newOrderNotification && (
          <div
            className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300"
            role="alert"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-green-800 text-sm">🔔 Đơn hàng mới được xác nhận</p>
                <p className="mt-1 text-green-700 text-sm">
                  Bàn <span className="font-semibold">{newOrderNotification.tableName}</span>
                  {newOrderNotification.lines.length > 0 && (
                    <span className="text-green-600">
                      — {newOrderNotification.lines.slice(0, 3).join(', ')}
                      {newOrderNotification.lines.length > 3 && '...'}
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewOrderNotification(null)}
                className="text-green-600 hover:text-green-800 text-sm font-medium shrink-0"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-bold text-gray-900">Bếp</div>
            <div className="text-sm text-gray-500 -mt-0.5">KDS Board</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-green-50 text-green-700 text-sm font-semibold px-3 py-1.5 rounded-full">
              <Wifi size={16} />
              Trực tuyến
            </div>
            <button onClick={() => setShowLogoutModal(true)} className="text-gray-600 hover:text-gray-800">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <Column title="Mới" count={colNew.length} tint="blue" items={colNew} />
          <Column title="Đang làm" count={colDoing.length} tint="orange" items={colDoing} />
          <Column title="Hoàn tất" count={colDone.length} tint="green" items={colDone} />
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

