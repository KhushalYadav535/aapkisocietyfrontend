"use client";

import { Download, FileText, Users, Home, Settings, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ExportDataPage() {
  const handleExport = (module: string) => {
    // In a real implementation, this would trigger an API call to generate a CSV/Excel
    toast.success(`${module} data export started. It will download shortly.`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Download className="w-6 h-6 text-indigo-500" /> 
            Export Data
          </h1>
          <p className="text-gray-500 text-sm mt-1">Download your society data for offline backups or reporting</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Members Export */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4 hover:border-indigo-100 transition-colors">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Members & Residents</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">Export a complete list of all registered members, their flat details, and contact info.</p>
            <button onClick={() => handleExport("Members")} className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Complaints Export */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4 hover:border-indigo-100 transition-colors">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Complaints & Tickets</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">Download all complaint logs, statuses, and resolutions for auditing purposes.</p>
            <button onClick={() => handleExport("Complaints")} className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-lg w-fit">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Billing Export */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4 hover:border-indigo-100 transition-colors">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Billing & Invoices</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">Export financial records, generated bills, and payment histories.</p>
            <button onClick={() => handleExport("Billing")} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
              <Download className="w-4 h-4" /> Export Excel
            </button>
          </div>
        </div>

        {/* Properties Export */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4 hover:border-indigo-100 transition-colors">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <Home className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Flats & Inventory</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">Download the structure of your society, including all wings and flat numbers.</p>
            <button onClick={() => handleExport("Properties")} className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1.5 bg-purple-50 px-3 py-1.5 rounded-lg w-fit">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
