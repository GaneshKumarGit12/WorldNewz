import { useState, useEffect } from "react";

/**
 * Reusable A/B Testing Hook
 * Bucketizes users into variants, ensures sticky assignment via localStorage,
 * and automatically logs the event to Google Analytics.
 *
 * @param testName Unique identifier for the test (e.g. 'cta_color_test')
 * @param variants Array of variant identifiers (default is ['A', 'B'])
 */
export const useABTest = (testName: string, variants: string[] = ["A", "B"]) => {
  const [variant, setVariant] = useState<string>("");

  useEffect(() => {
    const storageKey = `worldnewz_ab_${testName}`;
    let assigned = localStorage.getItem(storageKey);

    if (!assigned || !variants.includes(assigned)) {
      const randomIndex = Math.floor(Math.random() * variants.length);
      assigned = variants[randomIndex];
      localStorage.setItem(storageKey, assigned);
    }

    setVariant(assigned);

    // Log the assignment to Google Analytics
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "ab_test_assignment", {
        test_name: testName,
        variant_assigned: assigned,
        non_interaction: true // Does not count toward bounce rate
      });
    }
  }, [testName, variants]);

  return variant;
};
