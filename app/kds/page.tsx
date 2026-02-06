'use client';

import { ChevronRight, LogOut, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LogoutConfirmModal from '@/components/LogoutConfirmModal';

type Area = 'Bếp' | 'Bar';
type Status = 'Mới' | 'Đang làm' | 'Hoàn tất';

type KdsCard = {
  id: string;
  tableCode: string; // e.g. B02
  tableName: string; // e.g. B02
  minutesAgo: number;
  lines: string[];
  status: Status;
  area: Area;
  hasNote?: boolean;
};

const mapBackendStatusToColumn = (rawStatus: unknown): Status => {
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

export default function KdsPage() {
  const router = useRouter();
  const [area, setArea] = useState<Area>('Bar');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [cards, setCards] = useState<KdsCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let socket: any;
    (async () => {
      setError('');
      setLoading(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (!token) {
          if (typeof window !== 'undefined') window.location.href = '/';
          return;
        }

        // 1. Kết nối socket và join_chef_room
        try {
          const mod = await import('socket.io-client');
          const { io } = mod;
          socket = io('http://localhost:3000', { auth: { token } });
          socket.emit('join_chef_room');
        } catch (e) {
          console.warn('socket.io not available for chef room', e);
        }

        // 2. Gọi API lấy danh sách đơn cho KDS
        const res = await fetch('http://localhost:3000/orders/tables', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const txt = await res.text();
          setError(txt || 'Không thể tải danh sách đơn cho bếp/bar');
          return;
        }

        const data = await res.json();
        const list: any[] = Array.isArray(data) ? data : data?.orders || [];

        const mapped: KdsCard[] = list.map((o: any) => {
          const tableNumber = o?.table?.number || o?.table?.code || '—';
          const areaFromTable: Area =
            String(tableNumber).toUpperCase().startsWith('B') || String(tableNumber).toUpperCase().startsWith('BAR')
              ? 'Bar'
              : 'Bếp';

          const items = Array.isArray(o?.items) ? o.items : [];
          const lines = items.map((it: any) => {
            const qty = it?.quantity ?? 1;
            const name = it?.product?.name || 'Món';
            return `${qty}× ${name}`;
          });

          const hasNote = items.some((it: any) => !!it?.note);

          return {
            id: String(o.id ?? Math.random()),
            tableCode: String(tableNumber),
            tableName: String(tableNumber),
            minutesAgo: computeMinutesAgo(o.createdAt, o.updatedAt),
            lines,
            status: mapBackendStatusToColumn(o.status),
            area: areaFromTable,
            hasNote,
          } as KdsCard;
        });

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
        if (socket && socket.disconnect) socket.disconnect();
      } catch (e) {}
    };
  }, []);

  const filtered = cards.filter((c) => c.area === area);
  const byStatus = (s: Status) => filtered.filter((c) => c.status === s);

  const colNew = byStatus('Mới');
  const colDoing = byStatus('Đang làm');
  const colDone = byStatus('Hoàn tất');

  const Pill = ({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={[
        'px-3 py-1.5 rounded-full text-sm font-semibold transition',
        active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      ].join(' ')}
    >
      {children}
    </button>
  );

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
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-bold text-gray-900">{area}</div>
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

        <div className="mt-4 flex items-center gap-2">
          <Pill active={area === 'Bếp'} onClick={() => setArea('Bếp')}>
            Bếp
          </Pill>
          <Pill active={area === 'Bar'} onClick={() => setArea('Bar')}>
            Bar
          </Pill>
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
        onConfirm={() => {
          try {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userName');
            localStorage.removeItem('userRole');
            localStorage.removeItem('newWaiterOrders');
            localStorage.removeItem('paymentRequests');
          } catch (e) {}
          window.location.href = '/';
        }}
      />
    </div>
  );
}

