// Use VITE_API_URL in deployment; dynamically resolves to host IP when accessed locally on LAN
const getApiUrl = () => {
  let envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === "string") {
    envUrl = envUrl.trim().replace(/\/+$/, "");
    if (!envUrl.endsWith("/api")) {
      envUrl = `${envUrl}/api`;
    }
    return envUrl;
  }
  if (
    typeof window !== "undefined" &&
    window.location.hostname &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    // Hosted on Vercel deployment
    if (window.location.hostname.endsWith("vercel.app")) {
      return "https://backend-amisha-7843.vercel.app/api";
    }
    // Only use local IP on LAN during development (e.g. 192.168.x.x)
    const isLocalNetwork = /^(\d{1,3}\.){3}\d{1,3}$/.test(window.location.hostname);
    if (isLocalNetwork) {
      return `http://${window.location.hostname}:5001/api`;
    }
  }
  return "http://localhost:5001/api";
};

export const API_URL = getApiUrl();

