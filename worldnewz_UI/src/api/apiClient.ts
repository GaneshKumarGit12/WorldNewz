import axios from "axios";
import { fallbackFeaturedPodcast, fallbackPodcastEpisodes } from "../utils/fallbackPodcastsVideos";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://worldnewz.onrender.com/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

const shouldCache = (url?: string) => {
  if (!url) return false;
  const lowercaseUrl = url.toLowerCase();
  return lowercaseUrl.startsWith("/news/") && 
         !lowercaseUrl.includes("search") && 
         !lowercaseUrl.includes("jobs") && 
         !lowercaseUrl.includes("full-content") &&
         !lowercaseUrl.includes("weather");
};

const isStorageAvailable = (): boolean => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const testKey = "__wn_storage_check__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

apiClient.interceptors.request.use(
  config => {
    if (isStorageAvailable() && config.method === "get" && shouldCache(config.url)) {
      const cacheKey = `api_cache_${config.url}_${JSON.stringify(config.params || {})}`;
      try {
        const cached = window.localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const isExpired = Date.now() - timestamp > 15 * 60 * 1000; // 15 minutes cache
          if (!isExpired) {
            config.adapter = () => {
              return Promise.resolve({
                data,
                status: 200,
                statusText: "OK",
                headers: {},
                config,
              });
            };
          }
        }
      } catch {
        // Silently continue if storage is restricted by tracking prevention
      }
    }
    return config;
  },
  error => Promise.reject(error)
);

const safeSetCache = (cacheKey: string, value: string) => {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(cacheKey, value);
  } catch {
    // Storage quota exceeded or blocked - clean up expired api_cache_ entries first
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith("api_cache_")) {
          try {
            const item = window.localStorage.getItem(key);
            if (item) {
              const parsed = JSON.parse(item);
              if (!parsed.timestamp || now - parsed.timestamp > 15 * 60 * 1000) {
                keysToRemove.push(key);
              }
            } else {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(k => window.localStorage.removeItem(k));
      window.localStorage.setItem(cacheKey, value);
    } catch {
      // Still failing - purge all api_cache_ entries
      try {
        const allApiKeys: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith("api_cache_")) {
            allApiKeys.push(key);
          }
        }
        allApiKeys.forEach(k => window.localStorage.removeItem(k));
        window.localStorage.setItem(cacheKey, value);
      } catch {
        // Silently ignore if browser restrictions prevent storage write
      }
    }
  }
};

