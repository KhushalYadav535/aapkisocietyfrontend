import React from 'react';
import { Shield, Lock, Eye, FileText } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Aapki Society',
  description: 'Privacy Policy and Data Protection guidelines for Aapki Society platform.',
};

export default function PrivacyPolicy() {
  const lastUpdated = 'June 24, 2026';

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-indigo-50/50 dark:from-slate-950 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Last updated: <span className="font-semibold text-slate-900 dark:text-slate-300">{lastUpdated}</span>
          </p>
        </div>

        {/* Content Section */}
        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 p-8 sm:p-12 space-y-12">
          
          <section className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300 mb-8">
              At <strong>Aapki Society</strong>, protecting your privacy is at the core of what we do. This Privacy Policy outlines how we collect, use, and safeguard your personal information when you use our platform to manage your housing society or residential community.
            </p>

            <div className="grid sm:grid-cols-2 gap-8 mb-12">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
                <Lock className="w-6 h-6 text-indigo-500 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Secure Storage</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Your data is encrypted and stored in highly secure cloud environments.</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
                <Eye className="w-6 h-6 text-indigo-500 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Complete Transparency</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">We never sell your data to third parties. You have full control over what you share.</p>
              </div>
            </div>

            <div className="space-y-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-indigo-500" />
                  1. Information We Collect
                </h2>
                <div className="pl-9 space-y-4 text-slate-600 dark:text-slate-300">
                  <p>When you register for Aapki Society, we may collect the following types of information:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Personal Details:</strong> Name, phone number, email address, and profile picture.</li>
                    <li><strong>Residential Info:</strong> Apartment number, vehicle details, and family member details.</li>
                    <li><strong>Usage Data:</strong> How you interact with the app, including device information and IP addresses.</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-indigo-500" />
                  2. How We Use Your Information
                </h2>
                <div className="pl-9 space-y-4 text-slate-600 dark:text-slate-300">
                  <p>We use the collected information for various purposes, including:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Facilitating communication within your society.</li>
                    <li>Managing visitor entries, domestic help, and deliveries.</li>
                    <li>Processing maintenance bill payments securely.</li>
                    <li>Improving our services and providing customer support.</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-indigo-500" />
                  3. Data Security
                </h2>
                <div className="pl-9 space-y-4 text-slate-600 dark:text-slate-300">
                  <p>
                    The security of your data is important to us. We use industry-standard encryption protocols to protect your personal information during transmission and storage. However, please note that no method of transmission over the Internet or electronic storage is 100% secure.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-indigo-500" />
                  4. Your Rights
                </h2>
                <div className="pl-9 space-y-4 text-slate-600 dark:text-slate-300">
                  <p>You have the right to access, update, or delete the personal information we hold about you. You can manage most of this directly through the Aapki Society app settings. If you need assistance, you can contact your society admin or our support team.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Action */}
          <div className="pt-8 mt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Have questions about your privacy?
            </p>
            <Link 
              href="mailto:privacy@aapkisociety.in" 
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors focus:ring-4 focus:ring-slate-200 dark:focus:ring-slate-800"
            >
              Contact Privacy Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
