"use client";

import { useState } from "react";
import { Download, FileText, Users, Home, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { memberAPI, complaintAPI, billingAPI, societyAPI, exportAPI } from "@/lib/api";

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

function exportToCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) {
    toast.error("No data available to export");
    return;
  }
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((fieldName) => {
          const val = row[fieldName] !== null && row[fieldName] !== undefined ? String(row[fieldName]) : "";
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
  toast.success(`Exported ${rows.length} rows successfully`);
}

export default function ExportDataPage() {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (module: string) => {
    try {
      setExporting(module);
      const timestamp = new Date().toISOString().split("T")[0];

      if (module === "Members") {
        const res = await memberAPI.getAll({ limit: 1000 });
        const members = res.data.members || res.data || [];
        if (!members.length) {
          toast.error("No member records found to export");
          return;
        }
        const data = members.map((m: any) => ({
          Name: `${m.first_name || ""} ${m.last_name || ""}`.trim(),
          Email: m.email || "",
          Phone: m.phone || "",
          Role: m.role || "",
          Wing: m.wing || "",
          Flat: m.flat_number || "",
          Status: m.is_active === 0 ? "Inactive" : "Active",
          CreatedAt: m.created_at || "",
        }));
        exportToCsv(`members_export_${timestamp}.csv`, data);
      } else if (module === "Complaints") {
        const res = await complaintAPI.getAll();
        const complaints = res.data.complaints || res.data || [];
        if (!complaints.length) {
          toast.error("No complaint records found to export");
          return;
        }
        const data = complaints.map((c: any) => ({
          TicketID: c.ticket_number || c.id || "",
          Title: c.title || "",
          Category: c.category || "",
          Priority: c.priority || "",
          Status: c.status || "",
          CreatedBy: c.created_by_name || c.user_name || "",
          CreatedAt: c.created_at || "",
        }));
        exportToCsv(`complaints_export_${timestamp}.csv`, data);
      } else if (module === "Billing") {
        const res = await billingAPI.getAllBills({ limit: 1000 });
        const bills = res.data.bills || res.data || [];
        if (!bills.length) {
          toast.error("No billing records found to export");
          return;
        }
        const data = bills.map((b: any) => ({
          BillNumber: b.bill_number || "",
          BillingPeriod: b.billing_period || "",
          FlatNumber: b.flat_number || "",
          MemberName: b.member_name || "",
          DueDate: b.due_date ? String(b.due_date).split("T")[0] : "",
          TotalAmount: Number(b.total_amount || 0),
          Status: b.status || "",
        }));
        try {
          const excelRes = await exportAPI.excelExport({ report_type: "Billing_Register", data });
          const blob = new Blob([excelRes.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
          downloadBlob(blob, `billing_export_${timestamp}.xlsx`);
          toast.success(`Exported ${data.length} billing records to Excel`);
        } catch {
          exportToCsv(`billing_export_${timestamp}.csv`, data);
        }
      } else if (module === "Properties") {
        const res = await societyAPI.getFlats();
        const flats = res.data.flats || res.data || [];
        if (!flats.length) {
          toast.error("No flat records found to export");
          return;
        }
        const data = flats.map((f: any) => ({
          Wing: f.wing || "",
          FlatNumber: f.flat_number || "",
          FloorNumber: f.floor_number || "",
          SquareFeet: f.square_feet || "",
          OccupancyStatus: f.occupancy_status || "VACANT",
          FlatType: f.flat_type || "2BHK",
        }));
        exportToCsv(`properties_export_${timestamp}.csv`, data);
      }
    } catch (err: any) {
      console.error(`Export failed for ${module}:`, err);
      toast.error(err.response?.data?.error || `Failed to export ${module} data`);
    } finally {
      setExporting(null);
    }
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
            <button
              onClick={() => handleExport("Members")}
              disabled={exporting === "Members"}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg w-fit disabled:opacity-50"
            >
              {exporting === "Members" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export CSV
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
            <button
              onClick={() => handleExport("Complaints")}
              disabled={exporting === "Complaints"}
              className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-lg w-fit disabled:opacity-50"
            >
              {exporting === "Complaints" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export CSV
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
            <button
              onClick={() => handleExport("Billing")}
              disabled={exporting === "Billing"}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit disabled:opacity-50"
            >
              {exporting === "Billing" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export Excel
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
            <button
              onClick={() => handleExport("Properties")}
              disabled={exporting === "Properties"}
              className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1.5 bg-purple-50 px-3 py-1.5 rounded-lg w-fit disabled:opacity-50"
            >
              {exporting === "Properties" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
