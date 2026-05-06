import React, { useState, useEffect } from "react";
import { Box, Button, IconButton } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import NewsCard from "../components/NewsCard";
import type { Article } from "../types";

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
    const [currentIndex, setCurrentIndex] = useState(0);
    const [slidesToShow, setSlidesToShow] = useState(3);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 600) {
                setSlidesToShow(1);
            } else if (window.innerWidth < 1024) {
                setSlidesToShow(2);
            } else {
                setSlidesToShow(3);
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const maxIndex = Math.max(0, articles.length - slidesToShow);
        if (currentIndex > maxIndex) {
            setCurrentIndex(maxIndex);
        }
    }, [articles.length, slidesToShow, currentIndex]);

    useEffect(() => {
        const maxIndex = Math.max(0, articles.length - slidesToShow);
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(timer);
    }, [articles.length, slidesToShow]);

    const handlePrev = () => {
        setCurrentIndex((prev) =>
            prev === 0 ? Math.max(0, articles.length - slidesToShow) : prev - 1
        );
    };

    const handleNext = () => {
        setCurrentIndex((prev) =>
            prev >= Math.max(0, articles.length - slidesToShow) ? 0 : prev + 1
        );
    };

    const visibleArticles = articles.slice(currentIndex, currentIndex + slidesToShow);

    return (
        <Box sx={{ position: "relative", display: "flex", alignItems: "center", gap: 2, mb: 6 }}>
            <IconButton
                onClick={handlePrev}
                sx={{
                    position: "absolute",
                    left: -40,
                    zIndex: 10,
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.1)" },
                }}
            >
                <ChevronLeftIcon />
            </IconButton>

            <Box
                sx={{
                    display: "flex",
                    gap: 2,
                    width: "100%",
                    overflow: "hidden",
                }}
            >
                {visibleArticles.map((article, idx) => (
                    <Box
                        key={article.url || idx}
                        sx={{
                            flex: `0 0 calc((100% - ${(slidesToShow - 1) * 8}px) / ${slidesToShow})`,
                            minWidth: 0,
                        }}
                    >
                        <NewsCard
                            article={article}
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
            </Box>

            <IconButton
                onClick={handleNext}
                sx={{
                    position: "absolute",
                    right: -40,
                    zIndex: 10,
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.1)" },
                }}
            >
                <ChevronRightIcon />
            </IconButton>

            {/* Dots indicator */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 1,
                    mt: 2,
                    position: "absolute",
                    bottom: -40,
                    left: "50%",
                    transform: "translateX(-50%)",
                }}
            >
                {Array.from({ length: Math.max(1, articles.length - slidesToShow + 1) }).map((_, idx) => (
                    <Button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        sx={{
                            minWidth: 12,
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            padding: 0,
                            backgroundColor: currentIndex === idx ? "primary.main" : "grey.300",
                        }}
                    />
                ))}
            </Box>
        </Box>
    );
};

export default NewsSlider;