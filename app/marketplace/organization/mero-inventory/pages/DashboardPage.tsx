import React, { useState, useEffect } from 'react';
import { useTheme } from '@frontend/contexts/ThemeContext';
import { Link } from 'react-router-dom';
import { Package, Warehouse, TrendingUp, AlertTriangle, DollarSign, Plus, Activity, ShoppingCart } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useQuery } from '@tanstack/react-query';
import api from '@frontend/services/api';
import { useAuthStore } from '@frontend/store/authStore';

interface DashboardStats {
    totalProducts: number;
    totalWarehouses: number;
    lowStockItems: number;
    totalStockValue: number;
}

export default function DashboardPage() {
    const { theme } = useTheme();
    const { buildHref } = useAppContext();
    const { organization } = useAuthStore();
    const { data: dashboardData, isLoading: loading } = useQuery({
        queryKey: ['inventory', 'dashboard', organization?.id],
        queryFn: async () => {
            const response = await api.get(`/inventory/reports/dashboard`);
            return response.data;
        },
        enabled: !!organization?.id,
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    const { data: recentMovements = [] } = useQuery({
        queryKey: ['inventory', 'recent-movements', organization?.id],
        queryFn: async () => {
            const response = await api.get(`/inventory/reports/stock-movements?limit=5`);
            return response.data;
        },
        enabled: !!organization?.id,
    });


    const stats: DashboardStats = {
        totalProducts: dashboardData?.totalProducts || 0,
        totalWarehouses: dashboardData?.totalWarehouses || 0,
        lowStockItems: dashboardData?.lowStockItems || 0,
        totalStockValue: dashboardData?.totalStockValue || 0,
    };

    const statCards = [
        {
            title: 'Total Products',
            value: stats.totalProducts,
            icon: Package,
            color: theme.colors.primary,
            link: buildHref('/products'),
        },
        {
            title: 'Total Warehouses',
            value: stats.totalWarehouses,
            icon: Warehouse,
            color: '#10b981',
            link: buildHref('/warehouses'),
        },
        {
            title: 'Low Stock Items',
            value: stats.lowStockItems,
            icon: AlertTriangle,
            color: '#ef4444', // Red for alert
            link: buildHref('/products?filter=low_stock'),
        },
        {
            title: 'Stock Value',
            value: `$${stats.totalStockValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: DollarSign,
            color: '#8b5cf6',
            link: buildHref('/reports/valuation'),
        },
    ];

    const quickActions = [
        { title: 'Add Product', icon: Package, link: buildHref('/products/new'), color: theme.colors.primary },
        { title: 'Add Warehouse', icon: Warehouse, link: buildHref('/warehouses/new'), color: '#10b981' },
        { title: 'Stock Adjustment', icon: ShoppingCart, link: buildHref('/adjustments/new'), color: '#f59e0b' },
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
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary }}>
                        <Package className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: theme.colors.text }}>
                            Inventory Overview
                        </h1>
                        <p className="mt-2 text-sm sm:text-base" style={{ color: theme.colors.textSecondary }}>
                            Manage your products, warehouses, and stock levels.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Link key={stat.title} to={stat.link}
                            className="block"
                            style={{ animationDelay: `${index * 100}ms` }}>
                            <div
                                className="group relative backdrop-blur-sm rounded-xl p-6 transition-all duration-300 shadow-lg overflow-hidden hover:shadow-xl hover:-translate-y-1"
                                style={{
                                    background: `linear-gradient(to bottom right, ${theme.colors.surface}, ${theme.colors.background})`,
                                    border: `1px solid ${theme.colors.border}80`
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = `${stat.color}80`;
                                    e.currentTarget.style.boxShadow = `0 20px 25px -5px ${stat.color}33`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = `${theme.colors.border}80`;
                                    e.currentTarget.style.boxShadow = '';
                                }}
                            >
                                {/* Gradient overlay on hover */}
                                <div className="absolute inset-0 transition-all duration-300"
                                    style={{ background: `linear-gradient(to bottom right, transparent, transparent)` }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = `linear-gradient(to bottom right, ${stat.color}1A, transparent)`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = `linear-gradient(to bottom right, transparent, transparent)`;
                                    }}
                                ></div>

                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div
                                            className="p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300"
                                            style={{ backgroundColor: stat.color }}
                                        >
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-sm font-medium transition-colors" style={{ color: theme.colors.textSecondary }}>{stat.title}</p>
                                            <p className="text-2xl font-bold mt-1" style={{ color: theme.colors.text }}>{stat.value}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <TrendingUp className="h-4 w-4 opacity-40" style={{ color: stat.color }} />
                                    </div>
                                </div>
                            </div>
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
                                    <div
                                        className="p-5 flex items-center justify-between transition-all duration-300 hover:shadow-xl shadow-lg backdrop-blur-sm rounded-xl overflow-hidden hover:-translate-y-1"
                                        style={{
                                            background: `linear-gradient(to bottom right, ${theme.colors.surface}, ${theme.colors.background})`,
                                            border: `1px solid ${theme.colors.border}80`
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = `${action.color}80`;
                                            e.currentTarget.style.boxShadow = `0 10px 15px -3px ${action.color}33`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = `${theme.colors.border}80`;
                                            e.currentTarget.style.boxShadow = '';
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
                                    </div>
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
                    <div
                        className="h-[calc(100%-48px)] flex flex-col min-h-[300px] border relative overflow-hidden backdrop-blur-sm rounded-xl shadow-lg"
                        style={{
                            background: `linear-gradient(to bottom right, ${theme.colors.surface}, ${theme.colors.background})`,
                            border: `1px solid ${theme.colors.border}80`
                        }}
                    >
                        {recentMovements.length > 0 ? (
                            <div className="overflow-y-auto p-4 space-y-3">
                                {recentMovements.map((movement: any) => (
                                    <div key={movement.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${movement.type === 'IN' || movement.type === 'TRANSFER_IN' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                                {movement.type === 'IN' || movement.type === 'TRANSFER_IN' ? <Plus className="h-4 w-4" /> : <TrendingUp className="h-4 w-4 rotate-180" />}
                                            </div>
                                            <div>
                                                <p className="font-medium" style={{ color: theme.colors.text }}>
                                                    {movement.product?.name || 'Unknown Product'}
                                                </p>
                                                <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                                                    {new Date(movement.createdAt).toLocaleDateString()} • {movement.type.replace('_', ' ')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${movement.type === 'IN' || movement.type === 'TRANSFER_IN' ? 'text-green-500' : 'text-red-500'}`}>
                                                {movement.type === 'IN' || movement.type === 'TRANSFER_IN' ? '+' : '-'}{Number(movement.quantity).toLocaleString()}
                                            </p>
                                            <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                                                {movement.warehouse?.name}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: theme.colors.background }}>
                                    <Activity className="h-8 w-8 opacity-40" style={{ color: theme.colors.textSecondary }} />
                                </div>
                                <p className="text-xl font-medium opacity-60 max-w-[280px] mx-auto text-center" style={{ color: theme.colors.text }}>
                                    No recent movements...
                                    <br />
                                    Stock updates will appear here.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
