import { useState, useEffect, useCallback } from "react";

const useInfiniteScroll = (callback) => {
  const [isFetching, setIsFetching] = useState(false);

  const handleScroll = useCallback(() => {
    // Check if user scrolled to bottom (with 100px buffer)
    if (
      window.innerHeight + document.documentElement.scrollTop 
      >= document.documentElement.offsetHeight - 100
    ) {
      setIsFetching(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!isFetching) return;
    const executeCallback = async () => {
      try {
        await callback();
      } finally {
        setIsFetching(false);
      }
    };
    executeCallback();
  }, [isFetching, callback]);

  return [isFetching];
};

export default useInfiniteScroll;
