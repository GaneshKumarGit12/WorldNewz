import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "https://worldnewz.onrender.com/api",
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    // Suppress ERR_CONNECTION_CLOSED console errors
    if (axios.isAxiosError(error)) {
      // Check if it's a connection error
      if (error.code === "ERR_NETWORK" || error.code === "ECONNABORTED" || error.code === "ECONNREFUSED") {
        // Silently return the error without logging to console
        return Promise.reject(error);
      }

      const apiMessage = error.response?.data?.error;
      if (apiMessage) {
        error.message = typeof apiMessage === "string" ? apiMessage : JSON.stringify(apiMessage);
      }
    }
    return Promise.reject(error);
  }
);

interface SearchParams {
  query?: string;       // optional — omitted by axios when undefined
  category?: string;
  page?: number;
  pageSize?: number;
  source?: string;
  country?: string;
  language?: string;
}

export const fetchDiscover = () => apiClient.get("/news/discover");
export const fetchSports = () => apiClient.get("/news/sports");
export const fetchMoney = () => apiClient.get("/news/money");
export const fetchShopping = () => apiClient.get("/news/shopping");
export const fetchWeather = () => apiClient.get("/news/weather");
export const fetchSearch = (params: SearchParams) => apiClient.get("/news/search", { params });
