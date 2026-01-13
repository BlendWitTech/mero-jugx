import React from 'react';

export default function DashboardPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Creator Dashboard</h1>
            <p>Welcome to your Creator Portal.</p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-2">My Content</h2>
                    <p className="text-gray-500">Manage your digital assets and posts.</p>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-2">Earnings</h2>
                    <p className="text-gray-500">Track your monetization.</p>
                </div>
            </div>
        </div>
    );
}
