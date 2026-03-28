import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // If there's a hash, we let the internal component handling it do its job.
    // Otherwise, we scroll to the top of the page.
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}
