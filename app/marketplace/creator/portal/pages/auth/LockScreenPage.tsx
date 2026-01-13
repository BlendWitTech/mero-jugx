import React from 'react';
import { Link } from 'react-router-dom';

export default function LockScreenPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
            <div className="max-w-sm w-full bg-white p-8 rounded-xl shadow-2xl text-center">
                <div className="mb-6">
                    <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-gray-500">
                        JD
                    </div>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome Back</h2>
                <p className="text-sm text-gray-500 mb-6">Enter your password to unlock</p>

                <form className="space-y-4">
                    <input type="password" placeholder="Password" className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />

                    <button type="submit" className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
                        Unlock
                    </button>
                </form>

                <div className="mt-4">
                    <Link to="/creator/login" className="text-sm text-gray-500 hover:text-gray-800">Switch Account</Link>
                </div>
            </div>
        </div>
    );
}
