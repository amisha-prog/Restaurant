// Use VITE_API_URL in deployment; dynamically resolves to host IP when accessed from mobile phone
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (
    typeof window !== "undefined" &&
    window.location.hostname &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return `http://${window.location.hostname}:5001/api`;
  }
  return "http://localhost:5001/api";
};

export const API_URL = getApiUrl();

