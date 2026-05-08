"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { billingAPI, complaintAPI, memberAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { ArrowLeft, CreditCard, FileWarning, Receipt, User } from "lucide-react";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  wing?: string;
  flat_number?: string;
  is_active?: number;
}

interface Bill {
  id: string;
  member_id?: string;
  bill_number: string;
  total_amount: number;
  status: string;
  due_date?: string;
  billing_period?: string;
}

interface Payment {
  id: string;
  member_id?: string;
  amount: number;
  payment_method: string;
  payment_reference?: string;
  status: string;
  payment_date: string;
}

interface Complaint {
  id: string;
  raised_by?: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
}

export default function MemberHistoryPage() {
  const params = useParams<{ id: string }>();
  const memberId = params?.id;

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<Member | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [activeTab, setActiveTab] = useState<"BILLS" | "PAYMENTS" | "COMPLAINTS">("BILLS");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (!memberId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [mRes, bRes, pRes, cRes] = await Promise.all([
          memberAPI.getById(memberId),
          billingAPI.getAllBills(),
          billingAPI.getPayments(),
          complaintAPI.getAll()
        ]);
        setMember(mRes.data.member || null);
        setBills((bRes.data.bills || []).filter((b: Bill) => b.member_id === memberId));
        setPayments((pRes.data.payments || []).filter((p: Payment) => p.member_id === memberId));
        setComplaints((cRes.data.complaints || []).filter((c: Complaint) => c.raised_by === memberId));
      } catch {
        toast.error("Failed to load member history");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [memberId]);

  const outstanding = useMemo(
    () => bills.filter((b) => !["PAID", "REJECTED"].includes(b.status)).reduce((sum, b) => sum + Number(b.total_amount || 0), 0),
    [bills]
  );

  const inDateRange = (value?: string) => {
    if (!value) return true;
    const d = new Date(value);
    if (fromDate) {
      const from = new Date(fromDate);
      if (d < from) return false;
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      if (d > to) return false;
    }
    return true;
  };

  const filteredBills = useMemo(
    () => bills.filter((b) => inDateRange(b.due_date)),
    [bills, fromDate, toDate]
  );
  const filteredPayments = useMemo(
    () => payments.filter((p) => inDateRange(p.payment_date)),
    [payments, fromDate, toDate]
  );
  const filteredComplaints = useMemo(
    () => complaints.filter((c) => inDateRange(c.created_at)),
    [complaints, fromDate, toDate]
  );

  const exportCsv = () => {
    let rows: string[] = [];
    let filename = "member-history.csv";
    if (activeTab === "BILLS") {
      filename = "member-bills.csv";
      rows = [
        "Bill Number,Billing Period,Due Date,Amount,Status",
        ...filteredBills.map((b) => `${b.bill_number},${b.billing_period || ""},${b.due_date || ""},${Number(b.total_amount || 0)},${b.status}`)
      ];
    } else if (activeTab === "PAYMENTS") {
      filename = "member-payments.csv";
      rows = [
        "Payment Date,Method,Amount,Status,Reference",
        ...filteredPayments.map((p) => `${p.payment_date},${p.payment_method},${Number(p.amount || 0)},${p.status},${p.payment_reference || ""}`)
      ];
    } else {
      filename = "member-complaints.csv";
      rows = [
        "Created At,Title,Category,Priority,Status",
        ...filteredComplaints.map((c) => `${c.created_at},"${c.title.replace(/"/g, '""')}",${c.category},${c.priority},${c.status}`)
      ];
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/members" className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to Members
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Member History</h1>
          {member && (
            <p className="text-sm text-gray-500 mt-1">
              {member.first_name} {member.last_name} - {member.role} {member.flat_number ? `- Flat ${member.flat_number}` : ""}
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <p className="text-xs text-gray-500">Bills</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{bills.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <p className="text-xs text-gray-500">Payments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{payments.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <p className="text-xs text-gray-500">Complaints</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{complaints.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <p className="text-xs text-gray-500">Outstanding</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">Rs {outstanding.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex gap-2">
                {[
                  { id: "BILLS" as const, label: "Bills" },
                  { id: "PAYMENTS" as const, label: "Payments" },
                  { id: "COMPLAINTS" as const, label: "Complaints" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${activeTab === tab.id ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg" />
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg" />
                <button onClick={exportCsv} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white">Export CSV</button>
              </div>
            </div>

            {activeTab === "BILLS" && (
            <section>
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3"><Receipt className="w-4 h-4" /> Bills</h2>
              <div className="space-y-2 max-h-96 overflow-auto">
                {filteredBills.length === 0 ? <p className="text-sm text-gray-400">No bills found</p> : filteredBills.map((b) => (
                  <div key={b.id} className="border border-gray-100 rounded-xl p-3">
                    <p className="text-sm font-medium text-gray-800">{b.bill_number}</p>
                    <p className="text-xs text-gray-500">{b.billing_period || "-"} | Due: {b.due_date || "-"}</p>
                    <p className="text-xs text-gray-600 mt-1">Rs {Number(b.total_amount || 0).toLocaleString("en-IN")} | {b.status}</p>
                  </div>
                ))}
              </div>
            </section>
            )}
            {activeTab === "PAYMENTS" && (
            <section>
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3"><CreditCard className="w-4 h-4" /> Payments</h2>
              <div className="space-y-2 max-h-96 overflow-auto">
                {filteredPayments.length === 0 ? <p className="text-sm text-gray-400">No payments found</p> : filteredPayments.map((p) => (
                  <div key={p.id} className="border border-gray-100 rounded-xl p-3">
                    <p className="text-sm font-medium text-gray-800">Rs {Number(p.amount || 0).toLocaleString("en-IN")}</p>
                    <p className="text-xs text-gray-500">{p.payment_method} | {new Date(p.payment_date).toLocaleDateString("en-IN")}</p>
                    <p className="text-xs text-gray-600 mt-1">{p.status}{p.payment_reference ? ` | Ref: ${p.payment_reference}` : ""}</p>
                  </div>
                ))}
              </div>
            </section>
            )}
            {activeTab === "COMPLAINTS" && (
            <section>
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3"><FileWarning className="w-4 h-4" /> Complaints</h2>
              <div className="space-y-2 max-h-96 overflow-auto">
                {filteredComplaints.length === 0 ? <p className="text-sm text-gray-400">No complaints found</p> : filteredComplaints.map((c) => (
                  <div key={c.id} className="border border-gray-100 rounded-xl p-3">
                    <p className="text-sm font-medium text-gray-800">{c.title}</p>
                    <p className="text-xs text-gray-500">{c.category} | {c.priority}</p>
                    <p className="text-xs text-gray-600 mt-1">{c.status} | {new Date(c.created_at).toLocaleDateString("en-IN")}</p>
                  </div>
                ))}
              </div>
            </section>
            )}
          </div>

          {member && (
            <section className="bg-white rounded-2xl border border-gray-100 p-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3"><User className="w-4 h-4" /> Member Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <p><span className="text-gray-500">Name:</span> {member.first_name} {member.last_name}</p>
                <p><span className="text-gray-500">Email:</span> {member.email}</p>
                <p><span className="text-gray-500">Phone:</span> {member.phone || "-"}</p>
                <p><span className="text-gray-500">Role:</span> {member.role}</p>
                <p><span className="text-gray-500">Wing:</span> {member.wing || "-"}</p>
                <p><span className="text-gray-500">Flat:</span> {member.flat_number || "-"}</p>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

