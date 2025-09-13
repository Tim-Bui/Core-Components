export function getUserFromToken() {
    const token = localStorage.getItem("token");
    if (!token) return null;
  
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload; // { user_id, email, role, iat, exp }
    } catch {
      return null;
    }
  }