import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import { FileText, ArrowUp, ArrowRight, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { getFileExt } from '../printUtils';

// PDF Worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;

// Helper to parse page range
function countPagesInRangeLocal(rangeStr, maxPages) {
    if (!rangeStr || rangeStr === 'all') return maxPages;
    try {
        const pages = new Set();
        const parts = rangeStr.split(',');
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
                const [s, e] = trimmed.split('-');
                const start = Math.max(1, parseInt(s) || 1);
                const end = Math.min(maxPages, parseInt(e) || maxPages);
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

export function PrintSettingsView({ file, pages, pricing, printSettings, updatePrintSettings, onProceed }) {
    const canvasRef = useRef(null);
    const pdfDocRef = useRef(null);   // cached parsed PDF — avoids re-parsing on every page turn
    const renderTaskRef = useRef(null); // track in-flight render so we can cancel it
    const [currentPage, setCurrentPage] = useState(1);
    const [isRendering, setIsRendering] = useState(false);
    const totalPages = pages || 1;
    const [customRange, setCustomRange] = useState('');
    const [rangeError, setRangeError] = useState(false);

    const ext = file ? getFileExt(file.name) : '';
    const isPdf = ext === 'pdf';
    const isImage = ['jpg', 'jpeg', 'png'].includes(ext);

    const { colorMode = 'bw', orientation = 'portrait', copies = 1, pageRange = 'all', scaling = 'fit' } = printSettings || {};
    const pricePerPage = colorMode === 'color' ? 10 : 3;
    const effectivePages = pageRange === 'all' ? (pages || 1) : countPagesInRangeLocal(customRange || pageRange, pages || 1);
    const totalPrice = effectivePages * copies * pricePerPage;

    // Parse PDF once and cache it
    useEffect(() => {
        if (!isPdf || !file) return;
        pdfDocRef.current = null;
        setCurrentPage(1);
        (async () => {
            try {
                const data = await file.arrayBuffer();
                pdfDocRef.current = await pdfjsLib.getDocument({ data }).promise;
            } catch (err) {
                console.error('PDF load error:', err);
            }
        })();
    }, [file, isPdf]);

    // Render the current page whenever page or orientation changes
    useEffect(() => {
        if (!isPdf || !canvasRef.current) return;

        const renderPage = async () => {
            // Cancel any previous in-flight render
            if (renderTaskRef.current) {
                try { renderTaskRef.current.cancel(); } catch {}
                renderTaskRef.current = null;
            }

            // Wait up to 2s for the PDF to parse if it's not ready yet
            let pdf = pdfDocRef.current;
            if (!pdf) {
                for (let i = 0; i < 20; i++) {
                    await new Promise(r => setTimeout(r, 100));
                    pdf = pdfDocRef.current;
                    if (pdf) break;
                }
            }
            if (!pdf) return;

            const canvas = canvasRef.current;
            if (!canvas) return;

            setIsRendering(true);
            try {
                const pageNum = Math.min(currentPage, pdf.numPages);
                const page = await pdf.getPage(pageNum);

                const containerWidth = canvas.parentElement?.offsetWidth || 280;
                const naturalViewport = page.getViewport({ scale: 1.0 });
                const scale = containerWidth / naturalViewport.width;
                const viewport = page.getViewport({ scale });

                const ctx = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                const task = page.render({ canvasContext: ctx, viewport });
                renderTaskRef.current = task;
                await task.promise;
                renderTaskRef.current = null;
            } catch (err) {
                if (err?.name !== 'RenderingCancelledException') {
                    console.error('PDF render error:', err);
                }
            } finally {
                setIsRendering(false);
            }
        };

        renderPage();
    }, [isPdf, currentPage, orientation]); // re-render when page or orientation changes

    // Looping navigation helpers
    const goPrev = useCallback(() => {
        setCurrentPage(p => p <= 1 ? totalPages : p - 1);
    }, [totalPages]);

    const goNext = useCallback(() => {
        setCurrentPage(p => p >= totalPages ? 1 : p + 1);
    }, [totalPages]);


    // Image preview URL
    const [imgUrl, setImgUrl] = useState(null);
    useEffect(() => {
        if (!isImage || !file) return;
        const url = URL.createObjectURL(file);
        setImgUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file, isImage]);

    // Handle custom range changes
    const handleRangeInput = useCallback((val) => {
        setCustomRange(val);
        const valid = /^[\d,\- ]+$/.test(val) || val === '';
        setRangeError(!valid && val !== '');
        if (valid && val.trim()) {
            updatePrintSettings({ pageRange: val.trim() });
        }
    }, [updatePrintSettings]);

    const ToggleBtn = ({ active, onClick, children, className = '' }) => (
        <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            className={`flex-1 py-2.5 px-3 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                active
                    ? 'bg-white text-black shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.06]'
            } ${className}`}
        >
            {children}
        </motion.button>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            {/* ─── Preview Section ─── */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Live Preview</span>
                <div className="bg-[#111] rounded-xl p-4 mt-3">
                    {/* Paper + Nav row */}
                    <div className="flex items-center gap-2">
                        {/* Left Nav Button */}
                        {isPdf && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={goPrev}
                                className="shrink-0 w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.12] transition-all"
                                aria-label="Previous page"
                            >
                                <ChevronLeft className="w-4 h-4 text-white" />
                            </motion.button>
                        )}

                        {/* A4 Paper — stable, not remounted */}
                        <div className="flex-1 flex justify-center">
                            <div
                                className="relative shadow-2xl shadow-black/40 rounded-sm overflow-hidden bg-white"
                                style={{
                                    width: orientation === 'landscape' ? '100%' : '70%',
                                    // True A4 aspect ratio: 210:297 portrait, 297:210 landscape
                                    aspectRatio: orientation === 'portrait' ? '210 / 297' : '297 / 210',
                                }}
                            >
                                <div
                                    className="absolute inset-0 flex items-center justify-center"
                                    style={colorMode === 'bw' ? { filter: 'grayscale(1)' } : {}}
                                >
                                    {isPdf ? (
                                        <>
                                            <canvas
                                                ref={canvasRef}
                                                className="w-full h-full object-contain"
                                            />
                                            {isRendering && (
                                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </>
                                    ) : isImage ? (
                                        imgUrl && <img src={imgUrl} className="w-full h-full object-contain" alt="Preview" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-center p-4">
                                            <FileText className="w-10 h-10 text-muted-foreground mb-2" />
                                            <p className="text-xs text-muted-foreground">Preview not available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Nav Button */}
                        {isPdf && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={goNext}
                                className="shrink-0 w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.12] transition-all"
                                aria-label="Next page"
                            >
                                <ChevronRight className="w-4 h-4 text-white" />
                            </motion.button>
                        )}
                    </div>

                    {/* Page indicator */}
                    {isPdf && (
                        <div className="flex items-center justify-center gap-3 mt-3">
                            <button onClick={goPrev} className="text-muted-foreground hover:text-foreground transition-colors text-base leading-none">
                                ‹
                            </button>
                            <span className="bg-white/[0.05] px-3 py-1 rounded-full text-[11px] text-muted-foreground tabular-nums">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button onClick={goNext} className="text-muted-foreground hover:text-foreground transition-colors text-base leading-none">
                                ›
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Settings ─── */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 space-y-5">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Print Settings</span>

                {/* Color Mode */}
                <div className="pb-5 border-b border-white/[0.04]">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-[13px] text-muted-foreground font-medium shrink-0">Color Mode</span>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 flex gap-1 flex-1 max-w-[200px] ml-auto">
                            <ToggleBtn active={colorMode === 'bw'} onClick={() => updatePrintSettings({ colorMode: 'bw' })}>
                                B&W · ₹3/pg
                            </ToggleBtn>
                            <ToggleBtn active={colorMode === 'color'} onClick={() => updatePrintSettings({ colorMode: 'color' })}>
                                Color · ₹10/pg
                            </ToggleBtn>
                        </div>
                    </div>
                </div>

                {/* Orientation */}
                <div className="pb-5 border-b border-white/[0.04]">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-[13px] text-muted-foreground font-medium shrink-0">Orientation</span>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 flex gap-1 flex-1 max-w-[200px] ml-auto">
                            <ToggleBtn active={orientation === 'portrait'} onClick={() => updatePrintSettings({ orientation: 'portrait' })}>
                                <ArrowUp className="w-3 h-3 inline mr-1" />Portrait
                            </ToggleBtn>
                            <ToggleBtn active={orientation === 'landscape'} onClick={() => updatePrintSettings({ orientation: 'landscape' })}>
                                <ArrowRight className="w-3 h-3 inline mr-1" />Landscape
                            </ToggleBtn>
                        </div>
                    </div>
                </div>

                {/* Copies */}
                <div className="pb-5 border-b border-white/[0.04]">
                    <div className="flex items-center justify-between">
                        <span className="text-[13px] text-muted-foreground font-medium">Copies</span>
                        <div className="flex items-center gap-3">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => updatePrintSettings({ copies: Math.max(1, copies - 1) })}
                                disabled={copies <= 1}
                                className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] flex items-center justify-center disabled:opacity-30 transition-all"
                            >
                                <Minus className="w-4 h-4 text-foreground" />
                            </motion.button>
                            <span className="text-xl font-bold text-foreground w-8 text-center tabular-nums">{copies}</span>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => updatePrintSettings({ copies: Math.min(20, copies + 1) })}
                                disabled={copies >= 20}
                                className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] flex items-center justify-center disabled:opacity-30 transition-all"
                            >
                                <Plus className="w-4 h-4 text-foreground" />
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* Page Range */}
                <div className="pb-5 border-b border-white/[0.04]">
                    <div className="flex items-center justify-between gap-4 mb-3">
                        <span className="text-[13px] text-muted-foreground font-medium shrink-0">Page Range</span>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 flex gap-1 flex-1 max-w-[200px] ml-auto">
                            <ToggleBtn active={pageRange === 'all'} onClick={() => { updatePrintSettings({ pageRange: 'all' }); setCustomRange(''); setRangeError(false); }}>
                                All pages
                            </ToggleBtn>
                            <ToggleBtn active={pageRange !== 'all'} onClick={() => { updatePrintSettings({ pageRange: customRange || '1' }); }}>
                                Custom
                            </ToggleBtn>
                        </div>
                    </div>
                    {pageRange !== 'all' && (
                        <div className="space-y-1.5">
                            <input
                                type="text"
                                value={customRange}
                                onChange={(e) => handleRangeInput(e.target.value)}
                                placeholder="e.g. 1-3 or 1,3,5"
                                className={`w-full px-4 py-3 bg-white/[0.03] border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 text-sm transition-all ${
                                    rangeError
                                        ? 'border-red-500/40 focus:ring-red-500/20'
                                        : 'border-white/[0.08] focus:ring-white/20 focus:border-white/15'
                                }`}
                            />
                            {!rangeError && customRange && (
                                <p className="text-[11px] text-muted-foreground/70">{effectivePages} page{effectivePages !== 1 ? 's' : ''} selected</p>
                            )}
                            {rangeError && (
                                <p className="text-xs text-red-400">Invalid format. Use numbers, commas, and dashes.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Scaling */}
                <div>
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-[13px] text-muted-foreground font-medium shrink-0">Scaling</span>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 flex gap-1 flex-1 max-w-[200px] ml-auto">
                            <ToggleBtn active={scaling === 'fit'} onClick={() => updatePrintSettings({ scaling: 'fit' })}>
                                Fit to page
                            </ToggleBtn>
                            <ToggleBtn active={scaling === 'actual'} onClick={() => updatePrintSettings({ scaling: 'actual' })}>
                                Actual size
                            </ToggleBtn>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Order Summary ─── */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">Order Summary</span>
                </div>
                <div className="space-y-2 text-[13px] text-muted-foreground">
                    <div className="flex justify-between">
                        <span>{effectivePages} page{effectivePages !== 1 ? 's' : ''} × ₹{pricePerPage}</span>
                        <span className="text-foreground">₹{effectivePages * pricePerPage}</span>
                    </div>
                    {copies > 1 && (
                        <div className="flex justify-between">
                            <span>× {copies} copies</span>
                            <span className="text-foreground">₹{totalPrice}</span>
                        </div>
                    )}
                    {colorMode === 'color' && (
                        <p className="text-[11px] text-amber-400/70">Color printing selected</p>
                    )}
                </div>
                <div className="border-t border-white/[0.06] mt-3 pt-3 flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">Total</span>
                    <span className="text-2xl font-bold text-foreground">₹{totalPrice}</span>
                </div>
            </div>

            {/* ─── CTA ─── */}
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={onProceed}
                disabled={rangeError}
                className="w-full bg-white text-black hover:bg-neutral-200 py-4 rounded-xl font-semibold text-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                Continue to Payment →
            </motion.button>
        </motion.div>
    );
}
