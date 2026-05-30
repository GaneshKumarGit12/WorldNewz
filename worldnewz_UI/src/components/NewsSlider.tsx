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
            if (width < 480) return "portrait";
            if (width < 1024) return "landscape";
            return "desktop";
        };

        setSliderKey(getBreakpointKey());

        const handleResize = () => {
            setSliderKey(getBreakpointKey());
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const settings = {
        dots: true,
        infinite: true,
        speed: 600,
        slidesToShow: 1, // Default for mobile
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
        pauseOnHover: true,
        cssEase: "ease-in-out",
        prevArrow: <CustomPrevArrow />,
        nextArrow: <CustomNextArrow />,
        centerMode: true,
        centerPadding: "20px", // Slight peek of adjacent cards on mobile
        mobileFirst: true, // Enable mobile-first breakpoints
        responsive: [
            {
                breakpoint: 480, // screens >= 480px (Landscape Mobiles & Tablets)
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                    centerMode: false,
                }
            },
            {
                breakpoint: 1024, // screens >= 1024px (Desktops)
                settings: {
                    slidesToShow: 5,
                    slidesToScroll: 4,
                    centerMode: false,
                }
            }
        ]
    };

    return (
        <Box 
            sx={{ 
                mb: 8, 
                px: { xs: 0, md: 3 }, 
                "& .slick-track": { 
                    display: "block",
                    "@media (min-width: 480px)": {
                        display: "flex",
                        alignItems: "stretch" 
                    }
                },
                "& .slick-slide": { 
                    height: "auto", 
                    display: "block",
                    transition: "transform 0.3s ease, opacity 0.3s ease",
                    opacity: 0.6,
                    transform: "scale(0.92)",
                    "@media (min-width: 480px)": {
                        display: "flex", 
                        justifyContent: "center",
                        flexShrink: 0,
                        opacity: 1,
                        transform: "scale(1)",
                    },
                    "@media (min-width: 768px)": {
                        opacity: 0.6,
                        transform: "scale(0.92)",
                    },
                    "& > div": { 
                        width: "100%",
                        display: "block",
                        "@media (min-width: 480px)": {
                            display: "flex" 
                        }
                    } 
                },
                "& .slick-center": {
                    opacity: 1,
                    transform: "scale(1)",
                    "@media (min-width: 768px)": {
                        opacity: 1,
                        transform: "scale(1)",
                    }
                },
                "& .slick-dots": { bottom: -35 }
            }}
        >
            <Slider key={sliderKey} {...settings}>
                {articles.map((article, idx) => (
                    <Box key={article.url || idx} sx={{ p: 1, width: "100%", display: "flex", flexDirection: "column" }}>
                        <NewsCard
                            article={article}
                            loading={idx < 2 ? "eager" : "lazy"}
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

export default NewsSlider;