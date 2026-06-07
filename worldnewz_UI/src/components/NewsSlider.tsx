import React from "react";
import { Box, IconButton } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ReactSlick from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import NewsCard from "../components/NewsCard";
import type { Article } from "../types";

// Workaround for Vite and react-slick default export mismatch
const Slider = typeof ReactSlick === "function" ? ReactSlick : (ReactSlick as any).default;

interface Props {
    articles: Article[];
    onBookmark: (article: Article) => void;
    onRemoveBookmark: (url: string) => void;
    isBookmarked: (url: string) => boolean;
    onLike?: (articleUrl: string) => void;
    onDislike?: (articleUrl: string) => void;
    onAddComment?: (articleUrl: string, text: string, author: string) => void;
    onDeleteComment?: (articleUrl: string, commentId: string) => void;
    onLikeComment?: (articleUrl: string, commentId: string) => void;
    onDislikeComment?: (articleUrl: string, commentId: string) => void;
    getEngagement?: (articleUrl: string) => any;
}

const CustomPrevArrow = (props: any) => {
    const { onClick } = props;
    return (
        <IconButton
            onClick={onClick}
            sx={{
                position: "absolute",
                left: -24,
                zIndex: 10,
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: "background.paper",
                boxShadow: 3,
                "&:hover": { backgroundColor: "action.hover" },
                display: { xs: "none", md: "flex" },
                width: 40,
                height: 40,
            }}
        >
            <ChevronLeftIcon />
        </IconButton>
    );
};

const CustomNextArrow = (props: any) => {
    const { onClick } = props;
    return (
        <IconButton
            onClick={onClick}
            sx={{
                position: "absolute",
                right: -24,
                zIndex: 10,
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: "background.paper",
                boxShadow: 3,
                "&:hover": { backgroundColor: "action.hover" },
                display: { xs: "none", md: "flex" },
                width: 40,
                height: 40,
            }}
        >
            <ChevronRightIcon />
        </IconButton>
    );
};

const NewsSlider: React.FC<Props> = ({ 
    articles, 
    onBookmark, 
    onRemoveBookmark, 
    isBookmarked,
    onLike,
    onDislike,
    onAddComment,
    onDeleteComment,
    onLikeComment,
    onDislikeComment,
    getEngagement,
}) => {
    if (!articles || articles.length === 0) return null;

    const [sliderKey, setSliderKey] = React.useState("");

    React.useEffect(() => {
        const getBreakpointKey = () => {
            const width = window.innerWidth;
            if (width < 480) return "mobile-portrait";
            if (width < 768) return "mobile-landscape";
            if (width < 1024) return "tablet";
            if (width < 1200) return "laptop";
            return "desktop";
        };

        setSliderKey(getBreakpointKey());

        const handleResize = () => {
            setSliderKey(getBreakpointKey());
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Helper to dynamically calculate slides to show based on resolution and article count to prevent stretching
    const getSlidesToShow = (breakpoint: "desktop" | "laptop" | "tablet" | "mobile-landscape" | "mobile-portrait") => {
        const count = articles.length;
        if (breakpoint === "desktop") return Math.min(5, count);
        if (breakpoint === "laptop") return Math.min(4, count);
        if (breakpoint === "tablet") return Math.min(4, count);
        if (breakpoint === "mobile-landscape") return Math.min(3, count);
        return 1;
    };

    const settings = {
        dots: articles.length > 1,
        infinite: articles.length > 5,
        speed: 500,
        slidesToShow: getSlidesToShow("desktop"),
        slidesToScroll: 1,
        autoplay: articles.length > 1,
        autoplaySpeed: 4000,
        pauseOnHover: true,
        lazyLoad: "ondemand" as const,
        cssEase: "ease-in-out",
        prevArrow: <CustomPrevArrow />,
        nextArrow: <CustomNextArrow />,
        centerMode: false,
        responsive: [
            {
                breakpoint: 1200, // < 1200px (Laptops)
                settings: {
                    slidesToShow: getSlidesToShow("laptop"),
                    slidesToScroll: 1,
                    infinite: articles.length > 4,
                }
            },
            {
                breakpoint: 1024, // < 1024px (Tablets)
                settings: {
                    slidesToShow: getSlidesToShow("tablet"),
                    slidesToScroll: 1,
                    infinite: articles.length > 4,
                }
            },
            {
                breakpoint: 768, // < 768px (Mobiles Landscape)
                settings: {
                    slidesToShow: getSlidesToShow("mobile-landscape"),
                    slidesToScroll: 1,
                    infinite: articles.length > 3,
                }
            },
            {
                breakpoint: 480, // < 480px (Mobiles Portrait)
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    infinite: articles.length > 1,
                    centerMode: articles.length > 1,
                    centerPadding: "24px",
                }
            }
        ]
    };

    return (
        <Box 
            sx={{ 
                mb: 8, 
                px: { xs: 0, md: 3 }, 
                position: "relative",
                // Customize slick track and slides for premium card spacing and effects
                "& .slick-slide": { 
                    p: 1,
                    height: "auto",
                    transition: "transform 0.3s ease, opacity 0.3s ease",
                    // Apply focus effect on mobile portrait center mode only
                    "@media (max-width: 479px)": {
                        opacity: 0.6,
                        transform: "scale(0.92)",
                    }
                },
                "& .slick-center": {
                    "@media (max-width: 479px)": {
                        opacity: 1,
                        transform: "scale(1)",
                    }
                },
                "& .slick-list": {
                    mx: -1, // Negate slide padding on container edges
                },
                "& .slick-dots": { 
                    bottom: -35,
                    "& li button:before": {
                        color: "primary.main",
                        opacity: 0.25,
                    },
                    "& li.slick-active button:before": {
                        color: "primary.main",
                        opacity: 0.85,
                    }
                }
            }}
        >
            <Slider key={sliderKey} {...settings}>
                {articles.map((article, idx) => (
                    <Box key={article.url || idx} sx={{ p: 1, width: "100%", display: "flex", flexDirection: "column" }}>
                        <NewsCard
                            article={article}
                            loading={idx < 5 ? "eager" : "lazy"}
                            onBookmark={onBookmark}
                            onRemoveBookmark={onRemoveBookmark}
                            isBookmarked={article.url ? isBookmarked(article.url) : false}
                            onLike={onLike}
                            onDislike={onDislike}
                            onAddComment={onAddComment}
                            onDeleteComment={onDeleteComment}
                            onLikeComment={onLikeComment}
                            onDislikeComment={onDislikeComment}
                            engagement={article.url && getEngagement ? getEngagement(article.url) : undefined}
                        />
                    </Box>
                ))}
            </Slider>
        </Box>
    );
};

export default React.memo(NewsSlider);