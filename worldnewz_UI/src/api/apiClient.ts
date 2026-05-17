import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "https://worldnewz.onrender.com/api",
});

apiClient.interceptors.response.use(
  response => {
    if (response.data && Array.isArray(response.data.articles)) {
      response.data.articles.sort((a: any, b: any) => {
        const aHasImg = Boolean(a.urlToImage || a.imageUrl);
        const bHasImg = Boolean(b.urlToImage || b.imageUrl);
        if (aHasImg && !bHasImg) return -1;
        if (!aHasImg && bHasImg) return 1;
        return 0;
      });
    }
    return response;
  },
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

export const fetchDiscover = (params?: SearchParams) => apiClient.get("/news/discover", { params });
export const fetchSports = (params?: SearchParams) => apiClient.get("/news/sports", { params });
export const fetchMoney = (params?: SearchParams) => apiClient.get("/news/money", { params });
export const fetchShopping = (params?: SearchParams) => apiClient.get("/news/shopping", { params });
export const fetchWeather = (params?: SearchParams) => apiClient.get("/news/weather", { params });
export const fetchTravel = (params?: SearchParams) => apiClient.get("/news/travel", { params });
export const fetchFood = (params?: SearchParams) => apiClient.get("/news/food", { params });
export const fetchEntertainment = (params?: SearchParams) => apiClient.get("/news/entertainment", { params });
export const fetchSearch = (params: SearchParams) => apiClient.get("/news/search", { params });
