import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { Article } from "../types";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import VerifiedIcon from "@mui/icons-material/Verified";
import CircularProgress from "@mui/material/CircularProgress";
import NewsGrid from "./NewsGrid";
import SectionStatus from "./SectionStatus";
import { useBookmarks } from "../hooks/useBookmarks";
import { useComments } from "../hooks/useComments";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { useKeywords } from "../seo/useKeywords";
import { useColorMode } from "../context/ThemeContext";
import { deduplicateArticles } from "../utils/deduplicate";
import { optimizeImageUrl } from "../utils/imageOptimizer";
import { AffiliateDeals } from "./AffiliateDeals";

interface CategoryPageProps {
  categoryKey: string;
  title: string;
  emoji: string;
  keywords: string[];
  fetchApi: (params: { page: number; pageSize: number }) => Promise<any>;
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  politics: `This page provides comprehensive, real-time updates on global and regional political developments, elections, government policy changes, and legislative reforms. Our system pulls from verified, high-authority news platforms, governmental press releases, and seasoned journalistic agencies. To guarantee the utmost accuracy and impartiality, all political stories undergo automated semantic analysis and fact-checking validations to filter out sensationalism or unverified rumors. By cross-referencing multiple reports of the same event, we deliver a balanced perspective on critical administrative decisions. This ensures that readers receive highly reliable updates suitable for authoritative research. Each news entry is enriched with contextual breakdowns, making complex political events easier to grasp.`,
  
  technology: `Stay ahead of the curve with our technology channel, highlighting breakthroughs in Artificial Intelligence, consumer electronics, software, cybersecurity, and tech policy. Our articles are sourced from elite technology blogs, scientific journals, industry summits, and developer network feeds. Every piece of technological news is filtered to focus on factual developments, verified benchmark results, and legitimate product releases rather than speculative vaporware. We cross-verify specs, company statements, and developer documentations to ensure readers get accurate information. This section serves as a premier resource for IT professionals, gadget enthusiasts, and researchers seeking credible technological insights. The data is optimized for rapid loading so you can browse the latest innovations on the go.`,
  
  business: `Our business vertical covers financial markets, startup ecosystem updates, corporate merges, macroeconomic policies, and thorough industry analysis. Sourced directly from major financial terminals, market registries, and reputable economic research bodies, the coverage is geared towards accuracy and relevance. We filter out speculative market chatters and focus on hard regulatory filings, quarterly statements, and concrete corporate actions. The news goes through rigorous validation and deduplication to ensure that you get a clear and clean picture of current economic shifts. Our goal is to provide investors and entrepreneurs with reliable intelligence they can act on confidently. Designed for maximum utility, the layout loads stock-related data and market highlights instantly.`,
  
  "science-health": `Explore the frontiers of human knowledge with our dedicated Science & Health page, featuring major medical breakthroughs, space exploration, and environmental studies. Sourced from peer-reviewed scientific journals, research institutions, healthcare registries, and environmental monitoring networks, our articles are both educational and highly accurate. We avoid sensationalized headlines and medical advice, focusing instead on verified studies, clinical trial results, and peer-reviewed consensus. Our enrichment service highlights key scientific metrics and provides a simplified overview of complex research methodologies. This ensures that students, professionals, and curious minds receive reliable, educational material free from pseudoscientific claims.`,
  
  lifestyle: `Welcome to our curated Lifestyle section, covering fashion, global culture, modern wellness, interior design, and personal growth. Our articles are sourced from renowned design journals, wellness experts, cultural commentators, and global trend reports. We focus on mindful living, expert wellness guidelines, and sustainable fashion choices, filtering out low-quality clickbait and influencer ads. Every story is selected for its high readability and inspirational value, ensuring a premium browsing experience. By verifying the credentials of wellness contributors and design professionals, we keep the content reliable and engaging. The pages are designed with soft, beautiful aesthetics that load fluidly, offering a relaxing and premium reading experience.`,
  
