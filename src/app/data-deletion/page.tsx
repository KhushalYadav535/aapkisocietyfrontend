import React from 'react';
import { Trash2, AlertTriangle, CheckCircle, Mail } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Data & Account Deletion | Aapki Society',
  description: 'Instructions on how to request deletion of your account and associated data on the Aapki Society platform.',
};

export default function DataDeletion() {
  return (
    <div className="min-h-screen bg-linear-to-b from-red-50 to-slate-50 dark:from-slate-950 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
            <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Account & Data Deletion
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Aapki Society allows you to request the complete deletion of your account and associated personal data.
          </p>
        </div>

        {/* Content Section */}
        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 p-8 sm:p-10 space-y-10">
          
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b pb-2 border-slate-100 dark:border-slate-800">
              How to Request Deletion
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">1</div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Through the App</h3>
                  <p className="text-slate-600 dark:text-slate-400">Open the Aapki Society app, go to <strong>Profile Settings</strong> &gt; <strong>Account</strong>, and tap on <strong>Delete Account</strong>.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">2</div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Via Email</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Send an email from your registered email address to <a href="mailto:support@aapkisociety.in" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">support@aapkisociety.in</a> with the subject <strong>"Account Deletion Request"</strong>. Please include your phone number and flat details for verification.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b pb-2 border-slate-100 dark:border-slate-800">
              What Happens to Your Data?
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-5 border border-red-100 dark:border-red-900/30">
                <AlertTriangle className="w-6 h-6 text-red-500 mb-3" />
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Data Deleted</h3>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc pl-4">
                  <li>Your profile information (name, email, phone)</li>
                  <li>Profile pictures and personal settings</li>
                  <li>Active sessions and device tokens</li>
                </ul>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-900/30">
                <CheckCircle className="w-6 h-6 text-emerald-500 mb-3" />
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Data Retained</h3>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc pl-4">
                  <li>Past society maintenance payment records (kept for legal/accounting purposes)</li>
                  <li>Visitor logs associated with the society's security records</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b pb-2 border-slate-100 dark:border-slate-800">
              Retention Period
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Upon receiving your deletion request, your account will be suspended immediately. The complete deletion of your personal data from our active databases and backup systems may take up to <strong>30 days</strong>. 
            </p>
          </section>

          {/* Footer Action */}
          <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Mail className="w-5 h-5" />
              <span>Need help? Contact support.</span>
            </div>
            <Link 
              href="mailto:support@aapkisociety.in" 
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              Email Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
