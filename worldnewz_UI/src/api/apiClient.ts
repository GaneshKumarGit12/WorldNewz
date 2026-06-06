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
    if (axios.isAxiosError(error)) {
      const config = error.config as any;

      const isNetworkError = !error.response && (
        error.code === "ERR_NETWORK" || 
        error.code === "ECONNABORTED" || 
        error.code === "ECONNREFUSED" || 
        error.message === "Network Error"
      );

      const isRetryableServerError = error.response && (
        error.response.status === 502 || 
        error.response.status === 503 || 
        error.response.status === 504
      );

      if (config && (isNetworkError || isRetryableServerError)) {
        config._retryCount = config._retryCount ?? 0;
        if (config._retryCount < 3) {
          config._retryCount += 1;
          const backoffDelay = config._retryCount * 2000;
          console.warn(`API call failed (${error.message || error.code}). Retrying attempt ${config._retryCount} in ${backoffDelay}ms...`);
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(apiClient(config));
            }, backoffDelay);
          });
        }
      }

      if (isNetworkError) {
        // Silently return the network error without console pollution after retries exhaust
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
export const fetchPolitics = (params?: SearchParams) => apiClient.get("/news/politics", { params });
export const fetchTechnology = (params?: SearchParams) => apiClient.get("/news/technology", { params });
export const fetchBusiness = (params?: SearchParams) => apiClient.get("/news/business", { params });
export const fetchScienceHealth = (params?: SearchParams) => apiClient.get("/news/science-health", { params });
export const fetchLifestyle = (params?: SearchParams) => apiClient.get("/news/lifestyle", { params });
export const fetchEducation = (params?: SearchParams) => apiClient.get("/news/education", { params });
export const fetchOpinion = (params?: SearchParams) => apiClient.get("/news/opinion", { params });
export const fetchTrending = (params?: SearchParams) => apiClient.get("/news/trending", { params });
export const fetchPodcastsVideos = (params?: SearchParams) => apiClient.get("/news/podcasts-videos", { params });
export const fetchLocalNews = (params?: SearchParams) => apiClient.get("/news/local-news", { params });
export const fetchSearch = (params: SearchParams) => apiClient.get("/news/search", { params });
export const fetchAdByPlacement = (placement: string) => apiClient.get(`/ads/${placement}`);
export const fetchFullContent = (url: string) => apiClient.get("/news/full-content", { params: { url } });
export const submitContactForm = (data: { name: string; email: string; subject: string; message: string }) => apiClient.post("/contact", data);

export const fetchFacebookSettings = () => apiClient.get("/facebooksettings");
export const fetchFacebookPages = (userAccessToken: string) => apiClient.post("/facebooksettings/fetch-pages", { userAccessToken });
export const saveFacebookSettings = (settings: any[]) => apiClient.post("/facebooksettings/save", settings);
export const toggleFacebookPage = (pageId: string) => apiClient.post(`/facebooksettings/toggle/${pageId}`);
export const deleteFacebookPage = (pageId: string) => apiClient.delete(`/facebooksettings/${pageId}`);
export const testFacebookPost = (pageId: string) => apiClient.post(`/facebooksettings/test/${pageId}`);
