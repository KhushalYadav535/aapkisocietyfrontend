"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import toast from "react-hot-toast";

export default function MfaSetupPage() {
  const router = useRouter();
  const [method, setMethod] = useState<"SMS_OTP" | "TOTP" | "EMAIL_OTP">("TOTP");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

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
      await authAPI.setupMfa({ method });
      toast.success("MFA enabled. Verify once to continue.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Failed to enable MFA");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      await authAPI.verifyMfa({ otp });
      toast.success("MFA verified");
      router.push("/dashboard");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f9ff] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Multi-Factor Authentication Setup</h1>
        <p className="text-sm text-gray-500">Your role requires MFA before accessing financial modules.</p>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as "SMS_OTP" | "TOTP" | "EMAIL_OTP")}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
          >
            <option value="TOTP">Authenticator App (TOTP)</option>
            <option value="SMS_OTP">SMS OTP</option>
            <option value="EMAIL_OTP">Email OTP</option>
          </select>
        </div>

        <button
          onClick={handleEnable}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-60"
        >
          Enable MFA
        </button>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">OTP</label>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
          />
        </div>

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold disabled:opacity-60"
        >
          Verify & Continue
        </button>
      </div>
    </div>
  );
}
