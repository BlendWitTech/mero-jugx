import React, { useEffect, useState } from 'react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Link } from 'react-router-dom';
import { Users, FileText, CreditCard, DollarSign, TrendingUp, Plus, Activity } from 'lucide-react';
import { Card } from '@shared';

import { useAppContext } from '../contexts/AppContext';

interface DashboardStats {
    totalClients: number;
    totalInvoices: number;
    totalPayments: number;
    totalRevenue: number;
}

export default function DashboardPage() {
    const { theme } = useTheme();
    const { buildHref } = useAppContext();
    const [stats, setStats] = useState<DashboardStats>({
        totalClients: 0,
        totalInvoices: 0,
        totalPayments: 0,
        totalRevenue: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // ... same mock data logic ...
        setTimeout(() => {
            setStats({
                totalClients: 24,
                totalInvoices: 156,
                totalPayments: 89,
                totalRevenue: 45678.50,
            });
            setLoading(false);
        }, 500);
    }, []);

    const statCards = [
        {
            title: 'Total Clients',
            value: stats.totalClients,
            icon: Users,
            color: theme.colors.primary,
            link: buildHref('/clients'),
        },
        {
            title: 'Total Invoices',
            value: stats.totalInvoices,
            icon: FileText,
            color: '#10b981',
            link: buildHref('/invoices'),
        },
        {
            title: 'Total Payments',
            value: stats.totalPayments,
            icon: CreditCard,
            color: '#f59e0b',
            link: buildHref('/payments'),
        },
        {
            title: 'Total Revenue',
            value: `$${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: DollarSign,
            color: '#8b5cf6',
            link: buildHref('/'),
        },
    ];

    const quickActions = [
        { title: 'New Client', icon: Users, link: buildHref('/clients/new'), color: theme.colors.primary },
        { title: 'New Invoice', icon: FileText, link: buildHref('/invoices/new'), color: '#10b981' },
        { title: 'New Payment', icon: CreditCard, link: buildHref('/payments/new'), color: '#f59e0b' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: theme.colors.primary }}></div>
                    <p style={{ color: theme.colors.textSecondary }}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2" style={{ color: theme.colors.text }}>
                        CRM Overview
                    </h1>
                    <p className="text-lg opacity-80" style={{ color: theme.colors.textSecondary }}>
                        Welcome back to Mero CRM. Here's what's happening today.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider"
                        style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}>
                        Live Updates
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Link key={stat.title} to={stat.link}
                            className="block transform transition-all duration-300 hover:-translate-y-2"
                            style={{ animationDelay: `${index * 100}ms` }}>
                            <Card
                                className="p-6 relative overflow-hidden backdrop-blur-sm border shadow-sm group"
                                style={{
                                    backgroundColor: `${theme.colors.surface}80`,
                                    borderColor: theme.colors.border,
                                    borderRadius: '20px'
                                }}
                            >
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div
                                            className="p-4 rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg"
                                            style={{
                                                backgroundColor: `${stat.color}15`,
                                                boxShadow: `0 8px 16px -4px ${stat.color}40`
                                            }}
                                        >
                                            <Icon className="h-7 w-7" style={{ color: stat.color }} />
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <TrendingUp className="h-5 w-5 opacity-40" style={{ color: stat.color }} />
                                            <span className="text-[10px] font-bold uppercase mt-1 opacity-40">Growth</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold uppercase tracking-wider opacity-60 mb-2" style={{ color: theme.colors.text }}>
                                            {stat.title}
                                        </h3>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-3xl font-black" style={{ color: theme.colors.text }}>
                                                {stat.value}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {/* Decorative background element */}
                                <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity duration-500"
                                    style={{ backgroundColor: stat.color }}></div>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {/* Quick Actions & Recent Activity Container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Actions */}
                <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-2xl font-bold px-1" style={{ color: theme.colors.text }}>
                        Quick Actions
                    </h2>
                    <div className="flex flex-col gap-4">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Link key={action.title} to={action.link} className="group">
                                    <Card
                                        className="p-5 flex items-center justify-between transition-all duration-300 hover:shadow-xl border"
                                        style={{
                                            backgroundColor: theme.colors.surface,
                                            borderColor: theme.colors.border,
                                            borderRadius: '16px'
                                        }}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div
                                                className="p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300"
                                                style={{ backgroundColor: `${action.color}15` }}
                                            >
                                                <Icon className="h-6 w-6" style={{ color: action.color }} />
                                            </div>
                                            <span className="text-lg font-bold" style={{ color: theme.colors.text }}>
                                                {action.title}
                                            </span>
                                        </div>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{ backgroundColor: `${action.color}15` }}>
                                            <Plus className="h-5 w-5" style={{ color: action.color }} />
                                        </div>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-bold px-1" style={{ color: theme.colors.text }}>
                        Recent Activity
                    </h2>
                    <Card
                        className="h-[calc(100%-48px)] flex flex-col items-center justify-center min-h-[300px] border relative overflow-hidden"
                        style={{
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                            borderRadius: '24px'
                        }}
                    >
                        {/* Decorative background grid/dots could go here */}
                        <div className="relative z-10 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                                <Activity className="h-8 w-8 opacity-20" style={{ color: theme.colors.textSecondary }} />
                            </div>
                            <p className="text-xl font-medium opacity-40 max-w-[280px] mx-auto">
                                Monitoring your stream...
                                <br />
                                Recent activity will appear here shortly.
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
