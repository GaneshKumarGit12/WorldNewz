import React, { useState } from "react";
import { Box, Typography, Paper, Tabs, Tab, Accordion, AccordionSummary, AccordionDetails, Chip } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PolicyIcon from "@mui/icons-material/Policy";
import MemoryIcon from "@mui/icons-material/Memory";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import ScienceIcon from "@mui/icons-material/Science";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { Link } from "react-router-dom";

interface CategoryBrief {
  id: string;
  name: string;
  icon: React.ReactNode;
  headline: string;
  summary: string;
  bullets: string[];
  faqs: { q: string; a: string }[];
}

const CATEGORY_BRIEFS: CategoryBrief[] = [
  {
    id: "politics",
    name: "Politics",
    icon: <PolicyIcon sx={{ fontSize: 18 }} />,
    headline: "Global Geopolitical Realignments & Policy Reforms",
    summary: "Diplomatic summits advanced multilateral frameworks on data governance, energy security, and cross-border trade. Domestic legislative bodies are deliberating civil modernization bills aimed at strengthening regional governance.",
    bullets: [
      "International accords on sustainable infrastructure financing and cross-border clean energy grids.",
      "Parliamentary debates on comprehensive administrative transparency and civic infrastructure modernization.",
      "Bilateral security dialogues focused on cybersecurity standards and critical digital supply chains."
    ],
    faqs: [
      {
        q: "What are the primary policy reforms discussed today?",
        a: "Discussions focused on cross-border energy distribution pacts, national digital infrastructure guidelines, and administrative transparency frameworks."
      },
      {
        q: "How do these diplomatic accords affect everyday citizens?",
        a: "They promote regional stability, incentivize clean public transit investments, and improve digital data privacy protections."
      }
    ]
  },
  {
    id: "technology",
    name: "Technology",
    icon: <MemoryIcon sx={{ fontSize: 18 }} />,
    headline: "AI On-Device Reasoning Breakthroughs & Silicon Innovation",
    summary: "Leading hardware and AI consortiums announced novel 2-nanometer processor architectures and compressed neural reasoning models that execute locally on consumer smartphones without cloud latency.",
    bullets: [
      "Next-generation on-device AI models deliver real-time logical synthesis with 40% lower power consumption.",
      "Semiconductor roadmaps prioritize localized neural processing units (NPUs) for consumer privacy.",
      "Open-source security consortiums deploy cryptographic provenance standards to detect deepfakes."
    ],
    faqs: [
      {
        q: "What is on-device AI processing and why does it matter?",
        a: "On-device processing runs complex AI models directly on your phone or laptop processor without sending your private data to external cloud servers, ensuring instant response times and complete privacy."
      },
      {
        q: "When will 2-nanometer consumer processors become available?",
        a: "Major semiconductor foundries expect commercial production to ramp up across flagship smartphones and laptops over the next 12 to 18 months."
      }
    ]
  },
  {
    id: "business",
    name: "Business",
    icon: <BusinessCenterIcon sx={{ fontSize: 18 }} />,
    headline: "Market Indices Advance Amid Stabilizing Inflation Trends",
    summary: "Global equity bourses posted steady gains as macroeconomic inflation readings stabilized. Institutional investments expanded into renewable energy infrastructure, manufacturing technology, and logistics networks.",
    bullets: [
      "Benchmark stock indices closed higher, led by large-cap technology and healthcare equities.",
      "Venture capital funding rebounded in enterprise software, clean tech, and automated logistics.",
      "Central bank monetary committee statements indicate positive outlook for economic soft landing."
    ],
    faqs: [
      {
        q: "What factors drove today's stock market momentum?",
        a: "Lower-than-expected inflation metrics, robust corporate earnings reports, and strong foreign institutional investor inflows propelled benchmark indices."
      },
      {
        q: "Which industry sectors are leading current investment flows?",
        a: "Enterprise AI infrastructure, clean energy manufacturing, and specialized healthcare technologies lead current allocations."
      }
    ]
  },
  {
    id: "science-health",
    name: "Science & Health",
    icon: <ScienceIcon sx={{ fontSize: 18 }} />,
    headline: "Clinical Longevity Discoveries & Deep-Space Observations",
    summary: "Peer-reviewed medical trials demonstrated significant cognitive vitality gains from Mediterranean dietary patterns. Concurrently, space observatories captured groundbreaking atmospheric data from distant exoplanets.",
    bullets: [
      "Longitudinal study confirms antioxidant-rich nutrition reduces neurodegenerative risk by up to 28%.",
      "Next-generation space telescopes detect water vapor and atmospheric signatures in habitable planetary zones.",
      "Biotech researchers engineer enzyme-based recyclable plastics that decompose naturally within months."
    ],
    faqs: [
      {
        q: "What specific dietary factors preserve cognitive health?",
        a: "High intake of polyphenol-rich olive oil, leafy greens, wild fish, and raw nuts combined with minimal processed sugars significantly supports neural vascular health."
      },
      {
        q: "What is the significance of the new exoplanetary atmospheric data?",
        a: "Spectroscopic identification of atmospheric gases provides critical clues regarding the prebiotic chemical evolution of distant worlds."
      }
    ]
  },
  {
    id: "sports",
    name: "Sports",
    icon: <SportsSoccerIcon sx={{ fontSize: 18 }} />,
    headline: "Championship Race Climaxes & Global Tournament Fixtures",
    summary: "Dramatic extra-time victories reshaped league tables across international football, while national cricket squads announced updated line-ups for upcoming multi-nation championships.",
    bullets: [
      "Stunning comeback victories secure decisive playoff berths in top-tier football leagues.",
      "Cricket board selectors unveil strategic squads with young all-rounders for international tours.",
      "Championship athletic qualifiers break standing venue records in track and sprint events."
    ],
    faqs: [
      {
        q: "Where can fans find live match score updates?",
        a: "WorldNewzs provides real-time match results, schedules, and league rankings on our dedicated Sports category page."
      }
    ]
  },
  {
    id: "money",
    name: "Money & Wealth",
    icon: <AttachMoneyIcon sx={{ fontSize: 18 }} />,
    headline: "Personal Wealth Management & Tax-Saving Strategies",
    summary: "Financial planners emphasize disciplined index investing, tax-advantaged retirement accounts, and emergency liquid reserve allocation to navigate evolving interest rate cycles.",
    bullets: [
      "Automated systematic investment plans (SIPs) continue to demonstrate long-term compounding benefits.",
      "New guidelines released for maximizing deductions on retirement savings and health insurance premiums.",
      "Fixed-income instruments offer attractive yields for conservative capital preservation."
    ],
    faqs: [
      {
        q: "How should individual investors allocate capital in the current market?",
        a: "A balanced portfolio combining low-cost index funds, fixed-income instruments, and a 6-month liquid emergency fund remains the gold standard."
      }
    ]
  }
];

