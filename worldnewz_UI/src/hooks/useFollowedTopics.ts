import { useState, useEffect, useCallback } from "react";

export const TOPICS_STORAGE_KEY = "worldnewz_followed_topics";
export const TOPICS_UPDATED_EVENT = "worldnewz_topics_updated";

// Helper to normalize stored values to canonical topic IDs (supporting legacy category strings)
const normalizeStoredTopicIds = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return [];
  const validIds = new Set<string>();

  raw.forEach((item) => {
    if (typeof item !== "string") return;
    const val = item.trim().toLowerCase();

    // Map legacy category keywords to canonical IDs if necessary
    if (val === "technology" || val === "top-ai") validIds.add("top-ai");
    else if (val === "movies" || val === "entertainment" || val === "top-movies") validIds.add("top-movies");
    else if (val === "top-gaming") validIds.add("top-gaming");
    else if (val === "top-playstation") validIds.add("top-playstation");
    else if (val === "gaming") {
      // Legacy "gaming" keyword mapped to top-gaming
      validIds.add("top-gaming");
    } else if (val === "stocks" || val === "business" || val === "top-stocks") validIds.add("top-stocks");
    else if (val.startsWith("top-")) validIds.add(val);
  });

  return Array.from(validIds);
};

export const getStoredFollowedTopics = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(TOPICS_STORAGE_KEY);
    if (stored) {
      return normalizeStoredTopicIds(JSON.parse(stored));
    }
  } catch (err) {
    console.warn("Failed to load followed topics from storage:", err);
  }
  return [];
};

export const saveStoredFollowedTopics = (topicIds: string[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(topicIds));
    window.dispatchEvent(new CustomEvent(TOPICS_UPDATED_EVENT, { detail: topicIds }));
  } catch (err) {
    console.warn("Failed to save followed topics to storage:", err);
  }
};

export const useFollowedTopics = () => {
  const [followedTopicIds, setFollowedTopicIds] = useState<string[]>(() => getStoredFollowedTopics());

  // Listen to cross-component and cross-tab storage changes
  useEffect(() => {
    const handleTopicsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<string[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setFollowedTopicIds(customEvent.detail);
      } else {
        setFollowedTopicIds(getStoredFollowedTopics());
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TOPICS_STORAGE_KEY) {
        setFollowedTopicIds(getStoredFollowedTopics());
      }
    };

    window.addEventListener(TOPICS_UPDATED_EVENT, handleTopicsUpdated);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(TOPICS_UPDATED_EVENT, handleTopicsUpdated);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const toggleFollow = useCallback((topicId: string) => {
    setFollowedTopicIds((prev) => {
      const isAlreadyFollowed = prev.includes(topicId);
      const next = isAlreadyFollowed ? prev.filter((id) => id !== topicId) : [...prev, topicId];
      saveStoredFollowedTopics(next);
      return next;
    });
  }, []);

  const isFollowed = useCallback(
    (topicId: string): boolean => {
      return followedTopicIds.includes(topicId);
    },
    [followedTopicIds]
  );

  const followTopic = useCallback((topicId: string) => {
    setFollowedTopicIds((prev) => {
      if (prev.includes(topicId)) return prev;
      const next = [...prev, topicId];
      saveStoredFollowedTopics(next);
      return next;
    });
  }, []);

  const unfollowTopic = useCallback((topicId: string) => {
    setFollowedTopicIds((prev) => {
      if (!prev.includes(topicId)) return prev;
      const next = prev.filter((id) => id !== topicId);
      saveStoredFollowedTopics(next);
      return next;
    });
  }, []);

  return {
    followedTopicIds,
    toggleFollow,
    isFollowed,
    followTopic,
    unfollowTopic,
    setFollowedTopics: (ids: string[]) => {
      setFollowedTopicIds(ids);
      saveStoredFollowedTopics(ids);
    },
  };
};
