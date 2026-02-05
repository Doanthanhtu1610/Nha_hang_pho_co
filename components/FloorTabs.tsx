'use client'
interface Props {
  floor: number;
  setFloor: (n: number) => void;
}

export default function FloorTabs({ floor, setFloor }: Props) {
  return (
    <div className="flex gap-2 mt-2">
      {[1, 2].map((f) => (
        <button
          key={f}
          onClick={() => setFloor(f)}
          className={`px-3 py-1 rounded-full text-sm ${
            floor === f
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          Tầng {f}
        </button>
      ))}
    </div>
  );
}