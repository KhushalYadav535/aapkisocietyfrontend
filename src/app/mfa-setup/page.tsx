"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { Mail, ShieldCheck, Lock, RotateCcw, CheckCircle2, ArrowRight, LogOut, AlertCircle, Clock, Smartphone, HelpCircle } from "lucide-react";

export default function MfaSetupPage() {
  const router = useRouter();
  const { user, setUser, logout, isAuthenticated } = useAuth();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentToEmail, setSentToEmail] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [demoOtp, setDemoOtp] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [sendingSms, setSendingSms] = useState(false);
  const [requestingReset, setRequestingReset] = useState(false);
  const hasSentInitialOtp = useRef(false);

  const getErrorMessage = (error: unknown) => {
    if (typeof error === "object" && error !== null && "response" in error) {
      const e = error as { response?: { data?: { error?: string } } };
      return e.response?.data?.error;
    }
    return undefined;
  };

  const handleSendOtp = async (isResend = false) => {
    setSending(true);
    setVerifyError("");
    try {
      const res = await authAPI.setupMfa({ method: "EMAIL_OTP" });
      const targetEmail = res.data?.email || user?.email || "your registered email";
      setSentToEmail(targetEmail);
      if (res.data?.demo_otp && process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_SHOW_TEST_OTP === "true") {
        setDemoOtp(res.data.demo_otp);
      }
      setCountdown(30);
      toast.success(isResend ? "New OTP sent to your email!" : res.data?.message || `Verification code sent to ${targetEmail}`);
    } catch (error: unknown) {
      const msg = getErrorMessage(error) || "Failed to send verification email";
      setVerifyError(msg);
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const handleSmsFallback = async () => {
    setSendingSms(true);
    setVerifyError("");
    try {
      const res = await authAPI.sendMfaSmsFallback();
      toast.success(res.data?.message || "SMS OTP dispatched to registered mobile number!");
      setCountdown(30);
    } catch (err: unknown) {
      const msg = getErrorMessage(err) || "Failed to dispatch SMS code";
      toast.error(msg);
    } finally {
      setSendingSms(false);
    }
  };

  const handleAdminResetRequest = async () => {
    setRequestingReset(true);
    try {
      const res = await authAPI.requestMfaReset();
      toast.success(res.data?.message || "Reset request submitted to Society Administrator.");
    } catch {
      toast.error("Failed to submit reset request. Please contact your Society Admin directly.");
    } finally {
      setRequestingReset(false);
    }
  };

  useEffect(() => {
    if (user?.email && !hasSentInitialOtp.current) {
      hasSentInitialOtp.current = true;
      handleSendOtp(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (!otp.trim()) {
      setVerifyError("Please enter the 6-digit verification code");
      toast.error("Please enter the 6-digit verification code");
      return;
    }
    setLoading(true);
    setVerifyError("");
    try {
      await authAPI.verifyMfa({ otp: otp.trim() });
      const profileRes = await authAPI.getProfile();
      const updatedUser = profileRes.data.user;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success("Email verified successfully! Welcome to your dashboard.");
      router.push("/dashboard");
    } catch (error: unknown) {
      const msg = getErrorMessage(error) || "Invalid or expired OTP. Please check your email or click Resend OTP.";
      setVerifyError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50/50 via-[#f8faff] to-slate-100 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-indigo-100/50">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Email Verification</h1>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
            A 6-digit one-time code (OTP) is required to access Treasury, Maker-Checker & Financial controls.
          </p>
        </div>

        {/* Email target indicator */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100/60 text-indigo-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Verification sent to</p>
            <p className="text-sm font-semibold text-slate-900 truncate">
              {sentToEmail || user?.email || "Registered Email"}
            </p>
          </div>
        </div>

        {/* Expiry & Spam notice */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100">
          <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>Code is valid for <strong>10 minutes</strong>. Check Spam if not in Inbox.</span>
        </div>

        {/* Dev / Testing OTP Badge (Only in local development) */}
        {process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_SHOW_TEST_OTP === "true" && demoOtp && (
          <div className="bg-amber-50 border border-amber-200/90 text-amber-900 text-xs px-4 py-3 rounded-2xl flex items-center justify-between">
            <div>
              <span className="font-semibold">Dev / Testing Code:</span>{" "}
              <code className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-amber-200">
                {demoOtp}
              </code>
            </div>
            <button
              type="button"
              onClick={() => { setOtp(demoOtp); setVerifyError(""); }}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
            >
              Fill
            </button>
          </div>
        )}

        {/* In-line Error Alert */}
        {verifyError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-2xl font-semibold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{verifyError}</span>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Enter 6-Digit Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6));
                if (verifyError) setVerifyError("");
              }}
              placeholder="000000"
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-2xl font-mono tracking-[0.4em] text-center font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50"
            />
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || otp.trim().length < 4}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Verify OTP & Continue
              </>
            )}
          </button>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => handleSendOtp(true)}
              disabled={sending || countdown > 0}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:text-gray-400 flex items-center gap-1.5"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${sending ? "animate-spin" : ""}`} />
              {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
            </button>

            <button
              type="button"
              onClick={() => { logout(); router.push('/login'); }}
              className="text-xs font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>

          {/* Real Fallback Channels for Production Security */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Trouble receiving verification code?</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSmsFallback}
                disabled={sendingSms}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                <span>{sendingSms ? "Dispatching SMS OTP..." : "Send SMS to Registered Mobile"}</span>
              </button>
              <button
                type="button"
                onClick={handleAdminResetRequest}
                disabled={requestingReset}
                className="w-full py-1.5 px-3 text-slate-500 hover:text-slate-800 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>{requestingReset ? "Submitting request..." : "Lost access? Request Administrator Reset"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
