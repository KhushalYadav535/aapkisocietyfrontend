"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Clock,
  IndianRupee,
  Share2,
  Copy,
  HelpCircle,
  ShieldCheck,
  Languages
} from "lucide-react";

interface ByeLawRule {
  id: string;
  keywords: string[];
  clause_no: string;
  topic: string;
  answer_en: string;
  answer_hi: string;
  allowed_timings?: string;
  penalty?: string;
  category: "RENOVATION" | "PARKING" | "PETS" | "FINANCE" | "TENANCY" | "GENERAL";
}

const BYE_LAWS_KNOWLEDGE_BASE: ByeLawRule[] = [
  {
    id: "RENOVATION_SUNDAY",
    keywords: ["renovation", "sunday", "drilling", "carpenter", "hammer", "construction", "repair", "remodelling", "noise"],
    clause_no: "Model Bye-Law Clause 46(a) - Repair and Internal Alteration",
    topic: "Flat Renovation & Drilling Rules",
    answer_en: "Heavy civil renovation, tile cutting, and drilling are strictly PROHIBITED on Sundays, Public Holidays, and between 01:00 PM to 03:00 PM on weekdays. Work is only permitted Monday to Saturday from 09:00 AM to 06:00 PM with prior society permission.",
    answer_hi: "रविवार, राष्ट्रीय अवकाश एवं दोपहर 1:00 से 3:00 बजे के बीच ड्रिलिंग एवं भारी मरम्मत कार्य पूर्णतः वर्जित है। कार्य केवल सोमवार से शनिवार सुबह 9:00 से शाम 6:00 बजे तक ही अनुमति प्राप्त करके किया जा सकता है।",
    allowed_timings: "Mon - Sat: 09:00 AM - 06:00 PM (Strict silence on Sunday & afternoon)",
    penalty: "₹1,000 fine for first breach; stopping of worker entry on repeat offense.",
    category: "RENOVATION"
  },
  {
    id: "MAINTENANCE_LATE_FEE",
    keywords: ["late fee", "interest", "penalty", "delay", "maintenance fine", "bill overdue", "due date", "arrears"],
    clause_no: "Model Bye-Law Clause 72 - Payment of Society Dues",
    topic: "Maintenance Overdue & Late Fee Calculation",
    answer_en: "Society dues must be paid on or before the due date (typically 15th-21st of every month). Defaulters are liable to pay simple interest at 21% per annum (or 1.75% to 2% per month) for the period of delay. Continuous default beyond 3 months leads to formal legal notice.",
    answer_hi: "सोसायटी मेंटेनेंस का भुगतान देय तिथि से पहले करना अनिवार्य है। विलंब होने पर 21% प्रति वर्ष (लगभग 1.75% प्रति माह) की दर से साधारण ब्याज/विलंब शुल्क देय होगा। 3 माह से अधिक के डिफ़ॉल्ट पर क़ानूनी नोटिस जारी किया जा सकता है।",
    allowed_timings: "Due within 15-21 days of bill generation",
    penalty: "Simple interest @ 1.75% - 2% per month + listing on Defaulters Notice Board after 60 days.",
    category: "FINANCE"
  },
  {
    id: "PET_POLICY",
    keywords: ["pet", "dog", "cat", "animal", "barking", "lift", "elevator", "leash", "waste", "pet poop"],
    clause_no: "AWBI Guidelines & Model Bye-Law Clause 168 - Companion Animals",
    topic: "Pet Guidelines & Common Areas Decorum",
    answer_en: "Pets are legally allowed in society premises and passenger lifts as per Supreme Court & Animal Welfare Board of India (AWBI) rulings. Societies cannot ban pets. However: 1) Dogs must be leashed at all times in corridors. 2) Pet owners must scoop/clean any poop immediately. 3) Excessive barking post 10:00 PM must be managed.",
    answer_hi: "सुप्रीम कोर्ट और AWBI दिशा-निर्देशों के अनुसार पालतू जानवरों पर प्रतिबंध नहीं लगाया जा सकता है। लिफ्ट में पेट ले जाने की अनुमति है। हालांकि कॉमन एरिया में डॉग को पट्टे (leash) में रखना अनिवार्य है तथा किसी भी गंदगी को तुरंत साफ करना मालिक का दायित्व है।",
    allowed_timings: "Allowed 24x7 with mandatory leash in corridors",
    penalty: "₹500 penalty for leaving uncleaned pet waste in corridors or garden.",
    category: "PETS"
  },
  {
    id: "PARKING_GUEST",
    keywords: ["parking", "car parking", "bike", "wrong parking", "slot", "visitor parking", "blocking", "guest car"],
    clause_no: "Model Bye-Law Clause 78-84 - Allotment & Use of Parking Space",
    topic: "Vehicle Parking Allocation & Visitor Slots",
    answer_en: "Every vehicle must strictly be parked in its allocated stilt/basement slot. Parking in another member's marked slot or obstructing driveways is a punishable violation. Visitor parking is strictly for temporary guests (maximum 4 hours or overnight with guard permission).",
    answer_hi: "सभी वाहनों को केवल अपनी आवंटित पार्किंग में ही पार्क करना आवश्यक है। किसी अन्य के स्लॉट में पार्क करना या रास्ता रोकना वर्जित है। विजिटर पार्किंग केवल अल्पकालिक अतिथियों हेतु (अधिकतम 4 घंटे) आरक्षित है।",
    allowed_timings: "Visitor Parking: Max 4 hours without prior approval",
    penalty: "Wheel clamp + ₹500 fine for blocking driveways or unauthorized parking.",
    category: "PARKING"
  },
  {
    id: "TENANT_VERIFICATION",
    keywords: ["tenant", "rent", "police verification", "agreement", "tenant noc", "move in fee", "sublet", "bachelor"],
    clause_no: "Model Bye-Law Clause 20 & 43 - Subletting & Tenancy Formalities",
    topic: "Tenant Move-In, Police Verification & NOC",
    answer_en: "Residents renting out flats must: 1) Submit registered rent agreement copy to Society Office. 2) Complete mandatory local Police Tenant Verification. 3) Apply for digital Society Move-In NOC. Society cannot discriminate on food habits, marital status, or religion. Non-occupancy charges cannot exceed 10% of service charges.",
    answer_hi: "फ्लैट किराए पर देने हेतु पंजीकृत रेंट एग्रीमेंट एवं पुलिस वेरिफिकेशन प्रमाण पत्र जमा करना अनिवार्य है। सोसायटी द्वारा डिजिटल एनओसी (NOC) प्राप्त करने के बाद ही मूव-इन किया जा सकता है। नॉन-ऑक्यूपेंसी शुल्क सर्विस चार्ज के 10% से अधिक नहीं लिया जा सकता।",
    allowed_timings: "Submit documents 7 days prior to shifting",
    penalty: "Moving banned without Police Verification; non-occupancy fee capped at 10%.",
    category: "TENANCY"
  },
  {
    id: "TERRACE_ACCESS",
    keywords: ["terrace", "roof", "rooftop", "clothes", "party on terrace", "keys", "drying"],
    clause_no: "Model Bye-Law Clause 171 - Common Amenities & Terrace Use",
    topic: "Terrace Access, Security & Gatherings",
    answer_en: "Terrace is a common fire exit and emergency zone. Open access is available from 06:00 AM to 08:00 PM for walking or drying clothes. Private parties, consumption of alcohol, or loud music on the terrace is strictly prohibited without prior written permission from the Managing Committee.",
    answer_hi: "टेरेस आपातकालीन फायर निकास क्षेत्र है। यह सुबह 6:00 से रात 8:00 बजे तक खुला रहता है। बिना समिति की लिखित अनुमति के छत पर पार्टी, तेज संगीत या शराब पीना सख्त मना है।",
    allowed_timings: "Open: 06:00 AM - 08:00 PM",
    penalty: "Immediate dispersal by security + ₹2,000 fine for unauthorized night parties.",
    category: "GENERAL"
  },
  {
    id: "LATE_NIGHT_MUSIC",
    keywords: ["loud music", "party", "balcony", "speaker", "sound", "peace", "disturbance", "night"],
    clause_no: "Noise Pollution Rules 2000 & Model Bye-Law Clause 169",
    topic: "Late Night Noise & Music Restrictions",
    answer_en: "As per Supreme Court & Noise Pollution Rules, loud speakers, high-volume music, and noisy balcony gatherings are prohibited between 10:00 PM and 06:00 AM. Residents must keep television and music volumes inside permissible decibels so as not to disturb adjoining units.",
    answer_hi: "ध्वनि प्रदूषण नियमों के तहत रात 10:00 बजे से सुबह 6:00 बजे के बीच तेज संगीत और बालकनी में शोरगुल पूर्णतः प्रतिबंधित है। उल्लंघन होने पर गार्ड द्वारा वार्निंग दी जाती है और पुलिस शिकायत दर्ज हो सकती है।",
    allowed_timings: "Silence Hours: 10:00 PM - 06:00 AM",
    penalty: "₹500 penalty + reporting to local police station for repeat offenders.",
    category: "GENERAL"
  },
  {
    id: "BALCONY_CLOTHES",
    keywords: ["balcony", "clothes", "hanging", "drying clothes", "railing", "facade", "pots", "plants"],
    clause_no: "Model Bye-Law Clause 168(b) - Building Aesthetics & Safety",
    topic: "Balcony Railing Aesthetics & Pot Safety",
    answer_en: "Drying dripping wet clothes directly over exterior balcony railings is discouraged to preserve building elevation aesthetics and prevent water dripping on lower flats. Flower pots placed on exterior balcony ledges must be securely anchored to prevent falling hazard.",
    answer_hi: "इमारत की सुंदरता बनाए रखने हेतु बाहरी बालकनी रेलिंग पर गीले कपड़े लटकाना वर्जित है। बालकनी की बाउंड्री पर रखे गमलों को सुरक्षित बांधना आवश्यक है ताकि वे नीचे न गिरें।",
    allowed_timings: "Use internal drying stands inside balcony",
    penalty: "Written advisory from committee; liability for damage if pot falls.",
    category: "GENERAL"
  }
];

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  rule?: ByeLawRule;
  timestamp: string;
}

