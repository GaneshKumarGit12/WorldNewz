import {
  fetchAmazonCatalog,
  fetchAmazonHighlights,
  fetchAmazonWidgetDeals,
  type AmazonCatalogPageResponse,
  type AmazonCatalogQueryParams,
  type AmazonHighlightsResponse,
  type AmazonWidgetDealsResponse,
} from "./apiClient";

interface CacheRecord<T> {
  data: T;
  expiresAt: number;
}

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ENTRIES = 60;

const valueCache = new Map<string, CacheRecord<unknown>>();
const inflightRequests = new Map<string, Promise<unknown>>();

function getCachedOrFetch<T>(key: string, fetcher: () => Promise<T>, ttlMs = TTL_MS): Promise<T> {
  const now = Date.now();
  const cached = valueCache.get(key) as CacheRecord<T> | undefined;
  if (cached && cached.expiresAt > now) {
    return Promise.resolve(cached.data);
  }

  const pending = inflightRequests.get(key) as Promise<T> | undefined;
  if (pending) {
    return pending;
  }

  const promise = fetcher()
    .then((data) => {
      if (valueCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = valueCache.keys().next().value;
        if (oldestKey) valueCache.delete(oldestKey);
      }
      valueCache.set(key, { data, expiresAt: Date.now() + ttlMs });
      return data;
    })
    .finally(() => {
      inflightRequests.delete(key);
    });

  inflightRequests.set(key, promise);
  return promise;
}

export function getCurrentFourHourBlock(): number {
  return Math.floor(Date.now() / (4 * 60 * 60 * 1000));
}

export function getCachedHighlights(): Promise<AmazonHighlightsResponse> {
  return getCachedOrFetch("deals:highlights", async () => {
    const res = await fetchAmazonHighlights();
    return res.data;
  });
}

export function getCachedWidgetDeals(category?: string, limit = 8): Promise<AmazonWidgetDealsResponse> {
  const normalizedCat = (category || "All").trim().toLowerCase();
  const block = getCurrentFourHourBlock();
  const key = `deals:widgets:${normalizedCat}:${limit}:${block}`;
  return getCachedOrFetch(key, async () => {
    const res = await fetchAmazonWidgetDeals({
      category: category && category !== "All" ? category : undefined,
      limit,
      fourHourBlock: block,
    });
    return res.data;
  });
}

export function getCachedCatalogPage(params: AmazonCatalogQueryParams): Promise<AmazonCatalogPageResponse> {
  const normalizedKey = JSON.stringify({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 24,
    category: params.category || "All",
    search: (params.search || "").trim().toLowerCase(),
    sort: params.sort || "newest",
    minDiscount: params.minDiscount ?? null,
    maxPrice: params.maxPrice ?? null,
    minRating: params.minRating ?? null,
    excludeAsins: params.excludeAsins || "",
  });

  return getCachedOrFetch(`deals:catalog:${normalizedKey}`, async () => {
    const res = await fetchAmazonCatalog({
      ...params,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 24,
    });
    return res.data;
  });
}

export function clearDealsClientCache(): void {
  valueCache.clear();
  inflightRequests.clear();
}
