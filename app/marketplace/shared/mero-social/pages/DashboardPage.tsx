import React from 'react';

export default function DashboardPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Mero Social Dashboard</h1>
            <p>Welcome to your Social Media Management Hub.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="p-4 bg-white rounded-lg shadow">
                    <h2 className="font-semibold mb-2">Unified Inbox</h2>
                    <p className="text-sm text-gray-600">Manage messages from all platforms</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                    <h2 className="font-semibold mb-2">Content Calendar</h2>
                    <p className="text-sm text-gray-600">Schedule your posts</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                    <h2 className="font-semibold mb-2">Analytics</h2>
                    <p className="text-sm text-gray-600">Track your growth</p>
                </div>
            </div>
        </div>
    );
}
