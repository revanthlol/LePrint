// frontend/src/components/Admin/MetricsGrid.jsx
// Redesigned Hero Stat Cards with colorful accents on a monochrome base

import React from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, FileText, CheckCircle, XCircle, TrendingUp, ArrowUpRight } from 'lucide-react';

export function MetricsGrid({ metrics, loading }) {
    const stats = [
        {
            label: 'Total Revenue',
            value: `₹${metrics?.overall?.totalRevenue?.toLocaleString() || 0}`,
            subtext: metrics?.today?.revenue 
                ? `+₹${metrics.today.revenue.toLocaleString()} today` 
                : null,
            icon: IndianRupee,
            color: 'text-emerald-400',
            glowColor: 'bg-emerald-500/20',
            borderColor: 'border-l-emerald-500/50',
            iconBg: 'bg-emerald-500/10 border-emerald-500/15',
        },
        {
            label: 'Pages Printed',
            value: metrics?.overall?.totalPages?.toLocaleString() || 0,
            subtext: metrics?.today?.pages 
                ? `+${metrics.today.pages.toLocaleString()} today` 
                : null,
            icon: FileText,
            color: 'text-blue-400',
            glowColor: 'bg-blue-500/20',
            borderColor: 'border-l-blue-500/50',
            iconBg: 'bg-blue-500/10 border-blue-500/15',
        },
        {
            label: 'Success Rate',
            value: `${metrics?.overall?.successRate?.toFixed(1) || 0}%`,
            subtext: `${metrics?.overall?.completedJobs || 0} completed`,
            icon: CheckCircle,
            color: 'text-green-400',
            glowColor: 'bg-green-500/25',
            borderColor: 'border-l-green-500/50',
            iconBg: 'bg-green-500/10 border-green-500/15',
        },
        {
            label: 'Failed Jobs',
            value: metrics?.overall?.failedJobs || 0,
            subtext: `${((metrics?.overall?.failedJobs / metrics?.overall?.totalJobs * 100) || 0).toFixed(1)}% failure rate`,
            icon: XCircle,
            color: 'text-red-400',
            glowColor: 'bg-red-500/25',
            borderColor: 'border-l-red-500/50',
            iconBg: 'bg-red-500/10 border-red-500/15',
        }
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-0">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/[0.08] rounded-[2rem] p-8 h-44 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-0">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1, ease: [0.23, 1, 0.32, 1] }}
                        className={`relative group bg-white/[0.03] backdrop-blur-2xl border border-white/[0.1] rounded-[2rem] p-8 overflow-hidden hover:bg-white/[0.06] transition-all duration-700 shadow-2xl hover:shadow-black/50`}
                    >
                        {/* Status Edge */}
                        <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${stat.borderColor.replace('border-l-', 'bg-')} opacity-40`} />

                        {/* Hover Glow */}
                        <div className={`absolute -right-[15%] -bottom-[15%] w-[50%] h-[50%] ${stat.glowColor} blur-[60px] rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-1000`} />

                        <div className="relative z-10">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-8">
                                <div className="space-y-1">
                                    <h4 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40 font-black">{stat.label}</h4>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20" />
                                        <span className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest">Realtime</span>
                                    </div>
                                </div>
                                <div className={`w-12 h-12 rounded-[1.2rem] ${stat.iconBg} border border-white/[0.05] flex items-center justify-center transition-all duration-700 group-hover:rotate-[360deg] shadow-lg`}>
                                    <Icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                            </div>

                            {/* Value Row */}
                            <div className="flex items-end justify-between">
                                <div className="space-y-1">
                                    <p className="text-4xl font-black text-white tabular-nums tracking-tighter leading-none">{stat.value}</p>
                                    {stat.subtext && (
                                        <div className="flex items-center gap-2 pt-2">
                                            {stat.subtext.startsWith('+') ? (
                                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                                    <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                                                    <span className="text-[11px] font-bold text-emerald-400 tabular-nums">
                                                        {stat.subtext.split(' ')[0]}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-wider tabular-nums">
                                                    {stat.subtext}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}