export const MoreNewsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const currentBrief = CATEGORY_BRIEFS[activeTab] || CATEGORY_BRIEFS[0];

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3.5 },
        mb: 4,
        backgroundColor: "var(--paper-raise, #162035)",
        border: "1px solid var(--line, #232E48)",
        borderRadius: "4px",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AutoAwesomeIcon sx={{ color: "var(--red, #B7222B)", fontSize: 22 }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontFamily: "var(--serif, 'Source Serif 4', Georgia, serif)",
              color: "var(--text, #FFFFFF)",
              fontSize: { xs: "1.15rem", md: "1.35rem" },
            }}
          >
            More News: AI Multi-Category Intelligence Briefings
          </Typography>
        </Box>
        <Chip
          label="DAILY SYNTHESIS"
          size="small"
          sx={{
            fontFamily: "var(--mono, monospace)",
            fontSize: "10px",
            letterSpacing: "0.08em",
            fontWeight: 700,
            backgroundColor: "rgba(183, 34, 43, 0.15)",
            color: "var(--red, #B7222B)",
            border: "1px solid rgba(183, 34, 43, 0.3)",
          }}
        />
      </Box>

      <Typography
        variant="body2"
        sx={{
          color: "var(--slate, #9AA2B4)",
          fontFamily: "var(--sans, sans-serif)",
          lineHeight: 1.6,
          mb: 2.5,
        }}
      >
        Explore comprehensive, category-by-category analytical overviews synthesized by our Editorial AI engine from verified global primary sources.
      </Typography>

      {/* Category Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, val) => setActiveTab(val)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          borderBottom: "1px solid var(--line-soft, rgba(255,255,255,0.08))",
          mb: 3,
          "& .MuiTab-root": {
            textTransform: "none",
            fontFamily: "var(--sans, sans-serif)",
            fontWeight: 600,
            fontSize: "13px",
            color: "var(--slate, #9AA2B4)",
            minHeight: 42,
            gap: 0.8,
            "&.Mui-selected": {
              color: "var(--red, #B7222B)",
            },
          },
          "& .MuiTabs-indicator": {
            backgroundColor: "var(--red, #B7222B)",
            height: 2,
          },
        }}
      >
        {CATEGORY_BRIEFS.map((cat) => (
          <Tab
            key={cat.id}
            icon={cat.icon as React.ReactElement}
            iconPosition="start"
            label={cat.name}
            id={`tab-more-news-${cat.id}`}
          />
        ))}
      </Tabs>

      {/* Active Category Brief Content */}
      <Box sx={{ animation: "fadeIn 0.3s ease-in-out" }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontFamily: "var(--sans, sans-serif)",
            color: "var(--text, #FFFFFF)",
            fontSize: "1.1rem",
            mb: 1.5,
          }}
        >
          {currentBrief.headline}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "var(--text, #E2E8F0)",
            lineHeight: 1.75,
            fontFamily: "var(--sans, sans-serif)",
            mb: 2,
          }}
        >
          {currentBrief.summary}
        </Typography>

        {/* Bullets */}
        <Box sx={{ mb: 2.5 }}>
          <Typography
            variant="caption"
            sx={{
              fontFamily: "var(--mono, monospace)",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--slate-light, #7C86A0)",
              display: "block",
              mb: 1,
            }}
          >
            Key Sector Developments:
          </Typography>
          <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
            {currentBrief.bullets.map((bullet, i) => (
              <Typography
                component="li"
                key={i}
                variant="body2"
                sx={{
                  color: "var(--slate, #9AA2B4)",
                  lineHeight: 1.65,
                  fontFamily: "var(--sans, sans-serif)",
                  mb: 0.75,
                }}
              >
                {bullet}
              </Typography>
            ))}
          </Box>
        </Box>

        {/* FAQs */}
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="caption"
            sx={{
              fontFamily: "var(--mono, monospace)",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--slate-light, #7C86A0)",
              display: "block",
              mb: 1,
            }}
          >
            Sector Q&A:
          </Typography>
          {currentBrief.faqs.map((faq, i) => (
            <Accordion
              key={i}
              elevation={0}
              sx={{
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid var(--line-soft, rgba(255,255,255,0.08))",
                borderRadius: "3px !important",
                mb: 1,
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "var(--slate, #9AA2B4)", fontSize: 18 }} />}>
                <Typography sx={{ fontFamily: "var(--sans, sans-serif)", fontSize: "13px", fontWeight: 600, color: "var(--text, #FFFFFF)" }}>
                  {faq.q}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 1.5 }}>
                <Typography sx={{ fontFamily: "var(--sans, sans-serif)", fontSize: "12.5px", color: "var(--slate, #9AA2B4)", lineHeight: 1.6 }}>
                  {faq.a}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        {/* Link to Full Category Page */}
        <Box sx={{ mt: 2.5, textAlign: "right" }}>
          <Typography
            component={Link}
            to={`/${currentBrief.id}`}
            sx={{
              fontFamily: "var(--mono, monospace)",
              fontSize: "12px",
              color: "var(--red, #B7222B)",
              textDecoration: "none",
              fontWeight: 600,
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Explore all {currentBrief.name} News & Stories &rarr;
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default MoreNewsSection;
