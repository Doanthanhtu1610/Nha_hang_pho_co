const ACCESS_TOKEN_KEY = 'accessToken';
const USER_NAME_KEY = 'userName';
const USER_ROLE_KEY = 'userRole';
const NEW_WAITER_ORDERS_KEY = 'newWaiterOrders';
const PAYMENT_REQUESTS_KEY = 'paymentRequests';

/**
 * Lấy access token từ localStorage (chỉ chạy trên client).
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Xóa toàn bộ dữ liệu phiên và chuyển về trang chủ.
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem(NEW_WAITER_ORDERS_KEY);
    localStorage.removeItem(PAYMENT_REQUESTS_KEY);
  } catch {
    // ignore
  }
  window.location.href = '/';
}

/**
 * Nếu chưa có token thì redirect về trang chủ (dùng trong useEffect của trang cần đăng nhập).
 */
export function redirectToLoginIfNeeded(): boolean {
  const token = getAccessToken();
  if (!token) {
    if (typeof window !== 'undefined') window.location.href = '/';
    return true;
  }
  return false;
}
