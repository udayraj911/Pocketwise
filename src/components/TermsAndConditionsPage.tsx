/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { ArrowLeft, Scale, AlertTriangle, CheckCircle, FileText, Lock, DollarSign, ShieldAlert, BookOpen, Mail } from 'lucide-react';
import { LEGAL_CONFIG } from '../config/legalConfig';
import { BrandLogo } from './BrandLogo';

interface TermsAndConditionsPageProps {
  onBack: () => void;
}

export const TermsAndConditionsPage: React.FC<TermsAndConditionsPageProps> = ({ onBack }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    { id: 'acceptance', title: '1. Acceptance & Eligibility' },
    { id: 'account-security', title: '2. Account Security & User Duties' },
    { id: 'data-accuracy', title: '3. Accuracy of Entered Financial Data' },
    { id: 'demo-vs-real', title: '4. Real Financials vs Demo Baseline' },
    { id: 'ai-disclaimer', title: '5. AI Financial Assistance Disclaimer' },
    { id: 'no-guarantees', title: '6. No Financial or Investment Guarantees' },
    { id: 'acceptable-use', title: '7. Prohibited Uses & Conduct' },
    { id: 'intellectual-property', title: '8. Intellectual Property Rights' },
    { id: 'limitation-liability', title: '9. Limitation of Liability & Disclaimers' },
    { id: 'governing-law', title: '10. Governing Law & Jurisdiction' },
    { id: 'changes-contact', title: '11. Term Updates & Contact' },
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C2B22] font-sans antialiased pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E8E3DA]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#DDD7CD] hover:bg-[#F2EDE4] text-xs font-semibold text-[#1C2B22] transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Pocketwise</span>
          </button>

          <BrandLogo variant="full" size="compact" showTagline={false} />

          <div className="text-xs font-medium text-[#5E7166] hidden sm:block">
            Version {LEGAL_CONFIG.termsVersion}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 pt-8 space-y-8">
        {/* Title Banner */}
        <div className="bg-[#122B1E] text-white rounded-3xl p-6 sm:p-10 border border-[#1A3C2A] shadow-lg relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-[#22C55E]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22C55E]/20 text-[#88D64C] text-xs font-bold uppercase tracking-wider">
              <Scale className="w-3.5 h-3.5" />
              <span>Terms & Conditions Agreement</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Terms & Conditions
            </h1>
            <p className="text-sm sm:text-base text-[#B3C8BB] max-w-2xl leading-relaxed">
              Legal rules, user responsibilities, AI disclosures, and conditions governing your access to and use of Pocketwise.
            </p>
            <div className="pt-2 text-xs text-[#88D64C] flex flex-wrap gap-4 font-medium">
              <span>Effective Date: {LEGAL_CONFIG.effectiveDate}</span>
              <span>•</span>
              <span>Last Revision: {LEGAL_CONFIG.lastUpdated}</span>
              <span>•</span>
              <span>Entity: {LEGAL_CONFIG.entityName}</span>
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* TOC Sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-[#E8E3DA] shadow-2xs sticky top-24">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5E7166] mb-3 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-[#22C55E]" />
                <span>Document Sections</span>
              </h3>
              <nav className="space-y-1.5 text-xs">
                {sections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className="w-full text-left py-1.5 px-2 rounded-lg text-[#5E7166] hover:bg-[#F2EDE4] hover:text-[#122B1E] font-medium transition-colors line-clamp-1"
                  >
                    {sec.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Body */}
          <article className="lg:col-span-3 space-y-10 text-sm leading-relaxed text-[#2C3E35]">
            {/* Section 1 */}
            <section id="acceptance" className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3DA] shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#122B1E]">
                  <Scale className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#122B1E]">1. Acceptance & Eligibility</h2>
              </div>
              <p>
                By creating an account, clicking "Create Free Account", or using <strong>{LEGAL_CONFIG.appName}</strong>, you agree to be bound by these Terms and Conditions. If you do not agree to all terms, you must not access or use Pocketwise.
              </p>
              <p>
                You must be at least 18 years of age or the legal age of majority in your jurisdiction to register an account and enter into this binding agreement.
              </p>
            </section>

            {/* Section 2 */}
            <section id="account-security" className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3DA] shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#122B1E]">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#122B1E]">2. Account Security & User Duties</h2>
              </div>
              <p>
                When registering, you agree to provide true, accurate, and current information. You are solely responsible for maintaining the secrecy of your authentication credentials and for all activities that occur under your account.
              </p>
              <p>
                Notify us immediately at <a href={`mailto:${LEGAL_CONFIG.supportEmail}`} className="text-[#22C55E] underline">{LEGAL_CONFIG.supportEmail}</a> if you suspect unauthorized access or security breaches involving your account.
              </p>
            </section>

            {/* Section 3 */}
            <section id="data-accuracy" className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3DA] shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#122B1E]">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#122B1E]">3. Accuracy of Entered Financial Data</h2>
              </div>
              <p>
                Pocketwise performs calculations based on user-entered values (income, expenses, cash balances, commitment amounts, and dates). Pocketwise does not connect to automated open banking feeds or verify bank statements independently.
              </p>
              <p>
                You acknowledge that all safe-to-spend projections and health metrics depend directly on the accuracy and completeness of the figures you input.
              </p>
            </section>

            {/* Section 4 */}
            <section id="demo-vs-real" className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3DA] shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#122B1E]">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#122B1E]">4. Real Financial Records vs Demo Baseline</h2>
              </div>
              <p>
                Unauthenticated visitors exploring Pocketwise interact with an interactive sample demonstration baseline (e.g., INR 10,000 monthly income model).
              </p>
              <p>
                Once you sign up or log in, your cloud profile operates on real user records isolated in Firestore. Authenticated users begin with clean baseline data until they enter their actual financial balances and expenses.
              </p>
            </section>

            {/* Section 5 & 6 AI Disclaimer */}
            <section id="ai-disclaimer" className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3DA] shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#FEF3C7] text-[#D97706]">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#122B1E]">5. AI Financial Assistance Disclaimer</h2>
              </div>

              <div className="p-5 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl text-xs text-[#92400E] space-y-2">
                <p className="font-bold text-sm">IMPORTANT FINANCIAL ASSISTANCE NOTICE:</p>
                <p>
                  Pocketwise provides self-directed financial planning tools, mathematical budget forecasts, and AI-generated insights for informational and educational purposes only.
                </p>
                <p>
                  Pocketwise is NOT a registered financial advisor, certified tax consultant, investment broker, or licensed bank. Recommendations produced by our AI Coach or Decision Simulator do NOT constitute professional financial advice or guaranteed investment guidance.
                </p>
              </div>

              <p>
                Always consult a certified financial planner, accountant, or licensed professional before making major investment, debt restructuring, or legal decisions.
              </p>
            </section>

            {/* Section 6 */}
            <section id="no-guarantees" className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3DA] shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#122B1E]">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#122B1E]">6. No Financial or Investment Guarantees</h2>
              </div>
              <p>
                Pocketwise makes no express or implied representation or warranty regarding financial results, potential savings amounts, debt reduction speed, or investment returns achieved through the application. Individual financial outcomes depend on market conditions, unexpected expenses, and user discipline.
              </p>
            </section>

            {/* Section 7 */}
            <section id="acceptable-use" className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3DA] shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#122B1E]">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#122B1E]">7. Prohibited Uses & Conduct</h2>
              </div>
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#2C3E35]">
                <li>Reverse engineer, decompile, or attempt to extract source code or AI prompts from Pocketwise.</li>
                <li>Attempt to bypass Firestore security rules, access other users' data records, or launch automated scraping/denial-of-service attacks.</li>
                <li>Submit false, illegal, defamatory, or harmful content via AI prompts or voice input.</li>
                <li>Use Pocketwise to conduct money laundering, unauthorized payment processing, or fraudulent activity.</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section id="intellectual-property" className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3DA] shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#122B1E]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#122B1E]">8. Intellectual Property Rights</h2>
              </div>
              <p>
                All trademarks, application brand logos, UI components, custom 3D shader code, deterministic calculation engine designs, and software belong exclusively to <strong>{LEGAL_CONFIG.entityName}</strong>.
              </p>
            </section>

            {/* Section 9 */}
            <section id="limitation-liability" className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3DA] shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#122B1E]">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#122B1E]">9. Limitation of Liability & Disclaimers</h2>
              </div>
              <p>
                To the maximum extent permitted under applicable law, Pocketwise and {LEGAL_CONFIG.entityName} shall not be liable for any indirect, incidental, consequential, or punitive damages, including loss of profits, financial losses, or data corruption arising from your use of or inability to use the service.
              </p>
            </section>

            {/* Section 10 */}
            <section id="governing-law" className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3DA] shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#122B1E]">
                  <Scale className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#122B1E]">10. Governing Law & Jurisdiction</h2>
              </div>
              <p>
                These Terms shall be governed by and construed in accordance with the <strong>{LEGAL_CONFIG.governingLaw}</strong>.
              </p>
              <p>
                Any legal suit, action, or proceeding arising out of or related to these Terms shall be instituted exclusively in the competent courts located in <strong>{LEGAL_CONFIG.jurisdiction}</strong>.
              </p>
            </section>

            {/* Section 11 */}
            <section id="changes-contact" className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3DA] shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#122B1E]">
                  <Mail className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#122B1E]">11. Term Updates & Contact</h2>
              </div>
              <p>
                We reserve the right to modify these Terms at any time. When material changes are published, we will update the version and effective date. Continued use of Pocketwise following changes constitutes acceptance.
              </p>
              <div className="p-5 bg-[#FAF8F5] rounded-2xl border border-[#E8E3DA] text-xs space-y-2">
                <p><strong>Support Email:</strong> <a href={`mailto:${LEGAL_CONFIG.supportEmail}`} className="text-[#22C55E] underline">{LEGAL_CONFIG.supportEmail}</a></p>
                <p><strong>Legal & Grievance:</strong> <a href={`mailto:${LEGAL_CONFIG.grievanceEmail}`} className="text-[#22C55E] underline">{LEGAL_CONFIG.grievanceEmail}</a></p>
              </div>
            </section>
          </article>
        </div>
      </main>
    </div>
  );
};