  education: `Our Education hub is designed for students, educators, and career seekers, offering study resources, exam schedules, academic news, and career guidance. We pull news from national education boards, university research offices, certified tutoring councils, and employment data agencies. Accuracy is crucial when it comes to dates, exam patterns, and career advice, which is why we run multi-source verification on all academic alerts. We filter out clickbait study tips and focus on actionable, verified educational policies and resources. This serves as a trusted guide to support personal growth, career navigation, and student success.`,
  
  opinion: `Engage with thoughtful editorials, expert analysis, and diverse reader perspectives in our Opinion section. Sourced from leading think-tanks, veteran journalists, policy advisors, and academic experts, these articles offer deep dives into contemporary social debates. While opinion pieces are subjective by nature, we maintain factual accuracy by verifying references, statistics, and historical claims mentioned in the columns. We filter out extreme bias or hateful content, presenting instead structured arguments that foster healthy intellectual dialogue. This section helps differentiate WorldNewzs from generic aggregators by providing high-quality, thought-provoking perspectives.`,
  
  trending: `Catch the pulse of the internet with our Trending page, compiling viral stories, social media buzz, popular memes, and pop culture updates. Sourced from social media analytics, trending index boards, and popular internet culture forums, we keep you informed on what the world is talking about. To prevent the spread of misinformation, we verify the origin of viral stories and label satirical or unverified reports clearly. We filter out low-value spam to deliver the most engaging, culturally relevant stories. This section keeps you connected to modern pop culture with high-speed updates.`,
  
  "podcasts-videos": `Dive into our rich multimedia section featuring engaging interviews, visual explainers, audio podcasts, and short documentary clips. Sourced from verified video journals, academic podcasters, and independent multimedia creators, these assets provide a highly engaging experience. We verify the authenticity and copyright status of all media to ensure they come from credible producers. The videos and audios are optimized for adaptive streaming and quick load times, ensuring a buffer-free experience on mobile and desktop. This section increases time-on-site and adds a rich layer of interactivity to our news platform.`,
  
  "local-news": `Stay updated with high-value regional news from Telangana, Hyderabad, and major cities across India. Sourced from regional news bureaus, local municipalities, state government updates, and regional correspondents, we cover local politics, development, traffic, and civic issues. We cross-verify all local updates against official municipal statements to ensure high accuracy. By prioritizing local stories, we bring regional relevance directly to your screen, ensuring that civic issues and regional achievements get the coverage they deserve.`
};

