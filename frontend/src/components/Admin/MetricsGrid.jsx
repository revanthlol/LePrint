// frontend/src/components/Admin/MetricsGrid.jsx
// Redesigned Hero Stat Cards with colorful accents on a monochrome base

import React from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, FileText, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

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
            borderColor: 'border-l-blue-500/50',
            iconBg: 'bg-blue-500/10 border-blue-500/15',
        },
        {
            label: 'Success Rate',
            value: `${metrics?.overall?.successRate?.toFixed(1) || 0}%`,
            subtext: `${metrics?.overall?.completedJobs || 0} completed`,
            icon: CheckCircle,
            color: 'text-green-400',
            borderColor: 'border-l-green-500/50',
            iconBg: 'bg-green-500/10 border-green-500/15',
        },
        {
            label: 'Failed Jobs',
            value: metrics?.overall?.failedJobs || 0,
            subtext: `${((metrics?.overall?.failedJobs / metrics?.overall?.totalJobs * 100) || 0).toFixed(1)}% failure rate`,
            icon: XCircle,
            color: 'text-red-400',
            borderColor: 'border-l-red-500/50',
            iconBg: 'bg-red-500/10 border-red-500/15',
        }
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-0">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                        <div className="animate-pulse">
                            <div className="flex justify-between mb-4">
                                <div className="h-3 bg-white/[0.06] rounded w-24"></div>
                                <div className="w-10 h-10 bg-white/[0.06] rounded-xl"></div>
                            </div>
                            <div className="h-10 bg-white/[0.06] rounded w-32 mb-2"></div>
                            <div className="h-3 bg-white/[0.06] rounded w-40"></div>
                        </div>
                    </div>
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
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] border-l-2 ${stat.borderColor} rounded-2xl p-6 hover:bg-white/[0.05] transition-all duration-300 group`}
                    >
                        {/* Top row: label + icon */}
                        <div className="flex items-start justify-between mb-4">
                            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold">{stat.label}</span>
                            <div className={`w-10 h-10 rounded-xl ${stat.iconBg} border flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                                <Icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                        </div>

                        {/* Value */}
                        <p className="text-4xl font-bold text-foreground tabular-nums tracking-tight mb-2">{stat.value}</p>

                        {/* Subtext */}
                        {stat.subtext && (
                            <div className="flex items-center gap-1.5">
                                {stat.subtext.startsWith('+') && (
                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                )}
                                <span className={`text-[12px] font-medium ${stat.subtext.startsWith('+') ? 'text-emerald-400' : 'text-muted-foreground/70'}`}>
                                    {stat.subtext}
                                </span>
                            </div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}