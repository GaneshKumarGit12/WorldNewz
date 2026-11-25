import React, { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import Typography from "@mui/material/Typography";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import SortIcon from "@mui/icons-material/Sort";
import TuneIcon from "@mui/icons-material/Tune";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import type { RawCategoryStat } from "../../api/apiClient";
import { STOREFRONT_CATEGORIES } from "./dealsUtils";

export type DealsSortOption = "newest" | "discount" | "price_asc" | "price_desc" | "rating";

interface DealsFilterToolbarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categoryCounts: Record<string, number>;
  availableCategories: RawCategoryStat[];
  searchInput: string;
  onSearchInputChange: (val: string) => void;
  onClearSearch: () => void;
  sortBy: DealsSortOption;
  onSortChange: (sort: DealsSortOption) => void;
  minDiscount: number | null;
  onToggleMinDiscount: (val: number) => void;
  maxPrice: number | null;
  onToggleMaxPrice: (val: number) => void;
  minRating: number | null;
  onToggleMinRating: (val: number) => void;
  savedOnly: boolean;
  savedCount: number;
  onToggleSavedOnly: () => void;
  totalResults: number;
  onResetAll: () => void;
}

export const DealsFilterToolbar: React.FC<DealsFilterToolbarProps> = ({
  selectedCategory,
  onCategoryChange,
  categoryCounts,
  availableCategories,
  searchInput,
  onSearchInputChange,
  onClearSearch,
  sortBy,
  onSortChange,
  minDiscount,
  onToggleMinDiscount,
  maxPrice,
  onToggleMaxPrice,
  minRating,
  onToggleMinRating,
  savedOnly,
  savedCount,
  onToggleSavedOnly,
  totalResults,
  onResetAll,
}) => {
  const [rawMenuAnchor, setRawMenuAnchor] = useState<null | HTMLElement>(null);

  const isRawCategorySelected =
    selectedCategory !== "All" &&
    !STOREFRONT_CATEGORIES.some((c) => c.key.toLowerCase() === selectedCategory.toLowerCase());

  const activeFilterCount =
    (selectedCategory !== "All" ? 1 : 0) +
    (searchInput.trim() ? 1 : 0) +
    (minDiscount ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (minRating ? 1 : 0) +
    (savedOnly ? 1 : 0) +
    (sortBy !== "newest" ? 1 : 0);

  return (
    <Paper
      elevation={0}
      id="deals-filter-toolbar"
      sx={{
        p: { xs: 1.75, sm: 2.25 },
        mb: 3,
        borderRadius: "10px",
        bgcolor: "var(--color-surface-container)",
        border: "1px solid var(--color-border-divider)",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Row 1: Category Chips (All 7 canonical groups covering all 21 DB categories + All 21 dropdown) */}
      <Box
        role="tablist"
        aria-label="Deal categories"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.85,
          overflowX: "auto",
          pb: 0.5,
          "&::-webkit-scrollbar": { height: 5 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "var(--color-border-divider)", borderRadius: 4 },
        }}
      >
        {STOREFRONT_CATEGORIES.map((cat) => {
          const isActive = !savedOnly && selectedCategory.toLowerCase() === cat.key.toLowerCase();
          const count = categoryCounts[cat.key];
          return (
            <Chip
              key={cat.key}
              id={`tab-category-${cat.key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              role="tab"
              aria-selected={isActive}
              label={
                count !== undefined && count > 0
                  ? `${cat.shortLabel} (${count.toLocaleString("en-IN")})`
                  : cat.shortLabel
              }
              onClick={() => onCategoryChange(cat.key)}
              sx={{
                flexShrink: 0,
                height: 34,
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.78rem",
                cursor: "pointer",
                bgcolor: isActive ? "var(--color-brand-accent)" : "var(--color-surface-container-low)",
                color: isActive ? "#ffffff" : "var(--color-ink-primary)",
                border: "1px solid",
                borderColor: isActive ? "var(--color-brand-accent)" : "var(--color-border-divider)",
                "&:hover": {
                  bgcolor: isActive ? "var(--color-brand-accent-hover)" : "var(--color-surface-container-high)",
                  borderColor: "var(--color-brand-accent)",
                },
              }}
            />
          );
        })}

        {availableCategories.length > 0 && (
          <>
            <Chip
              id="btn-all-subcategories"
              label={isRawCategorySelected ? `Dept: ${selectedCategory}` : `All ${availableCategories.length} Depts`}
              deleteIcon={<ExpandMoreIcon sx={{ color: "inherit !important" }} />}
              onDelete={(e) => {
                const target = (e.currentTarget as HTMLElement).closest(".MuiChip-root") as HTMLElement | null;
                setRawMenuAnchor(target || (e.currentTarget as HTMLElement));
              }}
              onClick={(e) => setRawMenuAnchor(e.currentTarget)}
              sx={{
                flexShrink: 0,
                height: 34,
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.76rem",
                cursor: "pointer",
                bgcolor: isRawCategorySelected ? "var(--color-brand-accent)" : "var(--color-surface-container-low)",
                color: isRawCategorySelected ? "#ffffff" : "var(--color-ink-secondary)",
                border: "1px dashed",
                borderColor: isRawCategorySelected ? "var(--color-brand-accent)" : "var(--color-border-divider)",
              }}
            />
            <Menu
              anchorEl={rawMenuAnchor}
              open={Boolean(rawMenuAnchor)}
              onClose={() => setRawMenuAnchor(null)}
              PaperProps={{
                sx: {
                  maxHeight: 360,
                  minWidth: 240,
                  bgcolor: "var(--color-surface-container)",
                  border: "1px solid var(--color-border-divider)",
                },
              }}
            >
              {availableCategories.map((raw) => (
                <MenuItem
                  key={raw.name}
                  selected={selectedCategory.toLowerCase() === raw.name.toLowerCase()}
                  onClick={() => {
                    onCategoryChange(raw.name);
                    setRawMenuAnchor(null);
                  }}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                    fontSize: "0.84rem",
                    color: "var(--color-ink-primary)",
                  }}
                >
                  <span>{raw.name}</span>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: "var(--font-mono-telemetry)",
                      fontSize: "0.74rem",
                      color: "var(--color-ink-secondary)",
                    }}
                  >
                    {raw.count}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
      </Box>

      {/* Row 2: Search Input + Sort Selector */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1.5,
          alignItems: { xs: "stretch", sm: "center" },
        }}
      >
        <TextField
          id="deals-search-input"
          size="small"
          fullWidth
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          placeholder="Search brands, products, categories, or ASIN..."
          aria-label="Search Amazon deals"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 19, color: "var(--color-ink-secondary)" }} />
              </InputAdornment>
            ),
            endAdornment: searchInput ? (
              <InputAdornment position="end">
                <IconButton
                  id="btn-clear-deals-search"
                  size="small"
                  aria-label="Clear search"
                  onClick={onClearSearch}
                  sx={{ color: "var(--color-ink-secondary)" }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          sx={{
            flex: 1,
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              bgcolor: "var(--color-surface-container-low)",
              color: "var(--color-ink-primary)",
              fontSize: "0.88rem",
              "& fieldset": { borderColor: "var(--color-border-divider)" },
              "&:hover fieldset": { borderColor: "var(--color-ink-tertiary)" },
              "&.Mui-focused fieldset": { borderColor: "var(--color-brand-accent)" },
            },
          }}
        />

        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 210 } }}>
          <Select
            id="deals-sort-select"
            value={sortBy}
            aria-label="Sort deals"
            onChange={(e) => onSortChange(e.target.value as DealsSortOption)}
            startAdornment={
              <InputAdornment position="start">
                <SortIcon sx={{ fontSize: 18, color: "var(--color-ink-secondary)" }} />
              </InputAdornment>
            }
            sx={{
              borderRadius: "8px",
              bgcolor: "var(--color-surface-container-low)",
              color: "var(--color-ink-primary)",
              fontSize: "0.84rem",
              fontWeight: 600,
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--color-border-divider)" },
            }}
          >
            <MenuItem value="newest">Sort: Newest First</MenuItem>
            <MenuItem value="discount">Sort: Biggest Discount</MenuItem>
            <MenuItem value="price_asc">Sort: Price Low → High</MenuItem>
            <MenuItem value="price_desc">Sort: Price High → Low</MenuItem>
            <MenuItem value="rating">Sort: Top Rated</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Row 3: Quick Filter Chips + Results Count + Reset */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.85 }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mr: 0.5, color: "var(--color-ink-secondary)" }}>
            <TuneIcon sx={{ fontSize: 15 }} />
            <Typography component="span" sx={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Quick Filters:
            </Typography>
          </Box>

          <Chip
            id="chip-filter-discount-50"
            label="50%+ Off"
            size="small"
            onClick={() => onToggleMinDiscount(50)}
            sx={{
              borderRadius: "6px",
              fontWeight: 700,
              fontSize: "0.74rem",
              cursor: "pointer",
              bgcolor: minDiscount === 50 ? "var(--color-brand-accent)" : "var(--color-surface-container-low)",
              color: minDiscount === 50 ? "#ffffff" : "var(--color-ink-primary)",
              border: "1px solid",
              borderColor: minDiscount === 50 ? "var(--color-brand-accent)" : "var(--color-border-divider)",
            }}
          />

          <Chip
            id="chip-filter-under-999"
            label="Under ₹999"
            size="small"
            onClick={() => onToggleMaxPrice(999)}
            sx={{
              borderRadius: "6px",
              fontWeight: 700,
              fontSize: "0.74rem",
              cursor: "pointer",
              bgcolor: maxPrice === 999 ? "var(--color-brand-accent)" : "var(--color-surface-container-low)",
              color: maxPrice === 999 ? "#ffffff" : "var(--color-ink-primary)",
              border: "1px solid",
              borderColor: maxPrice === 999 ? "var(--color-brand-accent)" : "var(--color-border-divider)",
            }}
          />

          <Chip
            id="chip-filter-rating-45"
            label="4.5★ & Up"
            size="small"
            onClick={() => onToggleMinRating(4.5)}
            sx={{
              borderRadius: "6px",
              fontWeight: 700,
              fontSize: "0.74rem",
              cursor: "pointer",
              bgcolor: minRating === 4.5 ? "var(--color-brand-accent)" : "var(--color-surface-container-low)",
              color: minRating === 4.5 ? "#ffffff" : "var(--color-ink-primary)",
              border: "1px solid",
              borderColor: minRating === 4.5 ? "var(--color-brand-accent)" : "var(--color-border-divider)",
            }}
          />

          <Chip
            id="chip-filter-saved"
            icon={<BookmarkIcon sx={{ fontSize: "14px !important", color: "inherit !important" }} />}
            label={`Saved (${savedCount})`}
            size="small"
            onClick={onToggleSavedOnly}
            sx={{
              borderRadius: "6px",
              fontWeight: 700,
              fontSize: "0.74rem",
              cursor: "pointer",
              bgcolor: savedOnly ? "var(--color-brand-accent)" : "var(--color-surface-container-low)",
              color: savedOnly ? "#ffffff" : "var(--color-ink-primary)",
              border: "1px solid",
              borderColor: savedOnly ? "var(--color-brand-accent)" : "var(--color-border-divider)",
            }}
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Typography
            component="span"
            sx={{
              fontFamily: "var(--font-mono-telemetry)",
              fontSize: "0.74rem",
              color: "var(--color-ink-secondary)",
            }}
          >
            Showing {totalResults.toLocaleString("en-IN")} {totalResults === 1 ? "deal" : "deals"}
          </Typography>

          {activeFilterCount > 0 && (
            <Button
              id="btn-reset-deals-filters"
              size="small"
              startIcon={<RestartAltIcon sx={{ fontSize: 16 }} />}
              onClick={onResetAll}
              sx={{
                fontSize: "0.74rem",
                fontWeight: 700,
                color: "var(--color-brand-accent)",
                py: 0.25,
                px: 1,
                minWidth: 0,
              }}
            >
              Reset ({activeFilterCount})
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
};
