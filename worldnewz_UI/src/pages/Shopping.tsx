import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { fetchShopping } from "../api/apiClient";
import type { Article } from "../types";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import NewsGrid from "../components/NewsGrid";
import SectionStatus from "../components/SectionStatus";
import { useBookmarks } from "../hooks/useBookmarks";
import { useComments } from "../hooks/useComments";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import CircularProgress from "@mui/material/CircularProgress";
import { deduplicateArticles } from "../utils/deduplicate";
import { AffiliateDeals } from "../components/AffiliateDeals";
import { optimizeImageUrl } from "../utils/imageOptimizer";


const Shopping: React.FC = () => {
  const outletContext = useOutletContext<{ searchTerm?: string } | undefined>();
  const searchTerm = outletContext?.searchTerm ?? "";
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const { 
    getEngagement, 
    toggleLike, 
    toggleDislike, 
    addComment, 
    deleteComment, 
    likeComment, 
    dislikeComment 
  } = useComments();

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredArticles = normalizedSearchTerm
    ? articles.filter((a) =>
        `${a.title} ${a.description ?? ""}`.toLowerCase().includes(normalizedSearchTerm)
      )
    : articles;

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);



  const loadData = (currentPage: number) => {
    if (currentPage === 1) setLoading(true);
    else setIsFetchingMore(true);

    fetchShopping({ page: currentPage, pageSize: 20 })
      .then((res) => {
        const data = Array.isArray(res.data?.articles) ? res.data.articles : [];
        const formattedData = data.map((a: any) => ({
          ...a,
          imageUrl: a.urlToImage || a.image || a.imageUrl,
          category: a.category || "Shopping",
        }));
        
        if (formattedData.length === 0) {
          setHasMore(false);
        } else {
          setArticles((prev) => {
            const combined = currentPage === 1 ? formattedData : [...prev, ...formattedData];
            return deduplicateArticles(combined);
          });
        }
      })
      .catch(() => setError("Failed to load shopping news"))
      .finally(() => {
        setLoading(false);
        setIsFetchingMore(false);
      });
  };

  useEffect(() => {
    loadData(1);
  }, []);

  useEffect(() => {
    if (page > 1) {
      loadData(page);
    }
  }, [page]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 100 >=
        document.documentElement.offsetHeight
      ) {
        if (!isFetchingMore && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFetchingMore, hasMore, loading]);

  // Dynamically preload the first article image to optimize LCP
  useEffect(() => {
    if (articles.length > 0) {
      const firstArticle = articles[0];
      const imageUrl = firstArticle.imageUrl || firstArticle.urlToImage;
      if (imageUrl) {
        const optimizedUrl = optimizeImageUrl(imageUrl, 500);
        const existingLink = document.querySelector(`link[rel="preload"][href="${optimizedUrl}"]`);
        if (!existingLink) {
          const link = document.createElement("link");
          link.rel = "preload";
          link.as = "image";
          link.href = optimizedUrl;
          link.setAttribute("fetchpriority", "high");
          document.head.appendChild(link);
        }
      }
    }
  }, [articles]);

  const [description, setDescription] = useState("Latest shopping trends, deals, and e-commerce news.");

  useEffect(() => {
    if (articles.length > 0) {
      const headlines = articles.slice(0, 3).map(a => a.title).join("; ");
      const text = `Latest shopping trends and deals: ${headlines}. Read verified e-commerce news and discounts on WorldNewzs.`;
      setDescription(text.substring(0, 155) + "...");
    }
  }, [articles]);

  return (
    <Box sx={{ p: 2 }}>
      <SEOMeta
        title="Shopping News"
        description={description}
        keywords={['shopping', 'e-commerce', 'deals', 'trends', 'discounts', 'news']}
      />
      <JSONLDBreadcrumb crumbs={[
        { name: "Home", url: window.location.origin },
        { name: "Shopping", url: `${window.location.origin}/shopping` }
      ]} />
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>🛒 Shopping</Typography>
      <AffiliateDeals category="shopping" />
      <SectionStatus loading={loading} error={error} hasData={filteredArticles.length > 0}
        emptyText={normalizedSearchTerm ? "No results matching your search." : "No shopping news available."}>
        <NewsGrid
          articles={filteredArticles}
          onBookmark={addBookmark}
          onRemoveBookmark={removeBookmark}
          isBookmarked={isBookmarked}
          onLike={toggleLike}
          onDislike={toggleDislike}
          onAddComment={addComment}
          onDeleteComment={deleteComment}
          onLikeComment={likeComment}
          onDislikeComment={dislikeComment}
          getEngagement={getEngagement}
          columns={{ xs: 12, sm: 6, md: 4 }}
        />
        {isFetchingMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}
      </SectionStatus>
    </Box>
  );
};

export default Shopping;
