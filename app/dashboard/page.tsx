'use client';

import { Bell, LogOut, Wifi } from 'lucide-react';
import { useState } from 'react';
import TableCard from '@/components/TableCard';
import FloorTabs from '@/components/FloorTabs';

export default function DashboardPage() {
  const [floor, setFloor] = useState(1);

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

  const tables = floor === 1 ? tablesFloor1 : tablesFloor2;

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
            <Bell size={18} className="text-gray-600" />
            <LogOut size={18} className="text-gray-600" />
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
    </div>
  );
}