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
  const [editMode, setEditMode] = useState(false);
  const [editedItems, setEditedItems] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchProduct, setSearchProduct] = useState('');

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
        if (Array.isArray(found.items)) {
          setEditedItems(found.items.map((item: any) => ({ ...item })));
        }
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

        <div className="mt-6 flex justify-between items-center">
          <h2 className="font-medium">Danh sách món</h2>
          {editMode && (
            <button
              onClick={async () => {
                setShowAddModal(true);
                setProductsLoading(true);
                try {
                  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
                  const res = await fetch('http://localhost:3000/products', {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setProducts(Array.isArray(data) ? data : data?.products || []);
                  }
                } catch (e) {
                  console.error('Failed to fetch products', e);
                } finally {
                  setProductsLoading(false);
                }
              }}
              className="py-1 px-3 bg-orange-500 text-white rounded-lg text-sm font-medium"
            >
              + Thêm món
            </button>
          )}
        </div>

        <div className="mt-3 space-y-3">
          {loading && <div className="text-sm text-gray-500">Đang tải...</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}

          {!loading && !error && order && (
            <>
              <div className="space-y-2">
                {editMode ? (
                  editedItems.map((it: any, idx: number) => {
                    const total = (it.quantity || 0) * (it.price || 0);
                    return (
                      <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-medium">{it.product?.name || 'Sản phẩm'}</div>
                            {it.note && <div className="text-sm text-orange-600 mt-1">🔔 {it.note}</div>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1">
                            <div className="text-sm text-gray-500">SL: {it.quantity}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                const updated = [...editedItems];
                                updated[idx] = { ...updated[idx], quantity: Math.max(1, (updated[idx].quantity || 0) - 1) };
                                setEditedItems(updated);
                              }}
                              className="w-6 h-6 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-sm hover:bg-gray-400"
                            >
                              −
                            </button>
                            <button
                              onClick={() => {
                                const updated = [...editedItems];
                                updated[idx] = { ...updated[idx], quantity: (updated[idx].quantity || 0) + 1 };
                                setEditedItems(updated);
                              }}
                              className="w-6 h-6 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-sm hover:bg-gray-400"
                            >
                              +
                            </button>
                            <button
                              onClick={() => setEditedItems(editedItems.filter((_, i) => i !== idx))}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Nhập ghi chú..."
                          value={it.note || ''}
                          onChange={(e) => {
                            const updated = [...editedItems];
                            updated[idx] = { ...updated[idx], note: e.target.value };
                            setEditedItems(updated);
                          }}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                    );
                  })
                ) : (
                  Array.isArray(order.items) && order.items.map((it: any) => (
                    <div key={it.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="font-medium">{it.product?.name || 'Sản phẩm'}</div>
                      <div className="text-sm text-gray-500 mt-1">SL: {it.quantity}</div>
                      {it.note && <div className="text-sm text-orange-600 mt-1">🔔 {it.note}</div>}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-xl flex justify-between items-center">
                <div className="font-medium">Tổng cộng</div>
                <div className="text-orange-600 font-semibold">
                  {formatCurrency(editMode ? editedItems.reduce((sum, it) => sum + ((it.quantity || 0) * (it.price || 0)), 0) : order.totalAmount)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="fixed bottom-4 left-0 right-0 px-4">
        <div className="space-y-3">
          {!editMode ? (
            <>
              <button className="w-full py-3 bg-orange-500 text-white rounded-xl flex items-center justify-center gap-2">
                <CheckCircle size={16} />
                Xác nhận đơn
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setEditMode(true)}
                  className="flex-1 py-3 bg-white border rounded-xl flex items-center justify-center gap-2"
                >
                  <Edit3 size={14} />
                  Chỉnh sửa
                </button>
                <button className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-2">
                  <Trash2 size={14} />
                  Hủy đơn
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={async () => {
                  try {
                    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
                    if (!token) {
                      alert('Vui lòng đăng nhập lại');
                      return;
                    }

                    const requestBody = {
                      items: editedItems.map((it) => ({
                        productId: Number(it.productId || it.product?.id),
                        quantity: Number(it.quantity),
                        note: it.note || '',
                      })),
                      tableNumber: String(table?.number || tableIdParam),
                    };

                    const res = await fetch(`http://localhost:3000/orders/${orderIdParam}`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(requestBody),
                    });

                    if (res.ok) {
                      const updatedOrder = await res.json();
                      setOrder(updatedOrder);
                      setEditedItems(Array.isArray(updatedOrder.items) ? updatedOrder.items.map((item: any) => ({ ...item })) : []);
                      setEditMode(false);
                    } else {
                      const errText = await res.text();
                      alert('Lỗi: ' + (errText || 'Không thể cập nhật đơn'));
                    }
                  } catch (e) {
                    console.error(e);
                    alert('Lỗi kết nối');
                  }
                }}
                className="w-full py-3 bg-orange-500 text-white rounded-xl flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} />
                Lưu
              </button>
              <button
                onClick={() => {
                  setEditedItems(order.items.map((item: any) => ({ ...item })));
                  setEditMode(false);
                }}
                className="w-full py-3 bg-white border rounded-xl flex items-center justify-center gap-2"
              >
                Hủy chỉnh sửa
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-4 w-full max-w-sm mx-4 max-h-96 overflow-hidden flex flex-col">
            <h2 className="text-lg font-bold mb-3">Thêm món</h2>

            <input
              type="text"
              placeholder="Tìm kiếm món"
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm mb-3"
            />

            <div className="flex-1 overflow-y-auto space-y-2">
              {productsLoading && <div className="text-sm text-gray-500">Đang tải...</div>}

              {!productsLoading &&
                products
                  .filter((p) => p.name?.toLowerCase().includes(searchProduct.toLowerCase()))
                  .map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="text-sm font-medium">{product.name}</div>
                      <button
                        onClick={() => {
                          setEditedItems([
                            ...editedItems,
                            {
                              productId: product.id,
                              quantity: 1,
                              price: product.price || 0,
                              note: '',
                              product,
                            },
                          ]);
                          setShowAddModal(false);
                          setSearchProduct('');
                        }}
                        className="w-6 h-6 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-sm hover:bg-gray-400"
                      >
                        +
                      </button>
                    </div>
                  ))}
            </div>

            <button
              onClick={() => {
                setShowAddModal(false);
                setSearchProduct('');
              }}
              className="w-full mt-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
            >
              Quay lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
