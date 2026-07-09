// Decodes the JWT payload client-side (no signature verification here —
// that's the server's job). Used only to decide what UI to show; every
// real permission check still happens on the backend.
export function getUserFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    // Treat an expired token as "not logged in"
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      localStorage.removeItem("token");
      return null;
    }

    return payload; // { userId, role, iat, exp }
  } catch {
    return null;
  }
}
