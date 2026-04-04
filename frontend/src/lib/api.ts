// Use VITE_API_URL env var in production, fallback to localhost for dev
const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
export default API;
