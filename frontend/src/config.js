// Falls back to localhost for normal local dev. Set VITE_API_BASE_URL in
// your .env (e.g. to your machine's local network IP) if you need the
// verification pages to be reachable from another device, like a phone
// scanning a QR code over the same WiFi network.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";