"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { societyAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { Check, ChevronRight, ChevronLeft, Building, FileText, Landmark, Calendar, Plus, Trash2 } from "lucide-react";

const STEPS = [
  { id: 'financial_year', label: 'Financial Year', icon: Calendar, description: 'Set your accounting period' },
  { id: 'wings', label: 'Wings & Layout', icon: Building, description: 'Configure society structures' },
  { id: 'gst', label: 'GST Details', icon: FileText, description: 'Taxation and compliance' },
  { id: 'bank', label: 'Bank Account', icon: Landmark, description: 'For collections & payments' }
];

export default function SetupWizard() {
  const router = useRouter();
  const { user, refreshPermissions } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    financial_year_start: 'April',
    wings: [{ name: 'A', total_floors: 10, flats_per_floor: 4 }],
    gst_number: '',
    bank_name: '',
    bank_account_number: '',
    bank_ifsc: ''
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user?.society_id) return toast.error("Society ID not found.");
    setLoading(true);
    try {
      await societyAPI.completeSetup(user.society_id, formData);
      toast.success("Society setup completed successfully!");
      if (refreshPermissions) await refreshPermissions();
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Failed to complete setup.");
    } finally {
      setLoading(false);
    }
  };

  const addWing = () => {
    setFormData(prev => ({
      ...prev,
      wings: [...prev.wings, { name: '', total_floors: 0, flats_per_floor: 0 }]
    }));
  };

  const removeWing = (index: number) => {
    setFormData(prev => ({
      ...prev,
      wings: prev.wings.filter((_, i) => i !== index)
    }));
  };

  const updateWing = (index: number, field: string, value: string | number) => {
    const newWings = [...formData.wings];
    newWings[index] = { ...newWings[index] as any, [field]: value };
    setFormData(prev => ({ ...prev, wings: newWings }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      
      <div className="w-full max-w-4xl relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Welcome to AapkiSociety
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Let&apos;s get your society configured. This 4-step wizard will set up the core details needed to run your operations smoothly.
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full -z-10">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
            {STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === currentStep;
              const isCompleted = idx < currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                      isActive ? 'bg-indigo-600 border-indigo-100 text-white scale-110 shadow-lg shadow-indigo-200' : 
                      isCompleted ? 'bg-indigo-600 border-white text-white' : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-6 h-6" /> : <StepIcon className="w-5 h-5" />}
                  </div>
                  <div className="mt-3 text-center absolute top-14 w-32 -ml-10">
                    <p className={`text-sm font-semibold ${isActive || isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>
                      {step.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mt-8">
          <div className="p-8 sm:p-10 min-h-[400px]">
            
            {/* STEP 1: Financial Year */}
            {currentStep === 0 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Calendar className="w-6 h-6" />
                  </div>
                  Financial Year Configuration
                </h2>
                <p className="text-slate-600 mb-8">Select the starting month for your society&apos;s financial year. This determines your accounting cycles, billing generation, and tax reports.</p>
                
                <div className="space-y-4">
                  <label className="flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all hover:border-indigo-300 hover:bg-indigo-50/50 peer-checked:border-indigo-600 peer-checked:bg-indigo-50"
                    style={{ borderColor: formData.financial_year_start === 'April' ? '#4f46e5' : '#e2e8f0', backgroundColor: formData.financial_year_start === 'April' ? '#eef2ff' : 'transparent' }}>
                    <input 
                      type="radio" 
                      name="fy" 
                      className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-600"
                      checked={formData.financial_year_start === 'April'}
                      onChange={() => setFormData({...formData, financial_year_start: 'April'})}
                    />
                    <div className="ml-4">
                      <span className="block text-lg font-semibold text-slate-900">April to March</span>
                      <span className="block text-slate-500 text-sm mt-1">Standard Indian Financial Year (Recommended)</span>
                    </div>
                  </label>

                  <label className="flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all hover:border-indigo-300 hover:bg-indigo-50/50"
                     style={{ borderColor: formData.financial_year_start === 'January' ? '#4f46e5' : '#e2e8f0', backgroundColor: formData.financial_year_start === 'January' ? '#eef2ff' : 'transparent' }}>
                    <input 
                      type="radio" 
                      name="fy" 
                      className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-600"
                      checked={formData.financial_year_start === 'January'}
                      onChange={() => setFormData({...formData, financial_year_start: 'January'})}
                    />
                    <div className="ml-4">
                      <span className="block text-lg font-semibold text-slate-900">January to December</span>
                      <span className="block text-slate-500 text-sm mt-1">Calendar Year</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 2: Wings */}
            {currentStep === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Building className="w-6 h-6" />
                  </div>
                  Society Wings & Layout
                </h2>
                <p className="text-slate-600 mb-8">Define the physical structure of your society. You can add more wings later from the settings.</p>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {formData.wings.map((wing, idx) => (
                    <div key={idx} className="flex gap-4 items-start bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Wing Name</label>
                        <input 
                          type="text" 
                          value={wing.name}
                          onChange={(e) => updateWing(idx, 'name', e.target.value)}
                          placeholder="e.g., A, B, C or Tower 1"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Total Floors</label>
                        <input 
                          type="number" 
                          value={wing.total_floors}
                          onChange={(e) => updateWing(idx, 'total_floors', parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Flats per Floor</label>
                        <input 
                          type="number" 
                          value={wing.flats_per_floor}
                          onChange={(e) => updateWing(idx, 'flats_per_floor', parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                        />
                      </div>
                      {formData.wings.length > 1 && (
                        <button 
                          onClick={() => removeWing(idx)}
                          className="mt-7 p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={addWing}
                  className="mt-6 flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all"
                >
                  <Plus className="w-5 h-5" /> Add Another Wing
                </button>
              </div>
            )}

            {/* STEP 3: GST */}
            {currentStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <FileText className="w-6 h-6" />
                  </div>
                  GST Configuration
                </h2>
                <p className="text-slate-600 mb-8">Enter your society&apos;s Goods and Services Tax (GST) details. Leave blank if your society is not registered for GST.</p>
                
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <label className="block text-sm font-semibold text-slate-900 mb-2">GSTIN Number</label>
                  <input 
                    type="text" 
                    value={formData.gst_number}
                    onChange={(e) => setFormData({...formData, gst_number: e.target.value.toUpperCase()})}
                    placeholder="e.g., 22AAAAA0000A1Z5"
                    className="w-full px-5 py-3 text-lg rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none font-mono tracking-wider placeholder:tracking-normal placeholder:font-sans"
                  />
                  <p className="text-sm text-slate-500 mt-3">This will be printed on all maintenance bills and receipts generated by the system.</p>
                </div>
              </div>
            )}

            {/* STEP 4: Bank Details */}
            {currentStep === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Landmark className="w-6 h-6" />
                  </div>
                  Bank Account Details
                </h2>
                <p className="text-slate-600 mb-8">Set up the primary bank account where member maintenance payments will be collected.</p>
                
                <div className="space-y-5 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Bank Name</label>
                    <input 
                      type="text" 
                      value={formData.bank_name}
                      onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                      placeholder="e.g., HDFC Bank, State Bank of India"
                      className="w-full px-5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Account Number</label>
                      <input 
                        type="text" 
                        value={formData.bank_account_number}
                        onChange={(e) => setFormData({...formData, bank_account_number: e.target.value})}
                        placeholder="e.g., 50100234567890"
                        className="w-full px-5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none font-mono tracking-wider placeholder:tracking-normal placeholder:font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">IFSC Code</label>
                      <input 
                        type="text" 
                        value={formData.bank_ifsc}
                        onChange={(e) => setFormData({...formData, bank_ifsc: e.target.value.toUpperCase()})}
                        placeholder="e.g., HDFC0001234"
                        className="w-full px-5 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none font-mono tracking-wider placeholder:tracking-normal placeholder:font-sans"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer Navigation */}
          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 0 || loading}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all ${
                currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <ChevronLeft className="w-5 h-5" /> Back
            </button>
            
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all hover:shadow-indigo-300 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : currentStep === STEPS.length - 1 ? (
                <>Complete Setup <Check className="w-5 h-5" /></>
              ) : (
                <>Next Step <ChevronRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
