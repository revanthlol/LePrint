// Parse a page range string like "1-3" or "1,3,5" into a count
export function countPagesInRange(rangeStr, maxPages) {
    if (!rangeStr || rangeStr === 'all') return maxPages;
    try {
        const pages = new Set();
        const parts = rangeStr.split(',');
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
                const [startStr, endStr] = trimmed.split('-');
                const start = Math.max(1, parseInt(startStr) || 1);
                const end = Math.min(maxPages, parseInt(endStr) || maxPages);
                for (let i = start; i <= end; i++) pages.add(i);
            } else {
                const p = parseInt(trimmed);
                if (p >= 1 && p <= maxPages) pages.add(p);
            }
        }
        return Math.max(1, pages.size);
    } catch {
        return maxPages;
    }
}

// Recalculate pricing based on print settings
export function recalcPricing(job) {
    if (!job?.printSettings || !job?.pages) return job?.pricing;
    const effectivePages = job.printSettings.pageRange === 'all'
        ? job.pages
        : countPagesInRange(job.printSettings.pageRange, job.pages);
    const pricePerPage = job.printSettings.colorMode === 'color' ? 10 : 3;
    const totalPrice = effectivePages * (job.printSettings.copies || 1) * pricePerPage;
    return { ...job.pricing, totalPrice, effectivePages, pricePerPage };
}
