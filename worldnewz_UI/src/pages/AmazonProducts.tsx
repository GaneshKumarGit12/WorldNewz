import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Pagination from "@mui/material/Pagination";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SearchOffIcon from "@mui/icons-material/SearchOff";

import type {
  AmazonCatalogPageResponse,
  AmazonHighlightsResponse,
  AmazonProduct,
} from "../api/apiClient";
import { getCachedCatalogPage, getCachedHighlights } from "../api/dealsCache";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb, JSONLDFAQPage, JSONLDProductList } from "../seo/JSONLDSchemas";
import { BreadcrumbNav } from "../components/BreadcrumbNav";

import { DealsMasthead } from "../components/deals/DealsMasthead";
import { DealHeroSpotlight } from "../components/deals/DealHeroSpotlight";
import { FlashDropsStrip } from "../components/deals/FlashDropsStrip";
import { DealsFilterToolbar, type DealsSortOption } from "../components/deals/DealsFilterToolbar";
import { DealCard } from "../components/deals/DealCard";
import { DealQuickViewModal } from "../components/deals/DealQuickViewModal";
import { DealsUtilitySidebar } from "../components/deals/DealsUtilitySidebar";
import { SavedDealsDrawer } from "../components/deals/SavedDealsDrawer";
import {
  CatalogGridSkeleton,
  FlashDropsSkeleton,
  HeroSpotlightSkeleton,
  SidebarSkeleton,
} from "../components/deals/DealsSkeletons";
import {
  SITE_URL,
  STOREFRONT_CATEGORIES,
  getAffiliateUrl,
  getResponsiveAmazonImage,
  parseBrandAndTitle,
  useSavedDeals,
} from "../components/deals/dealsUtils";

const PAGE_SIZE = 24;

const AMAZON_DEALS_FAQS = [
  {
    question: "How often is the Amazon India Deals Hub updated?",
    answer:
      "Our shopping editorial desk refreshes verified price drops, active stock status, and top discounts daily at 12:00 AM IST. Prices and availability are continuously monitored so expired listings are automatically purged.",
  },
  {
    question: "How does WorldNewzs verify real discounts vs inflated MRP?",
    answer:
      "We strictly calculate discount percentages only when a product has a verified M.R.P. higher than its live Amazon India deal price. We never synthesize fake percentages or display artificial 0% OFF badges.",
  },
  {
    question: "Are the checkout links on WorldNewzs safe?",
    answer:
      "Yes, 100%. Every deal link directs you straight to Amazon India's official SSL-encrypted product page (amazon.in), backed by standard Amazon buyer protection, brand warranties, and hassle-free returns.",
  },
  {
    question: "How can I save deals or check a specific Amazon product URL?",
    answer:
      "Tap the bookmark icon on any deal card to store it in your browser's Saved Deals drawer. You can also paste any official Amazon India link into the Amazon Deal Checker widget to preview ASIN details and open a verified link.",
  },
  {
    question: "How do I maximize total savings on Amazon India?",
    answer:
      "Combine our verified price drops with Amazon Pay ICICI or SBI bank instant discounts, collectable seller coupons on the Amazon product page, and Prime delivery savings.",
  },
];

const VALID_SORTS = new Set<DealsSortOption>(["newest", "discount", "price_asc", "price_desc", "rating"]);

