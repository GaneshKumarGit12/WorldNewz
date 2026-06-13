import { useEffect, useState } from "react";
import { useOutletContext, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { fetchDiscover } from "../api/apiClient";
import type { Article } from "../types";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import NewsGrid from "../components/NewsGrid";
import SectionStatus from "../components/SectionStatus";
import { useBookmarks } from "../hooks/useBookmarks";
import { useComments } from "../hooks/useComments";
import { SEOMeta } from "../seo/SEOMeta";
import { getDailyKeyword } from "../utils/dailyKeyword";
import CircularProgress from "@mui/material/CircularProgress";
import { deduplicateArticles } from "../utils/deduplicate";
import { optimizeImageUrl } from "../utils/imageOptimizer";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import MuiLink from "@mui/material/Link";
import Grid from "@mui/material/Grid";


const Discover: React.FC = () => {
  const outletContext = useOutletContext<{ searchTerm?: string } | undefined>();
  const searchTerm = outletContext?.searchTerm ?? "";
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks(); // ✅ now URL-based
  const { 
    getEngagement, 
    toggleLike, 
    toggleDislike, 
    addComment, 
    deleteComment, 
    likeComment, 
    dislikeComment 
  } = useComments();


  const dailyKeyword = getDailyKeyword();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);



  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredArticles = normalizedSearchTerm
    ? articles.filter((article) => {
      const text = `${article.title} ${article.description ?? ""} ${article.category ?? ""}`.toLowerCase();
      return text.includes(normalizedSearchTerm);
    })
    : articles;

  const loadData = (currentPage: number) => {
    if (currentPage === 1) setLoading(true);
    else setIsFetchingMore(true);

    const query = normalizedSearchTerm || dailyKeyword;

    fetchDiscover({ query, page: currentPage, pageSize: 20 })
      .then((res) => {
        const data = Array.isArray(res.data?.articles) ? res.data.articles : [];
        const formattedData = data.map((a: any) => ({
          ...a,
          imageUrl: a.urlToImage || a.image,
          category: a.source?.name || "News",
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
        const apiError = axios.isAxiosError(err) ? err.response?.data?.error : null;
        setError(apiError || "Failed to load discover news");
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
  }, [searchTerm]); // Re-fetch from page 1 when search term changes

  useEffect(() => {
    if (page > 1) {
      loadData(page);
    }
  }, [page]);

  // Infinite Scroll logic
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

  const topStoriesArticles = filteredArticles.slice(0, 6);
  const remainingArticles = filteredArticles.slice(6);

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

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <SEOMeta
        title="Discover News"
        description={`Stay updated with the latest news on ${dailyKeyword} and more.`}
        keywords={['discover', 'news', dailyKeyword]}
        canonical="https://worldnewzs.in"
      />
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{ fontWeight: 700, mb: 1, fontSize: { xs: "1.75rem", sm: "2rem", md: "2.5rem" } }}
        >
          Discover Global News – WorldNewzs
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Stay updated with the latest news from around the world
        </Typography>
      </Box>

      {/* Section Status Wrapper */}
      <SectionStatus
        loading={loading}
        error={error}
        hasData={filteredArticles.length > 0}
        emptyText={normalizedSearchTerm ? "No results matching your search." : "No news available."}
        columns={{ xs: 12, sm: 6, md: 4, lg: 3 }}
      >
        {/* ✅ Top Stories Grid */}
        {topStoriesArticles.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
              Top Stories
            </Typography>
            <NewsGrid
              articles={topStoriesArticles}
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
            />
          </Box>
        )}

        {/* ✅ More News Grid */}
        {remainingArticles.length > 0 && (
          <>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
              More News
            </Typography>
            <NewsGrid
              articles={remainingArticles}
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
            />
          </>
        )}

        {isFetchingMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}
      </SectionStatus>

      {/* Premium Editorial & Platform Guide Section */}
      <Paper
        elevation={0}
        sx={{
          mt: 6,
          p: { xs: 3, sm: 4, md: 5 },
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(45deg, #c83a15, #ff7043)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3,
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' }
          }}
        >
          Discover Global News – WorldNewzs: The Modern Frontier of Digital Journalism and Algorithmic News Curation
        </Typography>
        <Divider sx={{ mb: 4 }} />
        
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body1" color="text.primary" paragraph sx={{ lineHeight: 1.8 }}>
              In the contemporary digital landscape, information is generated at a pace never seen before in human history. Every second, thousands of articles, reports, opinions, and breaking updates are published across the globe. While this vast flow of data ensures unprecedented access to information, it also introduces significant challenges: echo chambers, media bias, sensationalized clickbait, and duplicate stories that clutter reader feeds. Finding objective, high-quality, and transparent news has become a complex task.
            </Typography>
            <Typography variant="body1" color="text.primary" paragraph sx={{ lineHeight: 1.8 }}>
              WorldNewzs was established to address this challenge. As a premier global news aggregator, our core mission is to serve as an objective, clear, and comprehensive lens through which readers can view international events. We believe that access to verified, diverse, and well-contextualized news is a fundamental pillar of an informed global society. By combining advanced natural language processing (NLP) algorithms with strict editorial standards, WorldNewzs curates a streamlined stream of headlines that matter, free from the noise and clutter of the raw internet.
            </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700, mt: { xs: 2, md: 0 } }}>
              The Architecture of Our Intelligent Curation Pipeline
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8 }}>
              At the heart of WorldNewzs is a sophisticated, multi-layered curation engine. We do not simply syndicate raw feeds or display unfiltered RSS streams. Instead, our technology stack works in real-time to ingest, filter, categorize, and prioritize content from thousands of whitelisted, reputable sources.
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div" sx={{ pl: 2, borderLeft: '3px solid #c83a15', my: 2 }}>
              <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                <li style={{ marginBottom: '8px' }}>
                  <strong>Reputable Source Auditing:</strong> Our systems only process articles from publishers that maintain established editorial boards, transparent authorship, and a documented history of factual accuracy. We deliberately exclude unverified personal blogs, public forums, and sites that display high bias or low journalistic integrity.
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>Algorithmic Deduplication:</strong> When a major global event breaks, hundreds of outlets write about it, often using identical wire copy. Our system analyzes semantic similarity across titles and bodies to group duplicate articles. This ensures that your home page is clean and varied, showing you distinct stories rather than the same headline repeated twenty times.
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>Contextual Enrichment:</strong> For every story, we fetch metadata, structured JSON-LD data, and optimize image URLs to ensure the content is presented with rich visuals and proper attribution. This creates an immersive reading experience where the user can easily find the core details of a story and view its original source with a single click.
                </li>
              </ul>
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
            Adhering to Journalistic Standards: E-E-A-T and Search Quality Guidelines
          </Typography>
          <Typography variant="body1" color="text.primary" paragraph sx={{ lineHeight: 1.8 }}>
            To provide maximum value to our readers and align with Google’s Search Quality Rater Guidelines—specifically the standards of Experience, Expertise, Authoritativeness, and Trustworthiness (E-E-A-T)—WorldNewzs implements a transparent editorial protocol.
          </Typography>
          <Grid container spacing={3} sx={{ my: 2 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Experience & Expertise</Typography>
                <Typography variant="body2" color="text.secondary">
                  Our platform is built and managed by software engineers and media professionals. The curation desk is led by Ganesh Kumar, our Founder and Editor-in-Chief, who monitors system outputs and algorithm performance to ensure adherence to professional editorial standards.
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Authoritativeness</Typography>
                <Typography variant="body2" color="text.secondary">
                  Every story on WorldNewzs features a clear, clickable canonical link to the original publisher. We respect intellectual property and content creators, ensuring they receive direct traffic and proper search engine attribution.
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Trustworthiness</Typography>
                <Typography variant="body2" color="text.secondary">
                  We maintain a strict neutrality policy. WorldNewzs does not align with any political party, corporate conglomerate, or ideological movement. We present news neutrally, letting the facts speak for themselves. If a story is found to contain errors, we act swiftly to update or remove it from our index.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
            Combating Clickbait, Misinformation, and Sensationalism
          </Typography>
          <Typography variant="body1" color="text.primary" paragraph sx={{ lineHeight: 1.8 }}>
            One of the greatest threats to digital media is the rise of sensationalism. Headlines are frequently designed to provoke emotional reactions rather than convey factual summaries. WorldNewzs uses advanced filtering to combat this trend. Our sentiment analysis models evaluate headlines for emotionally charged language, clickbait patterns (such as exaggerated questions or incomplete statements designed to force a click), and extreme political bias. Articles that fail these checks are automatically downranked or flagged for manual review. This ensures that the stories displayed on our home page are informative, direct, and balanced, providing a quiet and focused environment for news consumption.
          </Typography>
          <Typography variant="body1" color="text.primary" paragraph sx={{ lineHeight: 1.8 }}>
            Furthermore, we continuously update our vocabulary database to recognize emerging clickbait styles and manipulative phrases. Journalistic integrity is a moving target in the digital age, and our engineering systems evolve dynamically to ensure that sensationalized editorial practices do not contaminate our index, preserving our reputation as a trusted primary news resource.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
            An Interactive and Engaged Reader Community
          </Typography>
          <Typography variant="body1" color="text.primary" paragraph sx={{ lineHeight: 1.8 }}>
            We believe that news should not be a one-way street. WorldNewzs is designed to be an interactive platform where global citizens can engage with content, bookmark key reports for future reference, and participate in civilized, moderated discussions. Our built-in bookmarking system allows you to save articles locally so you never lose track of important investigations or ongoing stories. Additionally, our comment sections foster healthy community engagement. We actively moderate all comment boards to prevent harassment, hate speech, and spam, ensuring that the dialogue remains constructive, educational, and respectful. By giving readers a voice, we transform passive news consumption into an active, collaborative discovery process.
          </Typography>
          <Typography variant="body1" color="text.primary" paragraph sx={{ lineHeight: 1.8 }}>
            Our user feedback loops also play an important role. When readers flags incorrect titles or broken links in the comment sections, our editorial team immediately reviews the reports, validating that our automated system remains aligned with user expectations and high-quality browsing.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
            Navigating the WorldNewzs Ecosystem
          </Typography>
          <Typography variant="body1" color="text.primary" paragraph sx={{ lineHeight: 1.8 }}>
            We want our readers to feel fully connected to the people and policies behind the platform. To learn more about our team, our technology, our whitelisting criteria, and our vision for the future of digital media, we encourage you to explore our dedicated resources.
          </Typography>
          <Typography variant="body1" color="text.primary" paragraph sx={{ lineHeight: 1.8 }}>
            • <strong>Learn About Us:</strong> If you would like to read our detailed founding story, meet our editorial board, or understand our algorithmic curation parameters in detail, please visit our {' '}
            <MuiLink
              component={RouterLink}
              to="/about"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              About Us
            </MuiLink>
            {' '} section. This page provides full transparency regarding our operations, our mission, and our guidelines.
          </Typography>
          <Typography variant="body1" color="text.primary" paragraph sx={{ lineHeight: 1.8 }}>
            • <strong>Get In Touch:</strong> We highly value feedback, corrections, and inquiries from our global audience. If you spot a factual error in an indexed article, have a business proposal, or need technical support, you can easily reach us via our {' '}
            <MuiLink
              component={RouterLink}
              to="/contact"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Contact Us
            </MuiLink>
            {' '} page. Our support team is committed to resolving editorial queries in less than 24 hours and general inquiries in under 48 hours.
          </Typography>
          <Typography variant="body1" color="text.primary" paragraph sx={{ lineHeight: 1.8, mt: 2 }}>
            By integrating these transparent pathways, we ensure that our readers can seamlessly navigate between breaking headlines and our platform policies, maintaining an open line of communication that builds trust and fosters a reliable news environment. Thank you for choosing WorldNewzs as your window to the world. We are committed to refining our technology and maintaining our journalistic standards to bring you the stories that matter most, every single day.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Discover;