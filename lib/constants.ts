/**
 * Base URL của API backend (NestJS).
 * Có thể ghi đè bằng biến môi trường NEXT_PUBLIC_API_URL.
 */
export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
  'http://localhost:3000';