const AmazonProducts: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-synced state
  const selectedCategory = searchParams.get("category") || "All";
  const urlSearch = searchParams.get("q") || "";
  const rawSort = (searchParams.get("sort") || "newest") as DealsSortOption;
  const sortBy: DealsSortOption = VALID_SORTS.has(rawSort) ? rawSort : "newest";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const minDiscount = searchParams.get("minDiscount") ? Number(searchParams.get("minDiscount")) : null;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null;
  const minRating = searchParams.get("minRating") ? Number(searchParams.get("minRating")) : null;
  const savedOnly = searchParams.get("saved") === "1";

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

  // Sync local search input if URL query changes externally (e.g. Back/Forward)
  useEffect(() => {
    setSearchInput(urlSearch);
    setDebouncedSearch(urlSearch);
  }, [urlSearch]);

  // Debounce search typing -> URL param
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      setDebouncedSearch(trimmed);
      if (trimmed !== urlSearch) {
        const next = new URLSearchParams(searchParams);
        if (trimmed) next.set("q", trimmed);
        else next.delete("q");
        next.delete("page");
        setSearchParams(next, { replace: true });
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput, urlSearch, searchParams, setSearchParams]);

  // Data state
  const [highlights, setHighlights] = useState<AmazonHighlightsResponse | null>(null);
  const [highlightsLoading, setHighlightsLoading] = useState(true);
  const [catalog, setCatalog] = useState<AmazonCatalogPageResponse | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Interactive UI state
  const { savedDeals, toggleSave, removeSaved, clearSaved, isSaved } = useSavedDeals();
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<AmazonProduct | null>(null);
  const [activeHeroProduct, setActiveHeroProduct] = useState<AmazonProduct | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const catalogGridRef = useRef<HTMLDivElement | null>(null);
  const urlPreviewInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch curated highlights once (shared 5-minute client cache)
  useEffect(() => {
    let active = true;
    setHighlightsLoading(true);
    getCachedHighlights()
      .then((data) => {
        if (!active) return;
        setHighlights(data);
        if (data.heroDeals && data.heroDeals.length > 0) {
          setActiveHeroProduct(data.heroDeals[0]);
        }
      })
      .catch(() => {
        // Catalog request still handles main error banner cleanly
      })
      .finally(() => {
        if (active) setHighlightsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const isUnfilteredFirstPage =
    page === 1 &&
    selectedCategory === "All" &&
    !debouncedSearch &&
    sortBy === "newest" &&
    !minDiscount &&
    !maxPrice &&
    !minRating;

  // Exclude Hero + Flash ASINs on unfiltered Page 1 so zero duplicate cards appear above the fold
  const excludeAsinsForPage = useMemo(() => {
    if (!isUnfilteredFirstPage || !highlights) return undefined;
    const asins = [
      ...(highlights.heroDeals || []).map((p) => p.asin),
      ...(highlights.flashDrops || []).map((p) => p.asin),
    ].filter(Boolean);
    return asins.length > 0 ? asins.join(",") : undefined;
  }, [isUnfilteredFirstPage, highlights]);

  // Fetch paginated & filtered catalog page (wait for highlights to settle on unfiltered Page 1 to prevent double-fetch card swap)
  useEffect(() => {
    if (savedOnly) {
      setCatalogLoading(false);
      return;
    }

    if (isUnfilteredFirstPage && highlightsLoading) {
      return;
    }

    let active = true;
    setCatalogLoading(true);
    setErrorMessage(null);

    getCachedCatalogPage({
      page,
      pageSize: PAGE_SIZE,
      category: selectedCategory !== "All" ? selectedCategory : undefined,
      search: debouncedSearch || undefined,
      sort: sortBy,
      minDiscount: minDiscount ?? undefined,
      maxPrice: maxPrice ?? undefined,
      minRating: minRating ?? undefined,
      excludeAsins: excludeAsinsForPage,
    })
      .then((data) => {
        if (!active) return;
        setCatalog(data);
      })
      .catch((err) => {
        if (!active) return;
        setErrorMessage(err?.message || "Unable to load Amazon deals right now. Please try again in a moment.");
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, selectedCategory, debouncedSearch, sortBy, minDiscount, maxPrice, minRating, savedOnly, isUnfilteredFirstPage, highlightsLoading, excludeAsinsForPage]);

  // Helpers to update URL search params cleanly
  const updateParams = useCallback(
    (mutator: (params: URLSearchParams) => void, scrollToGrid = false) => {
      const next = new URLSearchParams(searchParams);
      mutator(next);
      setSearchParams(next, { replace: true });
      if (scrollToGrid && catalogGridRef.current) {
        const top = catalogGridRef.current.getBoundingClientRect().top + window.scrollY - 150;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      }
    },
    [searchParams, setSearchParams]
  );

  const handleCategoryChange = useCallback(
    (cat: string, scrollToGrid = false) => {
      updateParams((p) => {
        if (!cat || cat === "All") p.delete("category");
        else p.set("category", cat);
        p.delete("saved");
        p.delete("page");
      }, scrollToGrid);
    },
    [updateParams]
  );

  const handleSortChange = useCallback(
    (sort: DealsSortOption) => {
      updateParams((p) => {
        if (sort === "newest") p.delete("sort");
        else p.set("sort", sort);
        p.delete("page");
      });
    },
    [updateParams]
  );

  const handleToggleParam = useCallback(
    (key: string, value: string) => {
      updateParams((p) => {
        if (p.get(key) === value) p.delete(key);
        else p.set(key, value);
        p.delete("page");
      });
    },
    [updateParams]
  );

  const handlePageChange = useCallback(
    (_: React.ChangeEvent<unknown>, nextPage: number) => {
      updateParams((p) => {
        if (nextPage <= 1) p.delete("page");
        else p.set("page", String(nextPage));
      }, true);
    },
    [updateParams]
  );

  const handleResetFilters = useCallback(() => {
    setSearchInput("");
    setDebouncedSearch("");
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handleShare = useCallback((product: AmazonProduct) => {
    const shareUrl = getAffiliateUrl(product);
    const shareText = `${product.title} — ₹${product.price.toLocaleString("en-IN")} on WorldNewzs Deals Hub`;
    if (navigator.share) {
      navigator.share({ title: product.title, text: shareText, url: shareUrl }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard
        .writeText(`${shareText} ${shareUrl}`)
        .then(() => setToastMsg("Deal link copied to clipboard!"))
        .catch(() => setToastMsg("Ready to share!"));
    }
  }, []);

  const handleFocusUrlPreview = useCallback(() => {
    const el = document.getElementById("deals-url-previewer");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => urlPreviewInputRef.current?.focus(), 450);
    }
  }, []);

  // Products currently displayed in main catalog grid
  const displayedProducts = useMemo(() => {
    if (savedOnly) {
      const term = debouncedSearch.toLowerCase();
      return savedDeals.filter((d) => {
        if (term && !d.title.toLowerCase().includes(term) && !d.category.toLowerCase().includes(term)) {
          return false;
        }
        return true;
      });
    }
    return catalog?.products ?? [];
  }, [savedOnly, savedDeals, debouncedSearch, catalog]);

  const totalResults = savedOnly ? displayedProducts.length : catalog?.totalResults ?? 0;
  const totalPages = savedOnly ? 1 : catalog?.totalPages ?? 1;
  const totalActiveDeals = highlights?.totalActiveDeals || catalog?.catalogTotal || 0;
  const topVerifiedDiscount = highlights?.topVerifiedDiscount || catalog?.maxDiscountByCategory?.["All"] || 0;

  const activeCategoryDef = STOREFRONT_CATEGORIES.find(
    (c) => c.key.toLowerCase() === selectedCategory.toLowerCase()
  );
  const activeCategoryLabel = activeCategoryDef
    ? activeCategoryDef.label
    : selectedCategory !== "All"
    ? selectedCategory
    : "All Deals";

  const activeCategoryMaxDiscount =
    (selectedCategory !== "All" && catalog?.maxDiscountByCategory?.[selectedCategory]) || topVerifiedDiscount;

  // --- Dynamic Product-Driven SEO Metadata ---
  const currentMonthYear = useMemo(
    () => new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    []
  );

  const seoConfig = useMemo(() => {
    const isCategoryFiltered = selectedCategory !== "All" && !savedOnly;
    const countLabel =
      totalResults > 0
        ? `${totalResults.toLocaleString("en-IN")} Verified Offers`
        : totalActiveDeals > 0
        ? `${totalActiveDeals.toLocaleString("en-IN")} Verified Offers`
        : "Daily Verified Offers";

    const discountSegment = activeCategoryMaxDiscount > 0 ? ` — Up to ${activeCategoryMaxDiscount}% Off` : "";

    const title = isCategoryFiltered
      ? `${activeCategoryLabel} Amazon Deals${discountSegment} (${countLabel})`
      : `Amazon India Deals Hub${discountSegment} (${currentMonthYear})`;

    const leadTitles = displayedProducts
      .slice(0, 2)
      .map((p) => p.title.slice(0, 48).trim())
      .filter(Boolean)
      .join(" & ");

    const description = isCategoryFiltered
      ? `Browse ${countLabel} in ${activeCategoryLabel} on Amazon India${discountSegment}. ${leadTitles ? `Featuring ${leadTitles}. ` : ""}Updated daily by WorldNewzs.`
      : `Shop ${countLabel} on Amazon India${discountSegment} across electronics, home & kitchen, fashion, and lifestyle. ${leadTitles ? `Today's top picks include ${leadTitles}. ` : ""}Verified daily by WorldNewzs.`;

    const dynamicBrands = Array.from(
      new Set(
        displayedProducts
          .slice(0, 10)
          .map((p) => parseBrandAndTitle(p.title, p.category).brand)
          .filter((b) => b && b.length > 2)
      )
    ).slice(0, 6);

    const keywords = [
      "Amazon India deals",
      "Amazon Deals of the Day",
      isCategoryFiltered ? `${activeCategoryLabel} deals India` : "verified Amazon offers",
      "WorldNewzs Deals Hub",
      ...dynamicBrands.map((b) => `${b} deals`),
    ];

    const heroOrFirstImg = activeHeroProduct?.imageUrl || displayedProducts[0]?.imageUrl;
    const ogImage = heroOrFirstImg
      ? getResponsiveAmazonImage(heroOrFirstImg, "hero")
      : `${SITE_URL}/og-image.png`;

    const canonical =
      isCategoryFiltered && !debouncedSearch
        ? `${SITE_URL}/amazon-products?category=${encodeURIComponent(selectedCategory)}`
        : `${SITE_URL}/amazon-products`;

    // Prevent crawl-budget bloat on arbitrary search queries or personal saved views
    const noIndex = Boolean(debouncedSearch || savedOnly || minDiscount || maxPrice || minRating);

    return { title, description, keywords, ogImage, canonical, noIndex };
  }, [
    selectedCategory,
    savedOnly,
    totalResults,
    totalActiveDeals,
    activeCategoryMaxDiscount,
    activeCategoryLabel,
    currentMonthYear,
    displayedProducts,
    activeHeroProduct,
    debouncedSearch,
    minDiscount,
    maxPrice,
    minRating,
  ]);

  // Memoized displayed-only JSON-LD schema items (Hero + active page only — never 4,134 rows!)
  const schemaProducts = useMemo(() => {
    const seen = new Set<string>();
    const combined: AmazonProduct[] = [];
    for (const p of [...(highlights?.heroDeals ?? []).slice(0, 3), ...displayedProducts.slice(0, 24)]) {
      if (p?.asin && !seen.has(p.asin)) {
        seen.add(p.asin);
        combined.push(p);
      }
    }
    return combined.map((p) => ({
      asin: p.asin,
      brand: parseBrandAndTitle(p.title, p.category).brand,
      title: p.title,
      description: p.description || p.title,
      imageUrl: getResponsiveAmazonImage(p.imageUrl, "card"),
      price: p.price,
      originalPrice: p.originalPrice,
      productUrl: getAffiliateUrl(p),
      rating: p.rating,
      reviewCount: p.reviewCount,
      category: p.category,
    }));
  }, [highlights, displayedProducts]);

  const showSpotlightAndFlash =
    page === 1 && selectedCategory === "All" && !debouncedSearch && !savedOnly && !minDiscount && !maxPrice && !minRating;

  return (
    <Box sx={{ width: "100%", bgcolor: "var(--color-canvas-base)", color: "var(--color-ink-primary)" }}>
      <SEOMeta
        title={seoConfig.title}
        description={seoConfig.description}
        keywords={seoConfig.keywords}
        canonical={seoConfig.canonical}
        ogImage={seoConfig.ogImage}
        noIndex={seoConfig.noIndex}
      />

      <JSONLDBreadcrumb
        crumbs={[
          { name: "Home", url: SITE_URL },
          { name: "Amazon Deals Hub", url: `${SITE_URL}/amazon-products` },
        ]}
      />
      <JSONLDProductList
        products={schemaProducts}
        collectionName={seoConfig.title}
        collectionDescription={seoConfig.description}
        canonicalUrl={seoConfig.canonical}
      />
      <JSONLDFAQPage faqs={AMAZON_DEALS_FAQS} />

      {/* Flush 1440px .wrap container matching Header & SearchBar */}
      <Box className="wrap" sx={{ pt: { xs: 1.5, md: 2 }, pb: 7 }}>
        <BreadcrumbNav
          items={[
            { label: "Home", path: "/" },
            { label: "Amazon Deals Hub" },
          ]}
        />

        {/* BAND 1: Editorial Masthead */}
        <DealsMasthead
          totalActiveDeals={totalActiveDeals}
          topVerifiedDiscount={topVerifiedDiscount}
          savedCount={savedDeals.length}
          activeCategoryLabel={activeCategoryLabel}
          onOpenSavedDrawer={() => setSavedDrawerOpen(true)}
          onOpenUrlPreviewMobile={handleFocusUrlPreview}
        />

        {/* BAND 2: Full-Width Deal of the Day Hero Spotlight */}
        {showSpotlightAndFlash &&
          (highlightsLoading ? (
            <HeroSpotlightSkeleton />
          ) : (
            highlights?.heroDeals &&
            highlights.heroDeals.length > 0 && (
              <DealHeroSpotlight
                deals={highlights.heroDeals}
                isSaved={isSaved}
                onToggleSave={toggleSave}
                onQuickView={setQuickViewProduct}
                onShare={handleShare}
                onActiveDealChange={setActiveHeroProduct}
              />
            )
          ))}

        {/* BAND 3: Full-Width Trending Flash Drops (4-up desktop ~325px cards) */}
        {showSpotlightAndFlash &&
          (highlightsLoading ? (
            <FlashDropsSkeleton />
          ) : (
            highlights?.flashDrops &&
            highlights.flashDrops.length > 0 && (
              <FlashDropsStrip
                deals={highlights.flashDrops}
                isSaved={isSaved}
                onToggleSave={toggleSave}
                onQuickView={setQuickViewProduct}
              />
            )
          ))}

        {/* BAND 4: Main Catalog Grid (9 cols lg+) + Sticky Utility Rail (3 cols lg+) */}
        <Grid container spacing={3} alignItems="flex-start" id="deals-catalog-grid" ref={catalogGridRef}>
          <Grid size={{ xs: 12, lg: 9 }}>
            <DealsFilterToolbar
              selectedCategory={selectedCategory}
              onCategoryChange={(cat) => handleCategoryChange(cat, false)}
              categoryCounts={catalog?.categoryCounts ?? {}}
              availableCategories={catalog?.availableCategories ?? []}
              searchInput={searchInput}
              onSearchInputChange={setSearchInput}
              onClearSearch={() => {
                setSearchInput("");
                setDebouncedSearch("");
                updateParams((p) => {
                  p.delete("q");
                  p.delete("page");
                });
              }}
              sortBy={sortBy}
              onSortChange={handleSortChange}
              minDiscount={minDiscount}
              onToggleMinDiscount={(val) => handleToggleParam("minDiscount", String(val))}
              maxPrice={maxPrice}
              onToggleMaxPrice={(val) => handleToggleParam("maxPrice", String(val))}
              minRating={minRating}
              onToggleMinRating={(val) => handleToggleParam("minRating", String(val))}
              savedOnly={savedOnly}
              savedCount={savedDeals.length}
              onToggleSavedOnly={() => handleToggleParam("saved", "1")}
              totalResults={totalResults}
              onResetAll={handleResetFilters}
            />

            {errorMessage && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: "10px" }}>
                {errorMessage}
              </Alert>
            )}

            {catalogLoading ? (
              <CatalogGridSkeleton count={12} />
            ) : displayedProducts.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 4, sm: 6 },
                  textAlign: "center",
                  borderRadius: "10px",
                  bgcolor: "var(--color-surface-container)",
                  border: "1px solid var(--color-border-divider)",
                }}
              >
                <SearchOffIcon sx={{ fontSize: 48, color: "var(--color-ink-tertiary)", mb: 1.5 }} />
                <Typography
                  variant="h6"
                  sx={{ fontFamily: "var(--font-serif-headline)", fontWeight: 700, mb: 0.75 }}
                >
                  {savedOnly ? "No saved deals match this view" : "No matching deals found"}
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--color-ink-secondary)", mb: 2.5 }}>
                  Try broadening your category, clearing search keywords, or resetting active filters.
                </Typography>
                <Button
                  id="btn-empty-reset-filters"
                  variant="contained"
                  onClick={handleResetFilters}
                  sx={{
                    borderRadius: "8px",
                    bgcolor: "var(--color-brand-accent)",
                    color: "#ffffff",
                    fontWeight: 700,
                    "&:hover": { bgcolor: "var(--color-brand-accent-hover)" },
                  }}
                >
                  Show All Verified Deals
                </Button>
              </Paper>
            ) : (
              <>
                <Grid container spacing={2.5}>
                  {displayedProducts.map((product) => (
                    <Grid key={product.asin || product.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                      <DealCard
                        product={product}
                        isSaved={isSaved(product.asin)}
                        onToggleSave={toggleSave}
                        onQuickView={setQuickViewProduct}
                        idPrefix="grid"
                      />
                    </Grid>
                  ))}
                </Grid>

                {totalPages > 1 && !savedOnly && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      mt: 4,
                      pt: 3,
                      borderTop: "1px solid var(--color-border-divider)",
                    }}
                  >
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={handlePageChange}
                      color="primary"
                      shape="rounded"
                      showFirstButton
                      showLastButton
                      siblingCount={1}
                      sx={{
                        "& .MuiPaginationItem-root": {
                          color: "var(--color-ink-primary)",
                          borderColor: "var(--color-border-divider)",
                          fontWeight: 700,
                        },
                        "& .Mui-selected": {
                          bgcolor: "var(--color-brand-accent) !important",
                          color: "#ffffff !important",
                        },
                      }}
                    />
                  </Box>
                )}
              </>
            )}
          </Grid>

          {/* Sticky Right Utility Rail */}
          <Grid size={{ xs: 12, lg: 3 }}>
            {highlightsLoading && !highlights ? (
              <SidebarSkeleton />
            ) : (
              <DealsUtilitySidebar
                priceDrops={highlights?.priceDrops ?? []}
                categoryStats={highlights?.categoryStats ?? catalog?.categoryStats ?? []}
                mysteryDeal={highlights?.mysteryDeal ?? null}
                selectedCategory={selectedCategory}
                onSelectCategory={(catKey) => handleCategoryChange(catKey, true)}
                urlPreviewInputRef={urlPreviewInputRef}
              />
            )}
          </Grid>
        </Grid>

        {/* BAND 5: Editorial Buying Guide & FAQ Accordion (AdSense & E-E-A-T compliant) */}
        <Box component="section" aria-label="Editorial Buying Guide and FAQs" sx={{ mt: 6 }}>
          <Paper
            elevation={0}
            id="deals-editorial-intro"
            sx={{
              p: { xs: 2.5, md: 4 },
              mb: 4,
              borderRadius: "10px",
              bgcolor: "var(--color-surface-container)",
              border: "1px solid var(--color-border-divider)",
            }}
          >
            <Typography
              component="h2"
              sx={{
                fontFamily: "var(--font-serif-headline)",
                fontSize: { xs: "1.3rem", md: "1.55rem" },
                fontWeight: 700,
                color: "var(--color-ink-primary)",
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 2,
              }}
            >
              <VerifiedUserOutlinedIcon sx={{ color: "var(--color-brand-accent)" }} />
              How WorldNewzs Verifies Amazon India Deals ({currentMonthYear})
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--color-ink-secondary)", lineHeight: 1.75, mb: 1.5, fontSize: "0.94rem" }}>
              Finding genuine savings across thousands of daily online listings requires disciplined price verification. Every offer featured in the{" "}
              <strong>WorldNewzs Amazon Deals Hub</strong> is checked against authentic M.R.P. pricing, customer rating benchmarks, and live availability on Amazon India.
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--color-ink-secondary)", lineHeight: 1.75, mb: 1.5, fontSize: "0.94rem" }}>
              Our shopping editorial desk covers key consumer categories aligned with our daily reporting across{" "}
              <Box component={RouterLink} to="/technology" sx={{ color: "var(--color-brand-accent)", fontWeight: 700, "&:hover": { textDecoration: "underline" } }}>
                Technology News
              </Box>
              ,{" "}
              <Box component={RouterLink} to="/shopping" sx={{ color: "var(--color-brand-accent)", fontWeight: 700, "&:hover": { textDecoration: "underline" } }}>
                Consumer Shopping
              </Box>
              ,{" "}
              <Box component={RouterLink} to="/lifestyle" sx={{ color: "var(--color-brand-accent)", fontWeight: 700, "&:hover": { textDecoration: "underline" } }}>
                Lifestyle &amp; Fashion
              </Box>
              , and{" "}
              <Box component={RouterLink} to="/business" sx={{ color: "var(--color-brand-accent)", fontWeight: 700, "&:hover": { textDecoration: "underline" } }}>
                Business &amp; Productivity
              </Box>
              . We strictly suppress fabricated discounts and automatically purge dead or out-of-stock links.
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--color-ink-secondary)", lineHeight: 1.75, m: 0, fontSize: "0.94rem" }}>
              Use the Quick View modal to review full product highlights, bookmark favorites into your Saved Deals drawer, or filter across all 21 catalog departments to find verified offers in seconds.
            </Typography>
          </Paper>

          <Box id="deals-faq-section">
            <Typography
              component="h2"
              sx={{
                fontFamily: "var(--font-serif-headline)",
                fontSize: { xs: "1.3rem", md: "1.5rem" },
                fontWeight: 700,
                color: "var(--color-ink-primary)",
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 2.5,
              }}
            >
              <HelpOutlineIcon sx={{ color: "var(--color-brand-accent)" }} />
              Frequently Asked Questions (FAQs)
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              {AMAZON_DEALS_FAQS.map((faq, idx) => (
                <Accordion
                  key={idx}
                  elevation={0}
                  sx={{
                    borderRadius: "10px !important",
                    border: "1px solid var(--color-border-divider)",
                    bgcolor: "var(--color-surface-container)",
                    color: "var(--color-ink-primary)",
                    overflow: "hidden",
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary
                    id={`faq-summary-${idx}`}
                    expandIcon={<ExpandMoreIcon sx={{ color: "var(--color-brand-accent)" }} />}
                    sx={{ px: 2.5, py: 0.5 }}
                  >
                    <Typography sx={{ fontWeight: 700, fontSize: "0.94rem", color: "var(--color-ink-primary)" }}>
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                    <Typography variant="body2" sx={{ color: "var(--color-ink-secondary)", lineHeight: 1.7 }}>
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Quick View Modal */}
      <DealQuickViewModal
        product={quickViewProduct}
        open={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        isSaved={quickViewProduct ? isSaved(quickViewProduct.asin) : false}
        onToggleSave={toggleSave}
        onShare={handleShare}
      />

      {/* Saved Deals Drawer */}
      <SavedDealsDrawer
        open={savedDrawerOpen}
        onClose={() => setSavedDrawerOpen(false)}
        savedDeals={savedDeals}
        onRemove={removeSaved}
        onClearAll={clearSaved}
        onQuickView={setQuickViewProduct}
      />

      {/* Share / Action Toast */}
      <Snackbar
        open={Boolean(toastMsg)}
        autoHideDuration={2600}
        onClose={() => setToastMsg(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setToastMsg(null)} sx={{ borderRadius: "8px", fontWeight: 600 }}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AmazonProducts;