const CategoryPage: React.FC<CategoryPageProps> = ({
  categoryKey,
  title,
  emoji,
  keywords,
  fetchApi
}) => {
  const { mode } = useColorMode();
  const isDark = mode === "dark";

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

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const dynamicKeywordsData = useKeywords(categoryKey);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredArticles = normalizedSearchTerm
    ? articles.filter((a) =>
        `${a.title} ${a.description ?? ""}`.toLowerCase().includes(normalizedSearchTerm)
      )
    : articles;

  const loadData = (currentPage: number) => {
    if (currentPage === 1) setLoading(true);
    else setIsFetchingMore(true);

    fetchApi({ page: currentPage, pageSize: 20 })
      .then((res) => {
        const data = Array.isArray(res.data?.articles) ? res.data.articles : [];
        const formattedData = data.map((a: any) => ({
          ...a,
          imageUrl: a.urlToImage || a.image || a.imageUrl,
          category: a.category || title,
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
      .catch((err) => {
        console.error(`Error loading category: ${title}`, err);
        setError(`Failed to load ${title.toLowerCase()} news`);
      })
      .finally(() => {
        setLoading(false);
        setIsFetchingMore(false);
      });
  };

  useEffect(() => {
    setArticles([]);
    setPage(1);
    setHasMore(true);
    loadData(1);
  }, [categoryKey]);

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

  const description = CATEGORY_DESCRIPTIONS[categoryKey] || `Latest updates and news reports relating to ${title.toLowerCase()}.`;
  const [dynamicDesc, setDynamicDesc] = useState(description.substring(0, 155) + "...");

  useEffect(() => {
    const defaultDesc = CATEGORY_DESCRIPTIONS[categoryKey] || `Latest updates and news reports relating to ${title.toLowerCase()}.`;
    if (articles.length > 0) {
      const headlines = articles.slice(0, 3).map(a => a.title).join("; ");
      const fullText = `Latest ${title} headlines: ${headlines}. Read verified reporting on WorldNewzs.`;
      setDynamicDesc(fullText.substring(0, 155) + "...");
    } else {
      setDynamicDesc(defaultDesc.substring(0, 155) + "...");
    }
  }, [articles, categoryKey, title]);

  // Dynamically preload the first article image to optimize LCP
  useEffect(() => {
    if (filteredArticles.length > 0) {
      const firstArticle = filteredArticles[0];
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
  }, [filteredArticles]);

  const combinedKeywords = dynamicKeywordsData
    ? [...new Set([...keywords, ...dynamicKeywordsData.primary, ...dynamicKeywordsData.longtail, ...dynamicKeywordsData.trending])]
    : keywords;
  const descriptionToUse = dynamicKeywordsData?.metaDesc || dynamicDesc;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <SEOMeta
        title={`${title} News - WorldNewzs`}
        description={descriptionToUse}
        keywords={combinedKeywords}
        canonical={`https://worldnewzs.in/${categoryKey}`}
      />
      
      <JSONLDBreadcrumb crumbs={[
        { name: "Home", url: window.location.origin },
        { name: title, url: `${window.location.origin}/${categoryKey}` }
      ]} />

      {/* --- Reusable Premium Overview Info Box --- */}
      <Card 
        elevation={0}
        sx={{ 
          mb: 4, 
          borderRadius: 4, 
          border: "1px solid",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
          background: isDark 
            ? "linear-gradient(135deg, #1e2530 0%, #161b22 100%)" 
            : "linear-gradient(135deg, #f5f8ff 0%, #ffffff 100%)",
          boxShadow: isDark 
            ? "0 4px 20px rgba(0,0,0,0.3)" 
            : "0 4px 20px rgba(0,0,0,0.03)"
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography variant="h3" sx={{ fontSize: { xs: "1.8rem", sm: "2.4rem" }, fontWeight: 800 }}>
                {emoji} {title}
              </Typography>
            </Box>
            
            <Chip 
              icon={<VerifiedIcon sx={{ color: "#22c55e !important" }} />}
              label="Source Verification Active" 
              variant="outlined"
              sx={{ 
                borderColor: "#22c55e",
                color: "#22c55e",
                fontWeight: 600,
                borderRadius: 2,
                backgroundColor: isDark ? "rgba(34,197,94,0.08)" : "rgba(34,197,94,0.04)"
              }}
            />
          </Box>

          <Typography 
            variant="body1" 
            sx={{ 
              color: isDark ? "rgba(255,255,255,0.85)" : "#2d3748", 
              lineHeight: 1.8, 
              fontSize: { xs: "0.95rem", sm: "1.05rem" },
              textAlign: "justify",
              maxWidth: 900
            }}
          >
            {description}
          </Typography>
        </CardContent>
      </Card>

      {/* --- Affiliate Deals --- */}
      {["technology", "business", "science-health"].includes(categoryKey) && (
        <AffiliateDeals category={categoryKey} />
      )}

      {/* --- News Feed Rendering --- */}
      <SectionStatus 
        loading={loading} 
        error={error} 
        hasData={filteredArticles.length > 0}
        emptyText={normalizedSearchTerm ? "No results matching your search query." : `No articles currently available in ${title}.`}
        columns={{ xs: 12, sm: 6, md: 4 }}
      >
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
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={36} />
          </Box>
        )}
      </SectionStatus>
    </Box>
  );
};

export default CategoryPage;
