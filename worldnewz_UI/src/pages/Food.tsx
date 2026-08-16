import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";

import SearchIcon from "@mui/icons-material/Search";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CloseIcon from "@mui/icons-material/Close";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CheckIcon from "@mui/icons-material/Check";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";

import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { useKeywords } from "../seo/useKeywords";
import { CategoryEditorial } from "../components/CategoryEditorial";
import AdBannerCard from "../components/AdBannerCard";

import {
  fetchRecipesSearch,
  fetchRecipeDetails,
  fetchRandomRecipes
} from "../api/apiClient";
import type {
  SpoonacularRecipe,
  SpoonacularRecipeDetails
} from "../api/apiClient";

const DIET_FILTERS = [
  { value: "", label: "All Diets" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten free", label: "Gluten Free" },
  { value: "ketogenic", label: "Ketogenic" },
  { value: "dairy free", label: "Dairy Free" },
  { value: "paleo", label: "Paleo" }
];

const MEAL_FILTERS = [
  { value: "", label: "All Meals" },
  { value: "main course", label: "Main Course" },
  { value: "breakfast", label: "Breakfast" },
  { value: "appetizer", label: "Appetizer" },
  { value: "side dish", label: "Side Dish" },
  { value: "dessert", label: "Dessert" },
  { value: "salad", label: "Salad" },
  { value: "soup", label: "Soup" }
];

const Food: React.FC = () => {
  const outletContext = useOutletContext<{ searchTerm?: string }>();
  const globalSearchTerm = outletContext?.searchTerm ?? "";

  // State
  const [recipes, setRecipes] = useState<SpoonacularRecipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDiet, setSelectedDiet] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);
  const pageSize = 12;

  // Recipe Details Modal
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [recipeDetails, setRecipeDetails] = useState<SpoonacularRecipeDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});

  // SEO Keywords hook
  const dynamicKeywordsData = useKeywords("food");
  const defaultKeywords = ["gourmet recipes", "dietary plan", "kitchen tips", "healthy ingredients", "home cooking", "culinary science", "vegan guides", "macronutrient calculations"];
  const combinedKeywords = dynamicKeywordsData
    ? [...new Set([...defaultKeywords, ...dynamicKeywordsData.primary, ...dynamicKeywordsData.longtail, ...dynamicKeywordsData.trending])]
    : defaultKeywords;

  // Sync global search from layout header if any
  useEffect(() => {
    if (globalSearchTerm) {
      setSearchQuery(globalSearchTerm);
      setPage(1);
    }
  }, [globalSearchTerm]);

  // Load recipes (Random on empty search, search proxy otherwise)
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        setLoading(true);
        setError(null);

        const isSearching = searchQuery.trim() || selectedDiet || selectedType;

        if (isSearching) {
          const response = await fetchRecipesSearch({
            query: searchQuery,
            diet: selectedDiet || undefined,
            type: selectedType || undefined,
            page,
            number: pageSize
          });
          setRecipes(response.data?.results || []);
          setTotalResults(response.data?.totalResults || 0);
        } else {
          // If no filters, show random recipes
          const response = await fetchRandomRecipes(pageSize);
          setRecipes(response.data?.recipes || []);
          setTotalResults(pageSize * 5); // Mock pagination range for random
        }
      } catch (err: any) {
        console.error("Failed to load recipes:", err);
        setError("Unable to retrieve recipes. Please check your backend connection or configuration.");
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, [searchQuery, selectedDiet, selectedType, page]);

  // Load Recipe Details
  const handleOpenDetails = async (id: number) => {
    setSelectedRecipeId(id);
    setDetailsLoading(true);
    setDetailsError(null);
    setRecipeDetails(null);
    setCheckedIngredients({});

    try {
      const response = await fetchRecipeDetails(id);
      setRecipeDetails(response.data);
    } catch (err) {
      console.error(`Failed to load recipe details for ID ${id}:`, err);
      setDetailsError("Failed to fetch recipe instructions and nutritional data.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedRecipeId(null);
    setRecipeDetails(null);
  };

  const handleToggleIngredient = (id: number) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleDietClick = (diet: string) => {
    setSelectedDiet(prev => (prev === diet ? "" : diet));
    setPage(1);
  };

  const handleTypeClick = (type: string) => {
    setSelectedType(prev => (prev === type ? "" : type));
    setPage(1);
  };

  // Extract Macronutrients
  const getNutrient = (name: string) => {
    if (!recipeDetails?.nutrition?.nutrients) return null;
    return recipeDetails.nutrition.nutrients.find(n => n.name.toLowerCase() === name.toLowerCase()) || null;
  };

  const calories = getNutrient("Calories");
  const protein = getNutrient("Protein");
  const fat = getNutrient("Fat");
  const carbs = getNutrient("Carbohydrates");

  const totalPages = Math.ceil(totalResults / pageSize);

  // Recipe JSON-LD schema generator for SEO
  const generateRecipeSchema = (recipe: SpoonacularRecipeDetails) => {
    return {
      "@context": "https://schema.org",
      "@type": "Recipe",
      "name": recipe.title,
      "image": recipe.image,
      "description": recipe.summary.replace(/<[^>]*>/g, "").substring(0, 150) + "...",
      "prepTime": `PT${recipe.readyInMinutes}M`,
      "cookTime": `PT${recipe.readyInMinutes}M`,
      "recipeYield": `${recipe.servings} servings`,
      "recipeCategory": recipe.dishTypes?.[0] || "Main Dish",
      "recipeCuisine": recipe.cuisines?.[0] || "International",
      "recipeIngredient": recipe.extendedIngredients?.map(i => i.original) || [],
      "recipeInstructions": recipe.analyzedInstructions?.[0]?.steps?.map(s => ({
        "@type": "HowToStep",
        "text": s.step
      })) || [],
      "nutrition": {
        "@type": "NutritionInformation",
        "calories": calories?.amount ? `${calories.amount} calories` : undefined,
        "proteinContent": protein?.amount ? `${protein.amount} g` : undefined,
        "fatContent": fat?.amount ? `${fat.amount} g` : undefined,
        "carbohydrateContent": carbs?.amount ? `${carbs.amount} g` : undefined
      }
    };
  };

  return (
    <Box
      id="food-page-root"
      component="section"
      sx={{
        minHeight: "100vh",
        bgcolor: "#090e17",
        color: "#f8fafc",
        py: 4,
        px: { xs: 2, md: 4 },
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <SEOMeta
        title="Gourmet Recipes & Culinary Science | WorldNewzs Food"
        description="Discover dietitian-approved recipes, cooking guides, macronutrient estimations, and meal filters (keto, vegan, vegetarian, gluten-free) on WorldNewzs."
        keywords={combinedKeywords}
        canonical="https://worldnewzs.in/food"
      />
      <JSONLDBreadcrumb crumbs={[
        { name: "Home", url: "https://worldnewzs.in" },
        { name: "Food & Recipes", url: "https://worldnewzs.in/food" }
      ]} />

      {/* Top Banner & Title */}
      <Box component="header" sx={{ mb: 4, textAlign: "center" }}>
        <Typography
          variant="h3"
          component="h1"
          id="food-main-heading"
          sx={{
            fontWeight: 900,
            fontSize: { xs: "2rem", md: "3rem" },
            background: "linear-gradient(45deg, #f43f5e, #fb7185)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 1
          }}
        >
          WorldNewzs Culinary Hub
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 600, mx: "auto" }}>
          Savor verified recipes, compute dietary macros, and filter culinary inspiration tailored to your nutrition plan.
        </Typography>
      </Box>

      {/* Search and Filters Section */}
      <Box sx={{ mb: 4, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Search input */}
        <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: "flex", gap: 1, justifySelf: "center", width: "100%", maxWidth: 600, mx: "auto" }}>
          <TextField
            id="food-search-input"
            placeholder="Search recipes (e.g. Pasta, Chicken, Tacos...)"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            sx={{
              bgcolor: "#111a2e",
              borderRadius: 2,
              input: { color: "#fff", fontSize: "0.95rem" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.12)" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#f43f5e" },
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#f43f5e" }
            }}
          />
          <Button
            id="food-search-submit"
            type="submit"
            variant="contained"
            sx={{ bgcolor: "#f43f5e", color: "#fff", fontWeight: 800, "&:hover": { bgcolor: "#e11d48" }, px: 3 }}
          >
            <SearchIcon />
          </Button>
        </Box>

        {/* Diets Chips */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
          <Typography variant="body2" sx={{ fontWeight: 700, mr: 1, color: "text.secondary" }}>Diets:</Typography>
          {DIET_FILTERS.map((d) => (
            <Chip
              key={d.value}
              id={`diet-chip-${d.value || "all"}`}
              label={d.label}
              onClick={() => handleDietClick(d.value)}
              variant={selectedDiet === d.value ? "filled" : "outlined"}
              color={selectedDiet === d.value ? "error" : "default"}
              sx={{
                color: selectedDiet === d.value ? "#fff" : "#cbd5e1",
                borderColor: selectedDiet === d.value ? "transparent" : "rgba(255,255,255,0.15)",
                "&:hover": { bgcolor: selectedDiet === d.value ? "#e11d48" : "rgba(255,255,255,0.06)" }
              }}
            />
          ))}
        </Box>

        {/* Meal Type Chips */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
          <Typography variant="body2" sx={{ fontWeight: 700, mr: 1, color: "text.secondary" }}>Meals:</Typography>
          {MEAL_FILTERS.map((m) => (
            <Chip
              key={m.value}
              id={`meal-chip-${m.value || "all"}`}
              label={m.label}
              onClick={() => handleTypeClick(m.value)}
              variant={selectedType === m.value ? "filled" : "outlined"}
              color={selectedType === m.value ? "error" : "default"}
              sx={{
                color: selectedType === m.value ? "#fff" : "#cbd5e1",
                borderColor: selectedType === m.value ? "transparent" : "rgba(255,255,255,0.15)",
                "&:hover": { bgcolor: selectedType === m.value ? "#e11d48" : "rgba(255,255,255,0.06)" }
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Main Content Area */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress color="error" />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ bgcolor: "#2c1518", color: "#f87171", border: "1px solid #7f1d1d", mx: "auto", maxWidth: 600 }}>
          {error}
        </Alert>
      ) : recipes.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography variant="h6">No recipes found matching your filters.</Typography>
          <Typography variant="body2" color="text.secondary">Try clearing your filters or testing other terms.</Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {recipes.map((recipe) => {
              // Color code the health score badge
              const scoreColor = recipe.healthScore >= 70
                ? "#22c55e"
                : recipe.healthScore >= 40
                  ? "#eab308"
                  : "#94a3b8";

              return (
                <Grid key={recipe.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <Card
                    id={`recipe-card-${recipe.id}`}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      bgcolor: "#111a2e",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 3,
                      overflow: "hidden",
                      transition: "transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        borderColor: "#f43f5e",
                        boxShadow: "0 10px 25px rgba(244, 63, 94, 0.15)"
                      }
                    }}
                  >
                    {/* Aspect ratio container to prevent layout shift */}
                    <Box sx={{ position: "relative", paddingTop: "56.25%", overflow: "hidden" }}>
                      <CardMedia
                        component="img"
                        image={recipe.image || "https://via.placeholder.com/600x400?text=No+Image+Available"}
                        alt={recipe.title}
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transition: "transform 0.5s ease",
                          "&:hover": { transform: "scale(1.05)" }
                        }}
                      />
                      {/* Health Score Badge overlay */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          bgcolor: scoreColor,
                          color: "#fff",
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                        }}
                      >
                        Health: {recipe.healthScore}
                      </Box>
                    </Box>

                    <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 2 }}>
                      <Typography
                        variant="h6"
                        component="h2"
                        sx={{
                          fontWeight: 800,
                          fontSize: "1.05rem",
                          lineHeight: 1.3,
                          color: "#fff",
                          mb: 1.5,
                          height: "2.6em",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical"
                        }}
                      >
                        {recipe.title}
                      </Typography>

                      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
                          <AccessTimeIcon sx={{ fontSize: "1.1rem", color: "#f43f5e" }} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>{recipe.readyInMinutes} Min</Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
                          <RestaurantIcon sx={{ fontSize: "1.1rem", color: "#f43f5e" }} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>{recipe.servings} Srv</Typography>
                        </Box>
                      </Box>

                      {recipe.diets && recipe.diets.length > 0 && (
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 2 }}>
                          {recipe.diets.slice(0, 2).map(diet => (
                            <Chip
                              key={diet}
                              label={diet}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                bgcolor: "rgba(255,255,255,0.06)",
                                color: "#fb7185",
                                textTransform: "capitalize"
                              }}
                            />
                          ))}
                        </Box>
                      )}

                      <Box sx={{ mt: "auto" }}>
                        <Button
                          id={`recipe-view-btn-${recipe.id}`}
                          variant="outlined"
                          color="error"
                          fullWidth
                          onClick={() => handleOpenDetails(recipe.id)}
                          sx={{
                            borderWidth: 1.5,
                            fontWeight: 800,
                            borderRadius: 2,
                            textTransform: "none",
                            "&:hover": { borderWidth: 1.5, bgcolor: "rgba(244, 63, 94, 0.08)" }
                          }}
                        >
                          View Full Recipe
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}

            {/* Inline AdBannerCard placement to satisfy separation layout requirements */}
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <AdBannerCard />
            </Grid>
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 6, mb: 2 }}>
              <Button
                id="food-prev-page"
                variant="outlined"
                color="error"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                sx={{ fontWeight: 800 }}
              >
                Prev
              </Button>
              <Box sx={{ display: "flex", alignItems: "center", px: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Page {page} of {totalPages}
                </Typography>
              </Box>
              <Button
                id="food-next-page"
                variant="outlined"
                color="error"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                sx={{ fontWeight: 800 }}
              >
                Next
              </Button>
            </Box>
          )}
        </>
      )}

      {/* Editorial Content Guidance Banner */}
      <Box sx={{ mt: 6, mb: 4 }}>
        <CategoryEditorial categoryKey="food" />
      </Box>

      {/* Accordion FAQ Section */}
      <Box sx={{ mt: 6, mb: 4, maxWidth: 800, mx: "auto" }}>
        <Typography
          variant="h4"
          component="h2"
          id="food-faq-heading"
          sx={{ fontWeight: 900, mb: 3, textAlign: "center", color: "#fff", fontSize: { xs: "1.5rem", md: "1.8rem" } }}
        >
          Frequently Asked Questions (FAQs)
        </Typography>

        <Accordion sx={{ bgcolor: "#111a2e", border: "1px solid rgba(255,255,255,0.06)", mb: 1, borderRadius: 2, overflow: "hidden", "&:before": { display: "none" } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#f43f5e" }} />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#fff" }}>
              How do I filter recipes by specific dietary needs like vegan or ketogenic?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              WorldNewzs Culinary Hub provides instant filters for common diets. You can click on the dietary badges like Vegetarian, Vegan, Gluten-Free, or Ketogenic at the top of the interface to instantly filter search results. Our backend aggregates these recipes securely via the Spoonacular API to match your criteria exactly.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion sx={{ bgcolor: "#111a2e", border: "1px solid rgba(255,255,255,0.06)", mb: 1, borderRadius: 2, overflow: "hidden", "&:before": { display: "none" } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#f43f5e" }} />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#fff" }}>
              Are the nutritional values in the recipe details accurate?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Yes, the nutritional information is calculated dynamically based on the verified ingredient portions using Spoonacular's extensive ingredient database. We display a detailed macronutrient breakdown (calories, proteins, fats, and carbohydrates) to help you track your dietary goals safely.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion sx={{ bgcolor: "#111a2e", border: "1px solid rgba(255,255,255,0.06)", mb: 1, borderRadius: 2, overflow: "hidden", "&:before": { display: "none" } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#f43f5e" }} />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#fff" }}>
              Can I save recipes or check off ingredients during cooking?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Absolutely! Every recipe details view includes an interactive checklist of ingredients. You can check off items as you gather them or check off completed tasks. Additionally, the modal displays detailed step-by-step instructions so you can follow along easily in the kitchen.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Recipe Detail View Modal Dialog */}
      <Dialog
        open={selectedRecipeId !== null}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
        scroll="body"
        PaperProps={{
          sx: {
            bgcolor: "#0f172a",
            color: "#f8fafc",
            borderRadius: 4,
            backgroundImage: "none",
            border: "1px solid rgba(255,255,255,0.12)",
            p: 0,
            overflow: "hidden"
          }
        }}
      >
        {detailsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress color="error" />
          </Box>
        ) : detailsError ? (
          <Box sx={{ p: 4 }}>
            <Alert severity="error">{detailsError}</Alert>
            <Button onClick={handleCloseDetails} color="error" variant="contained" sx={{ mt: 2 }}>Close</Button>
          </Box>
        ) : recipeDetails ? (
          <>
            {/* Structured Schema Data inject */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateRecipeSchema(recipeDetails)) }} />

            {/* Modal Title Banner */}
            <Box sx={{ position: "relative" }}>
              <CardMedia
                component="img"
                height="320"
                image={recipeDetails.image || "https://via.placeholder.com/800x400?text=No+Image+Available"}
                alt={recipeDetails.title}
                sx={{ objectFit: "cover" }}
              />
              {/* Close Button overlay */}
              <IconButton
                id="close-recipe-modal"
                onClick={handleCloseDetails}
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  bgcolor: "rgba(0,0,0,0.5)",
                  color: "#fff",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.8)" }
                }}
              >
                <CloseIcon />
              </IconButton>
              {/* Title overlay gradient */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  bgcolor: "linear-gradient(to top, rgba(15,23,42,1), rgba(15,23,42,0))",
                  pt: 8,
                  pb: 3,
                  px: 3
                }}
              >
                <Typography variant="h4" component="h3" sx={{ fontWeight: 900, textShadow: "0 2px 6px rgba(0,0,0,0.5)" }}>
                  {recipeDetails.title}
                </Typography>
              </Box>
            </Box>

            <DialogContent sx={{ px: 3, pb: 4, pt: 1 }}>
              {/* Overview Details pills */}
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
                <Chip icon={<AccessTimeIcon sx={{ color: "#fb7185" }} />} label={`${recipeDetails.readyInMinutes} Mins`} sx={{ bgcolor: "#1e293b", color: "#f8fafc", fontWeight: 700 }} />
                <Chip icon={<RestaurantIcon sx={{ color: "#fb7185" }} />} label={`${recipeDetails.servings} Servings`} sx={{ bgcolor: "#1e293b", color: "#f8fafc", fontWeight: 700 }} />
                <Chip icon={<FavoriteIcon sx={{ color: "#fb7185" }} />} label={`Health Score: ${recipeDetails.healthScore}`} sx={{ bgcolor: "#1e293b", color: "#f8fafc", fontWeight: 700 }} />
                {recipeDetails.diets?.map(diet => (
                  <Chip key={diet} label={diet} sx={{ bgcolor: "rgba(244,63,94,0.15)", color: "#fb7185", fontWeight: 700, textTransform: "capitalize" }} />
                ))}
              </Box>

              {/* Recipe Description Summary */}
              <Typography
                variant="body2"
                color="text.secondary"
                dangerouslySetInnerHTML={{ __html: recipeDetails.summary }}
                sx={{
                  mb: 4,
                  lineHeight: 1.6,
                  "& a": { color: "#fb7185", fontWeight: 700, textDecoration: "none" }
                }}
              />

              <Grid container spacing={4}>
                {/* Ingredients checklist (interactive checkoffs) */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h5" component="h4" sx={{ fontWeight: 900, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <MenuBookIcon sx={{ color: "#f43f5e" }} /> Ingredients
                  </Typography>
                  <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    {recipeDetails.extendedIngredients?.map((ing) => (
                      <FormControlLabel
                        key={ing.id}
                        control={
                          <Checkbox
                            checked={!!checkedIngredients[ing.id]}
                            onChange={() => handleToggleIngredient(ing.id)}
                            color="error"
                            sx={{
                              color: "rgba(255,255,255,0.3)",
                              "&.Mui-checked": { color: "#22c55e" }
                            }}
                          />
                        }
                        label={
                          <Typography
                            variant="body2"
                            sx={{
                              color: checkedIngredients[ing.id] ? "text.disabled" : "#fff",
                              textDecoration: checkedIngredients[ing.id] ? "line-through" : "none",
                              transition: "all 0.2s ease"
                            }}
                          >
                            {ing.original}
                          </Typography>
                        }
                        sx={{ mb: 0.5, mr: 0 }}
                      />
                    ))}
                  </Box>
                </Grid>

                {/* Nutrition breakdown visually */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h5" component="h4" sx={{ fontWeight: 900, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <LocalFireDepartmentIcon sx={{ color: "#f43f5e" }} /> Nutrition Facts
                  </Typography>
                  <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />
                  <Paper sx={{ p: 2.5, bgcolor: "#1e293b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3 }}>
                    <Box sx={{ mb: 2.5, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <Typography variant="body1" sx={{ fontWeight: 800 }}>Calories</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: "#fb7185" }}>
                        {calories?.amount ? Math.round(calories.amount) : "N/A"} kcal
                      </Typography>
                    </Box>

                    {/* Caloric breakdown progress meters */}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>Protein ({protein?.amount || 0}g)</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: "#60a5fa" }}>
                            {recipeDetails.nutrition?.caloricBreakdown?.percentProtein ? Math.round(recipeDetails.nutrition.caloricBreakdown.percentProtein) : 0}%
                          </Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={recipeDetails.nutrition?.caloricBreakdown?.percentProtein || 0} sx={{ height: 6, borderRadius: 3, bgcolor: "rgba(255,255,255,0.1)", "& .MuiLinearProgress-bar": { bgcolor: "#3b82f6" } }} />
                      </Box>

                      <Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>Carbohydrates ({carbs?.amount || 0}g)</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: "#34d399" }}>
                            {recipeDetails.nutrition?.caloricBreakdown?.percentCarbs ? Math.round(recipeDetails.nutrition.caloricBreakdown.percentCarbs) : 0}%
                          </Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={recipeDetails.nutrition?.caloricBreakdown?.percentCarbs || 0} sx={{ height: 6, borderRadius: 3, bgcolor: "rgba(255,255,255,0.1)", "& .MuiLinearProgress-bar": { bgcolor: "#10b981" } }} />
                      </Box>

                      <Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>Fats ({fat?.amount || 0}g)</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: "#f87171" }}>
                            {recipeDetails.nutrition?.caloricBreakdown?.percentFat ? Math.round(recipeDetails.nutrition.caloricBreakdown.percentFat) : 0}%
                          </Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={recipeDetails.nutrition?.caloricBreakdown?.percentFat || 0} sx={{ height: 6, borderRadius: 3, bgcolor: "rgba(255,255,255,0.1)", "& .MuiLinearProgress-bar": { bgcolor: "#ef4444" } }} />
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              {/* Cooking Instructions steps */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h5" component="h4" sx={{ fontWeight: 900, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckIcon sx={{ color: "#f43f5e" }} /> Cooking Steps
                </Typography>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />

                {recipeDetails.analyzedInstructions && recipeDetails.analyzedInstructions.length > 0 ? (
                  recipeDetails.analyzedInstructions[0].steps.map((step) => (
                    <Box key={step.number} sx={{ display: "flex", gap: 2, mb: 2.5 }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          bgcolor: "#f43f5e",
                          color: "#fff",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          fontWeight: 800,
                          fontSize: "0.85rem",
                          flexShrink: 0,
                          mt: 0.2
                        }}
                      >
                        {step.number}
                      </Box>
                      <Typography variant="body2" sx={{ lineHeight: 1.6, pt: 0.3 }}>
                        {step.step}
                      </Typography>
                    </Box>
                  ))
                ) : recipeDetails.instructions ? (
                  <Typography
                    variant="body2"
                    dangerouslySetInnerHTML={{ __html: recipeDetails.instructions }}
                    sx={{ lineHeight: 1.6, "& a": { color: "#fb7185", fontWeight: 700 } }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No cooking instructions available.
                  </Typography>
                )}
              </Box>
            </DialogContent>
          </>
        ) : null}
      </Dialog>
    </Box>
  );
};

export default Food;