export default function ByeLawsAiPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: `Hello ${user?.first_name || "Neighbor"}! I am your 24/7 Society Bye-Laws & Rules Assistant. Ask me anything about flat renovation, parking rules, late fees, pet policies, or terrace timings. I provide instant answers in English and हिंदी with exact Bye-Law clause references!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [searching, setSearching] = useState(false);

  const findBestRule = (text: string): ByeLawRule | null => {
    const lower = text.toLowerCase();
    let bestMatch: ByeLawRule | null = null;
    let maxScore = 0;

    for (const rule of BYE_LAWS_KNOWLEDGE_BASE) {
      let score = 0;
      for (const kw of rule.keywords) {
        if (lower.includes(kw)) {
          score += 2;
        }
      }
      if (lower.includes(rule.topic.toLowerCase())) score += 3;
      if (score > maxScore) {
        maxScore = score;
        bestMatch = rule;
      }
    }

    return maxScore > 0 ? bestMatch : null;
  };

  const handleSend = (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: userText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setSearching(true);

    setTimeout(() => {
      const match = findBestRule(userText);
      let aiReply: ChatMessage;

      if (match) {
        aiReply = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: `According to ${match.clause_no}:\n\n${match.answer_en}`,
          rule: match,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
      } else {
        aiReply = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: `I couldn't find an exact match in the society bye-laws for your query. Generally, all resident activities must maintain peace, safety, and mutual decorum. For special approvals, please submit a request to the Society Managing Committee or contact the Secretary.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
      }

      setMessages((prev) => [...prev, aiReply]);
      setSearching(false);
    }, 400);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Answer copied to clipboard!");
  };

  const samplePrompts = [
    "Can I drill or do flat renovation on Sunday?",
    "What is the late fee on maintenance dues?",
    "Are dogs allowed in passenger lifts?",
    "What are the rules for tenant police verification?",
    "What are the allowed terrace timings?",
    "Music volume rules after 10 PM?"
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 backdrop-blur-md text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5 text-indigo-400" />
            Zero-Token Free AI • Model Housing Society Bye-Laws
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Society Bye-Laws AI Assistant</h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Instant, legal answers to all resident queries on renovations, pet rules, parking disputes, late fees, and common amenities in English & हिंदी.
          </p>
        </div>
      </div>

      {/* Suggested Quick Questions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Ask:
        </span>
        {samplePrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/90 whitespace-nowrap transition-all shadow-sm shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Window */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col h-[580px] overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5">
          {messages.map((m) => {
            const isAi = m.sender === "ai";
            return (
              <div key={m.id} className={`flex gap-3.5 ${isAi ? "items-start" : "items-start justify-end"}`}>
                {isAi && (
                  <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] space-y-3 ${isAi ? "text-slate-800" : "text-white"}`}>
                  <div
                    className={`p-4 sm:p-5 rounded-2xl text-sm leading-relaxed ${
                      isAi
                        ? "bg-slate-50 border border-slate-200/80 shadow-sm"
                        : "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>

                    {/* Rich Bye-Law Citation Card */}
                    {m.rule && (
                      <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-3 text-xs">
                        <div className="flex items-center justify-between text-indigo-700 font-bold">
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4" />
                            {m.rule.clause_no}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold text-[10px]">
                            {m.rule.topic}
                          </span>
                        </div>

                        {/* Hindi Explanation */}
                        <div className="bg-amber-50/70 border border-amber-200/70 p-3 rounded-xl text-slate-800">
                          <span className="font-bold text-amber-800 flex items-center gap-1 mb-1 text-[11px]">
                            <Languages className="w-3.5 h-3.5" /> हिंदी सारांश (Hindi Summary):
                          </span>
                          <p className="text-slate-700">{m.rule.answer_hi}</p>
                        </div>

                        {/* Timings & Penalty */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          {m.rule.allowed_timings && (
                            <div className="flex items-start gap-1.5 text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                              <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-slate-800 block">Allowed Timings:</span>
                                {m.rule.allowed_timings}
                              </div>
                            </div>
                          )}
                          {m.rule.penalty && (
                            <div className="flex items-start gap-1.5 text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-rose-800 block">Penalty for Violation:</span>
                                {m.rule.penalty}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="pt-1 flex items-center justify-end">
                          <button
                            onClick={() =>
                              copyToClipboard(
                                `${m.rule?.clause_no}\n${m.rule?.answer_en}\n\nहिंदी:\n${m.rule?.answer_hi}`
                              )
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy Official Clause
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <span className={`text-[10px] text-slate-400 block px-1 ${isAi ? "text-left" : "text-right"}`}>
                    {m.timestamp}
                  </span>
                </div>

                {!isAi && (
                  <div className="w-9 h-9 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 font-bold text-xs">
                    {user?.first_name?.charAt(0) || "U"}
                  </div>
                )}
              </div>
            );
          })}

          {searching && (
            <div className="flex items-center gap-2 text-slate-400 text-xs italic pl-12">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
              Searching Society Bye-Laws & Rules database...
            </div>
          )}
        </div>

        {/* Query Input Bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(query);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a rule question e.g. 'Can I do flat renovation on Sunday?' or 'Pet rules in lift?'..."
              className="flex-1 px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
            />
            <button
              type="submit"
              disabled={!query.trim() || searching}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-md shadow-indigo-600/20 disabled:opacity-40 transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
