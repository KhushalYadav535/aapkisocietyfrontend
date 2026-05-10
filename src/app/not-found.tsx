"use client";

import Link from "next/link";
import { Building2, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh px-4">
      <div className="text-center max-w-md mx-auto">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <div className="text-[120px] sm:text-[150px] font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-600 leading-none">
            404
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-3 bg-gray-200 dark:bg-slate-700 rounded-full blur-lg" />
        </div>

        {/* Content */}
        <div className="space-y-4 animate-slide-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Page Not Found
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-all"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
          </div>
        </div>

        {/* Decorative building */}
        <div className="mt-12 opacity-20">
          <Building2 className="w-16 h-16 mx-auto text-indigo-600" />
        </div>
      </div>
    </div>
  );
}