apiClient.interceptors.response.use(
  response => {
    if (isStorageAvailable() && response.config.method === "get" && response.status === 200 && shouldCache(response.config.url)) {
      const cacheKey = `api_cache_${response.config.url}_${JSON.stringify(response.config.params || {})}`;
      safeSetCache(cacheKey, JSON.stringify({
        data: response.data,
        timestamp: Date.now()
      }));
    }

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

      if (config && config.method === "get" && isStorageAvailable() && shouldCache(config.url)) {
        const cacheKey = `api_cache_${config.url}_${JSON.stringify(config.params || {})}`;
        try {
          const cached = window.localStorage.getItem(cacheKey);
          if (cached) {
            const { data } = JSON.parse(cached);
            return Promise.resolve({
              data,
              status: 200,
              statusText: "OK",
              headers: {},
              config,
            });
          }
        } catch {
          // Silently ignore fallback read failure
        }
      }

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
export const fetchWeather = (params?: SearchParams & { city?: string; lat?: number; lon?: number }) => apiClient.get("/news/weather", { params });
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
export const fetchGoogleSearch = (query: string) => apiClient.get("/googlesearch", { params: { q: query } });
export const fetchAdByPlacement = (placement: string) => apiClient.get(`/ads/${placement}`);
export const fetchFullContent = (url: string, title?: string, description?: string, category?: string) => apiClient.get("/news/full-content", { params: { url, title, description, category } });
export const fetchJobs = (page: number = 1) => apiClient.get("/news/jobs", { params: { page } });
export const fetchJobDetail = (slug: string) => apiClient.get(`/news/jobs/detail/${slug}`);
export const fetchEnrichedArticlesAll = () => apiClient.get("/news/enriched/all");
export const fetchEnrichedArticle = (url: string) => apiClient.get("/news/enriched", { params: { url } });
export const createEnrichedArticle = (article: any) => apiClient.post("/news/enriched", article);
export const updateEnrichedArticle = (article: any) => apiClient.put("/news/enriched", article);
export const deleteEnrichedArticle = (url: string) => apiClient.delete("/news/enriched", { params: { url } });
export const postJob = (jobData: any) => apiClient.post("/news/jobs/post", jobData);
export const submitContactForm = (data: { name: string; email: string; subject: string; message: string }) => apiClient.post("/contact", data);

export const performGeminiSearch = (query: string) => apiClient.post("/news/gemini-search", { query });

export const fetchFacebookSettings = () => apiClient.get("/facebooksettings");
export const fetchFacebookPages = (userAccessToken: string) => apiClient.post("/facebooksettings/fetch-pages", { userAccessToken });
export const saveFacebookSettings = (settings: any[]) => apiClient.post("/facebooksettings/save", settings);
export const toggleFacebookPage = (pageId: string) => apiClient.post(`/facebooksettings/toggle/${pageId}`);
export const deleteFacebookPage = (pageId: string) => apiClient.delete(`/facebooksettings/${pageId}`);
export const testFacebookPost = (pageId: string) => apiClient.post(`/facebooksettings/test/${pageId}`);

// New Category feeds
export const fetchServices = (params?: SearchParams) => apiClient.get("/news/services", { params });
export const fetchGaming = (params?: SearchParams) => apiClient.get("/news/gaming", { params });
export const fetchCartoons = (params?: SearchParams) => apiClient.get("/news/cartoons", { params });

// Free-To-Play Games API
export interface FreeToGameItem {
  id: number;
  title: string;
  thumbnail: string;
  short_description: string;
  game_url: string;
  genre: string;
  platform: string;
  publisher: string;
  developer: string;
  release_date: string;
  freetogame_profile_url: string;
}

export interface MinimumSystemRequirements {
  os: string;
  processor: string;
  memory: string;
  graphics: string;
  storage: string;
}

export interface ScreenshotItem {
  id: number;
  image: string;
}

export interface FreeToGameDetails {
  id: number;
  title: string;
  thumbnail: string;
  status: string;
  short_description: string;
  description: string;
  game_url: string;
  genre: string;
  platform: string;
  publisher: string;
  developer: string;
  release_date: string;
  freetogame_profile_url: string;
  minimum_system_requirements?: MinimumSystemRequirements;
  screenshots: ScreenshotItem[];
}

export const fetchFreeToPlayGames = (params?: { platform?: string; category?: string; 'sort-by'?: string }) =>
  apiClient.get<FreeToGameItem[]>("/gaming/games", { params });

export const fetchFreeToPlayGameDetails = (id: number) =>
  apiClient.get<FreeToGameDetails>("/gaming/game", { params: { id } });

export const fetchFreeToPlayGamesFilter = (params: { tag: string; platform?: string; sort?: string }) =>
  apiClient.get<FreeToGameItem[]>("/gaming/filter", { params });

// Polls API Types & Clients
export interface VoteResponse {
  status: string;
  message: string;
  totalVotes: number;
  results: Array<{
    id: number;
    optionText: string;
    votes: number;
    percentage: number;
  }>;
}

export interface PollSubmissionHistoryItem {
  id: number;
  name: string;
  email: string;
  percentage: number;
  status: string;
  submittedAt: string;
}

export interface PollOptionItem {
  id: number;
  pollId: number;
  optionText: string;
  votes: number;
  isCorrect?: boolean;
}

export interface PollItem {
  id: number;
  question: string;
  description: string;
  createdAt: string;
  options: PollOptionItem[];
}

export interface PollAnswer {
  pollId: number;
  optionId: number;
}

export interface PollAnswersSubmissionRequest {
  name: string;
  email: string;
  timezoneOffset: number;
  answers: PollAnswer[];
}

export interface PollSubmissionResponse {
  status: string;
  percentage: number;
  scoreStatus: string;
}

export const fetchActivePolls = () => apiClient.get<PollItem[]>(`/polls?t=${new Date().getTime()}`);
export const submitPollAnswers = (data: PollAnswersSubmissionRequest) => apiClient.post<PollSubmissionResponse>("/polls/submit-answers", data);
export const fetchPollsHistory = () => apiClient.get<PollSubmissionHistoryItem[]>(`/polls/history?t=${new Date().getTime()}`);
export const fetchLeaderboard = () => apiClient.get<PollSubmissionHistoryItem[]>(`/polls/leaderboard?t=${new Date().getTime()}`);

export interface SingleVoteResponse {
  status: string;
  message: string;
  pollId: number;
  totalVotes: number;
  results: Array<{
    optionId: number;
    choice: string;
    votes: number;
    percentage: number;
  }>;
}

export interface PollResultsResponse {
  pollId: number;
  question: string;
  totalVotes: number;
  results: Array<{
    optionId: number;
    choice: string;
    votes: number;
    percentage: number;
  }>;
}

export const submitSingleVote = (pollId: number, choice: string | number) => 
  apiClient.post<SingleVoteResponse>("/polls/vote", { pollId, choice });

export const fetchPollResults = (pollId?: number) => 
  apiClient.get<PollResultsResponse | PollResultsResponse[]>("/polls/results", { params: { pollId } });

export interface CheckUserAttemptResponse {
  exists: boolean;
  percentage?: number;
  scoreStatus?: string;
}

export const checkUserAttempt = (name: string, email: string, timezoneOffset: number) => 
  apiClient.get<CheckUserAttemptResponse>(`/polls/check-attempt?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&timezoneOffset=${timezoneOffset}&t=${new Date().getTime()}`);

// Dynamic AI & Data Pipeline Interfaces
export interface ContextualPollOption {
  optionId: number;
  text: string;
  votes: number;
}

export interface ContextualPollData {
  pollId: number;
  question: string;
  totalVotes: number;
  options: ContextualPollOption[];
}

export interface UnifiedNewsStoryData {
  storyId: string;
  category: string;
  subcategory: string;
  title: string;
  imageUrl?: string;
  publishedAt: string;
  aiBriefing: {
    summary: string;
    takeaways: string[];
  };
  sources: Array<{ publisher: string; url: string }>;
  contextualPoll?: ContextualPollData;
}

export const fetchUnifiedStory = (id: string, category?: string, subcategory?: string) =>
  apiClient.get<UnifiedNewsStoryData>(`/news/unified-story/${encodeURIComponent(id)}`, {
    params: { category, subcategory }
  });

export const fetchContextualPoll = (category?: string, subcategory?: string, articleUrl?: string) =>
  apiClient.get<ContextualPollData>("/polls/contextual", {
    params: { category, subcategory, articleUrl }
  });

// Quiz API Types & Clients
export interface QuizOptionItem {
  id: number;
  optionText: string;
}

export interface QuizQuestionItem {
  id: number;
  question: string;
  description: string;
  options: QuizOptionItem[];
}

export interface QuizAnswer {
  questionId: number;
  optionId: number;
}

export interface QuizSubmissionRequest {
  name: string;
  email: string;
  timezoneOffset: number;
  answers: QuizAnswer[];
}

export interface QuestionEvaluationResult {
  questionId: number;
  submittedOptionId: number;
  correctOptionId: number;
  isCorrect: boolean;
}

export interface QuizSubmissionResponse {
  status: string;
  score: number;
  total: number;
  percentage: number;
  coins: number;
  scoreStatus: string;
  results: QuestionEvaluationResult[];
}

export interface QuizSubmissionHistoryItem {
  id: number;
  name: string;
  email: string;
  score: number;
  coins: number;
  percentage: number;
  status: string;
  submittedAt: string;
}

export interface CheckQuizUserAttemptResponse {
  exists: boolean;
  percentage?: number;
  scoreStatus?: string;
  coins?: number;
  score?: number;
}

export const fetchQuizQuestions = () => 
  apiClient.get<QuizQuestionItem[]>(`/quiz/questions?t=${new Date().getTime()}`);

export const checkQuizUserAttempt = (name: string, email: string, timezoneOffset: number) => 
  apiClient.get<CheckQuizUserAttemptResponse>(`/quiz/check-attempt?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&timezoneOffset=${timezoneOffset}&t=${new Date().getTime()}`);

export const submitQuizAnswers = (data: QuizSubmissionRequest) => 
  apiClient.post<QuizSubmissionResponse>("/quiz/submit", data);

export const fetchQuizLeaderboard = () => 
  apiClient.get<QuizSubmissionHistoryItem[]>(`/quiz/leaderboard?t=${new Date().getTime()}`);

export const fetchQuizHistory = () => 
  apiClient.get<QuizSubmissionHistoryItem[]>(`/quiz/history?t=${new Date().getTime()}`);

// Stocks API Types & Clients
export interface StockItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  exchange: string;
  trendHint: string;
}

export interface StocksResponse {
  status: string;
  exchange: string;
  lastUpdated: string;
  stocks: StockItem[];
}

export const fetchStocks = (exchange: string) => apiClient.get<StocksResponse>("/stocks", { params: { exchange } });

// --- Admin DB Management & Storage Types & Clients ---

export interface DbStorageResponse {
  dbProvider: string;
  databaseSizeInBytes: number;
  percentageUsed: number;
  formattedSize: string;
  maxSizeBytes: number;
  formattedMaxSize: string;
}

export interface AdminLoginResponse {
  success: boolean;
  token: string;
}

export const adminLogin = (username: string, password: string) =>
  apiClient.post<AdminLoginResponse>("/admin/login", { username, password });

export const fetchDbStorage = () =>
  apiClient.get<DbStorageResponse>("/admin/storage");

export const deleteQuizHistory = (id: number, token: string) =>
  apiClient.delete(`/admin/quiz-history/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

export const deletePollHistory = (id: number, token: string) =>
  apiClient.delete(`/admin/poll-history/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

// --- MovieDB API Types & Clients ---
export interface MovieDbItem {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
}

export interface MovieDbListResponse {
  page: number;
  results: MovieDbItem[];
  total_pages: number;
  total_results: number;
}

export interface MovieDbGenre {
  id: number;
  name: string;
}

export interface MovieDbProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
}

export interface MovieDbCastItem {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface MovieDbCrewItem {
  id: number;
  name: string;
  job: string;
}

export interface MovieDbCredits {
  cast: MovieDbCastItem[];
  crew: MovieDbCrewItem[];
}

export interface MovieDbVideoItem {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface MovieDbVideosResponse {
  results: MovieDbVideoItem[];
}

export interface MovieDbDetails {
  id: number;
  title: string;
  overview: string;
  tagline: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  runtime: number | null;
  budget: number;
  revenue: number;
  status: string;
  genres: MovieDbGenre[];
  production_companies: MovieDbProductionCompany[];
  credits?: MovieDbCredits;
  videos?: MovieDbVideosResponse;
  recommendations: MovieDbItem[];
}

export interface MovieDbImageConfig {
  base_url: string;
  secure_base_url: string;
  poster_sizes: string[];
  backdrop_sizes: string[];
}

export interface MovieDbConfiguration {
  images: MovieDbImageConfig;
}

export const fetchMoviesBrowse = (params: { type?: string; page?: number; genre?: number }) =>
  apiClient.get<MovieDbListResponse>("/movies/browse", { params });

export const fetchMoviesSearch = (params: { query: string; page?: number }) =>
  apiClient.get<MovieDbListResponse>("/movies/search", { params });

export const fetchMovieDetails = (id: number) =>
  apiClient.get<MovieDbDetails>(`/movies/movie/${id}`);

export const fetchMovieDbConfig = () =>
  apiClient.get<MovieDbConfiguration>("/movies/config");

// Amazon Affiliate Products Interface
export interface AmazonProduct {
  id: number;
  asin: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  category: string;
  productUrl: string;
  lastUpdated: string;
}

export interface AmazonProductsResponse {
  status: string;
  totalResults: number;
  products: AmazonProduct[];
}

export const fetchAmazonProducts = () =>
  apiClient.get<AmazonProductsResponse>("/amazonproducts");

export interface AmazonProductParseResponse {
  status: string;
  product: AmazonProduct;
}

export const parseAmazonProductUrl = (url: string) =>
  apiClient.get<AmazonProductParseResponse>(`/amazonproducts/parse-url?url=${encodeURIComponent(url)}`);

// Short Videos Interface
export interface ShortVideo {
  id: string;
  title: string;
  videoUrl: string;
  viewsCount: string;
  likesCount: number;
  commentsCount: number;
  author: string;
  authorAvatar: string;
  category: string;
  duration: string;
  thumbnail?: string;
}

export interface ShortVideosResponse {
  status: string;
  totalResults: number;
  videos: ShortVideo[];
}

export const fetchShortVideos = () =>
  apiClient.get<ShortVideosResponse>("/shortvideos");

// --- Live Streams API ---
export interface LiveStreamItem {
  videoId: string;
  title: string;
  channelTitle: string;
  description: string;
  thumbnailUrl: string;
  embedUrl: string;
  category: string;
  isLive: boolean;
  fetchedAt?: string;
}

export interface LiveStreamResponse {
  status: string;
  data: LiveStreamItem;
}

export const fetchLiveStream = (category?: string) =>
  apiClient.get<LiveStreamResponse>("/livestreams", {
    params: category ? { category } : undefined,
  });

// --- Podcasts & Videos API ---
export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  category: string;
  duration: string;
  desk: string;
  mediaType: "podcast" | "video";
  isFeatured?: boolean;
  formattedDate: string;
  publishedAt?: string;
  viewsCount?: string;
}

export interface PodcastsVideosFeedResponse {
  status: string;
  featured?: PodcastEpisode;
  episodes: PodcastEpisode[];
  lastUpdated?: string;
}

export const fetchPodcastsVideosFeed = async (category?: string): Promise<{ data: PodcastsVideosFeedResponse }> => {
  try {
    const res = await apiClient.get<PodcastsVideosFeedResponse>("/podcasts-videos/feed", {
      params: category && category !== "All" ? { category } : undefined,
    });
    return res;
  } catch {
    const filteredEpisodes = !category || category === "All"
      ? fallbackPodcastEpisodes
      : fallbackPodcastEpisodes.filter(e => e.category.toLowerCase().includes(category.toLowerCase()));

    return {
      data: {
        status: "success",
        featured: fallbackFeaturedPodcast,
        episodes: filteredEpisodes.length > 0 ? filteredEpisodes : fallbackPodcastEpisodes,
        lastUpdated: new Date().toISOString()
      }
    };
  }
};



// --- Newsletter Subscription API ---
export interface NewsletterSubscriber {
  id: number;
  email: string;
  name: string;
  subscriptionType: string;
  subscribedAt: string;
  isVerified: boolean;
}

export const subscribeNewsletter = (email: string, name: string, subscriptionType: string) =>
  apiClient.post("/news/subscribe", { email, name, subscriptionType });

export const fetchSubscribers = (token: string) =>
  apiClient.get<NewsletterSubscriber[]>("/admin/subscribers", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

export const deleteSubscriber = (id: number, token: string) =>
  apiClient.delete(`/admin/subscribers/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

export const verifySubscriber = (id: number, token: string) =>
  apiClient.post(`/admin/subscribers/${id}/verify`, {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

export const testSmtpSettings = (email: string, token: string) =>
  apiClient.post<{ success: boolean; message: string }>("/admin/test-email", { email }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

// --- Transportation Booking API ---
export interface CabDriver {
  id: number;
  name: string;
  vehicleType: string;
  vehicleNumber: string;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
  rating: number;
}

export interface RideBooking {
  id: number;
  pickupLocation: string;
  destination: string;
  vehicleType: string;
  price: number;
  status: string;
  eta: number;
  createdAt: string;
  driverName?: string;
  vehicleNumber?: string;
  currentCoords?: { lat: number; lng: number };
  pickupCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
}

export interface MapsConfig {
  apiKey: string;
  hasValidKey: boolean;
  defaultCenter: { lat: number; lng: number };
  defaultZoom: number;
}

export interface PlaceSuggestion {
  description: string;
  place_id: string;
  main_text: string;
  secondary_text: string;
}

export interface DistanceMatrixResult {
  distanceText: string;
  distanceMeters: number;
  durationText: string;
  durationSeconds: number;
  mode: string;
}

export interface DirectionsStep {
  instruction: string;
  distance: string;
  duration: string;
  travelMode: string;
}

export interface DirectionsResult {
  status: string;
  originCoords: { lat: number; lng: number };
  destinationCoords: { lat: number; lng: number };
  overviewPolyline: string;
  distanceText?: string;
  distanceMeters?: number;
  durationText?: string;
  durationSeconds?: number;
  steps: DirectionsStep[];
  mode: string;
}

export const fetchMapsConfig = () => apiClient.get<MapsConfig>("/transportation/maps-config");
export const fetchPlacesAutocomplete = (input: string) => apiClient.get<PlaceSuggestion[]>("/transportation/places-autocomplete", { params: { input } });
export const fetchDistanceMatrix = (origin: string, destination: string, mode: string = "driving") =>
  apiClient.post<DistanceMatrixResult>("/transportation/matrix", { origin, destination, mode });
export const fetchDirections = (origin: string, destination: string, mode: string = "driving") =>
  apiClient.post<DirectionsResult>("/transportation/directions", { origin, destination, mode });

export const fetchCabs = () => apiClient.get<CabDriver[]>("/transportation/cabs");
export const fetchLocations = () => apiClient.get<string[]>("/transportation/locations");
export const bookRide = (data: { pickupLocation: string; destination: string; vehicleType: string; userEmail?: string }) =>
  apiClient.post<RideBooking>("/transportation/book", data);
export const fetchRideStatus = (id: number) => apiClient.get<RideBooking>(`/transportation/ride/${id}`);
export const fetchRideHistory = (email: string) => apiClient.get<RideBooking[]>("/transportation/history", { params: { email } });

// --- Chatbot API ---
export interface ChatMessageDto {
  sender: string;
  text: string;
}

export interface ChatbotResponse {
  reply: string;
  visualMockPrompt?: string;
  generatedImage?: string;
}

export const askChatbot = (query: string, history: ChatMessageDto[], context?: string) =>
  apiClient.post<ChatbotResponse>("/chatbot/ask", { query, history, context });

// --- Spoonacular Recipes API ---
export interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  imageType: string;
  readyInMinutes: number;
  servings: number;
  healthScore: number;
  summary: string;
  diets: string[];
  cuisines: string[];
  dishTypes: string[];
}

export interface SpoonacularSearchResponse {
  results: SpoonacularRecipe[];
  offset: number;
  number: number;
  totalResults: number;
}

export interface SpoonacularRandomResponse {
  recipes: SpoonacularRecipe[];
}

export interface SpoonacularIngredient {
  id: number;
  name: string;
  original: string;
  amount: number;
  unit: string;
  image: string | null;
}

export interface SpoonacularInstructionStep {
  number: number;
  step: string;
}

export interface SpoonacularInstructionStepGroup {
  name: string;
  steps: SpoonacularInstructionStep[];
}

export interface SpoonacularNutrient {
  name: string;
  amount: number;
  unit: string;
  percentOfDailyNeeds: number;
}

export interface SpoonacularCaloricBreakdown {
  percentProtein: number;
  percentFat: number;
  percentCarbs: number;
}

export interface SpoonacularNutrition {
  nutrients: SpoonacularNutrient[];
  caloricBreakdown: SpoonacularCaloricBreakdown;
}

export interface SpoonacularRecipeDetails extends SpoonacularRecipe {
  instructions: string;
  extendedIngredients: SpoonacularIngredient[];
  analyzedInstructions: SpoonacularInstructionStepGroup[];
  nutrition: SpoonacularNutrition;
}

export const fetchRecipesSearch = (params: { query?: string; diet?: string; type?: string; page?: number; number?: number }) =>
  apiClient.get<SpoonacularSearchResponse>("/food/recipes", { params });

export const fetchRecipeDetails = (id: number) =>
  apiClient.get<SpoonacularRecipeDetails>(`/food/recipes/${id}`);

export const fetchRandomRecipes = (number: number = 10) =>
  apiClient.get<SpoonacularRandomResponse>("/food/random", { params: { number } });


