/** Trạng thái hiển thị trên KDS (Bếp) */
export type KdsStatus = 'Mới' | 'Đang làm' | 'Hoàn tất';

/** Card đơn hàng trên màn KDS */
export interface KdsCard {
  id: string;
  tableCode: string;
  tableName: string;
  minutesAgo: number;
  lines: string[];
  status: KdsStatus;
  hasNote?: boolean;
  rawStatus?: string;
}

/** Order item từ API */
export interface OrderItem {
  id?: number;
  quantity: number;
  note?: string | null;
  product?: { name?: string } | null;
}

/** Order detail từ API */
export interface OrderDetail {
  id: number | string;
  status?: string;
  table?: { id?: number | string; number?: string; code?: string } | null;
  items?: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
  totalAmount?: number;
}
