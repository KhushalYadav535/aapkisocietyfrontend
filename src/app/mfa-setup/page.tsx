"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { ShieldCheck, Key, Lock, Copy, Check, ArrowRight } from "lucide-react";

export default function MfaSetupPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [method, setMethod] = useState<"SMS_OTP" | "TOTP" | "EMAIL_OTP">("TOTP");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [setupInitiated, setSetupInitiated] = useState(false);
  const [secret, setSecret] = useState("");
  const [copied, setCopied] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");

  const getErrorMessage = (error: unknown) => {
    if (typeof error === "object" && error !== null && "response" in error) {
      const e = error as { response?: { data?: { error?: string } } };
      return e.response?.data?.error;
    }
    return undefined;
  };

  const handleEnable = async () => {
    setLoading(true);
    try {
      const res = await authAPI.setupMfa({ method });
      setSetupInitiated(true);
      if (res.data?.secret) setSecret(res.data.secret);
      if (res.data?.demo_otp) {
        setDemoOtp(res.data.demo_otp);
        setOtp(res.data.demo_otp);
      }
      toast.success(res.data?.message || "MFA setup initiated. Enter code below.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Failed to initiate MFA");
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Secret copied to clipboard");
    }
  };

  const handleVerify = async () => {
    if (!otp.trim()) {
      toast.error("Please enter the verification code");
      return;
    }
    setLoading(true);
    try {
      await authAPI.verifyMfa({ otp: otp.trim() });
      const profileRes = await authAPI.getProfile();
      const updatedUser = profileRes.data.user;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success("MFA verified! Welcome to your dashboard.");
      router.push("/dashboard");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f9ff] px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-xl p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Security Verification (MFA)</h1>
            <p className="text-xs text-gray-500">Dual-factor authentication required for financial security</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Verification Method</label>
            <select
              value={method}
              disabled={setupInitiated}
              onChange={(e) => setMethod(e.target.value as "SMS_OTP" | "TOTP" | "EMAIL_OTP")}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 disabled:opacity-60"
            >
              <option value="TOTP">Authenticator App (Google / Microsoft Authenticator)</option>
              <option value="EMAIL_OTP">Email OTP Verification</option>
              <option value="SMS_OTP">SMS OTP Verification</option>
            </select>
          </div>

          {!setupInitiated ? (
            <button
              onClick={handleEnable}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-100 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              Generate Security Key & OTP
            </button>
          ) : (
            <div className="space-y-4 pt-2">
              {method === "TOTP" && secret && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-medium text-slate-600">Manual Entry Key for Authenticator:</p>
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200">
                    <code className="font-mono text-xs font-bold text-indigo-600 tracking-wider">{secret}</code>
                    <button
                      onClick={handleCopySecret}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700"
                      title="Copy secret"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {demoOtp && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3.5 py-2.5 rounded-xl">
                  <strong>Verification Code:</strong> <code className="font-mono font-bold">{demoOtp}</code>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Enter 6-Digit Code</label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="e.g. 123456"
                  maxLength={8}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono tracking-widest text-center text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleVerify}
                disabled={loading || !otp.trim()}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-100 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Verify & Activate MFA
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
