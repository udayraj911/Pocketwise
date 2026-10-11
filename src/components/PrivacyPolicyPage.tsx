/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { ArrowLeft, Shield, Lock, Cpu, Mic, Database, UserCheck, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { LEGAL_CONFIG } from '../config/legalConfig';
import { BrandLogo } from './BrandLogo';

interface PrivacyPolicyPageProps {
  onBack: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBack }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    { id: 'overview', title: '1. Overview & Data Philosophy' },
    { id: 'collected-info', title: '2. Information We Collect' },
    { id: 'how-used', title: '3. How We Use Your Information' },
    { id: 'ai-third-party', title: '4. AI Processing & Third-Party Services' },
    { id: 'voice-mic', title: '5. Voice & Microphone Privacy' },
    { id: 'storage-security', title: '6. Storage, Security & Retention' },
    { id: 'user-rights', title: '7. Your Rights & Indian DPDP Act 2023' },
    { id: 'contact', title: '8. Contact & Grievance Redressal' },
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
            Version {LEGAL_CONFIG.privacyVersion}
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
              <Shield className="w-3.5 h-3.5" />
              <span>Official Privacy Policy</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-sm sm:text-base text-[#B3C8BB] max-w-2xl leading-relaxed">
              How Pocketwise collects, uses, processes, protects, and stores your financial data and personal information across our web application and cloud services.
            </p>
            <div className="pt-2 text-xs text-[#88D64C] flex flex-wrap gap-4 font-medium">
              <span>Effective Date: {LEGAL_CONFIG.effectiveDate}</span>
              <span>•</span>
              <span>Last Updated: {LEGAL_CONFIG.lastUpdated}</span>
              <span>•</span>
              <span>Entity: {LEGAL_CONFIG.entityName}</span>
            </div>
          </div>
        </div>

        {/* Layout: Sticky Table of Contents & Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* TOC Sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-[#E8E3DA] shadow-2xs sticky top-24">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5E7166] mb-3 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#22C55E]" />
                <span>Table of Contents</span>
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

          {/* Document Body */}
          <article className="lg:col-span-3 space-y-10 text-sm leading-relaxed text-[#2C3E35]">
            {/* Section 1 */}
            <section id="overview" className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3DA] shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#122B1E]">
                  <Shield className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#122B1E]">1. Overview & Data Philosophy</h2>
              </div>
              <p>
                At <strong>{LEGAL_CONFIG.entityName}</strong> (operating as <strong>{LEGAL_CONFIG.appName}</strong>), we believe financial clarity should never come at the cost of personal privacy. This Privacy Policy discloses our real data collection, processing, and security practices for users of the Pocketwise financial planning and management application.
              </p>
              <p>
                Pocketwise is built to help individuals track monthly budgets, commitments, expenses, and savings goals. We collect only the data necessary to deliver personalized financial calculations, deterministic budget projections, and real-time AI financial advice.
              </p>
            </section>

            {/* Section 2 */}
            <section id="collected-info" className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3DA] shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#122B1E]">
                  <Database className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#122B1E]">2. Information We Collect</h2>
              </div>
              <p>
                Depending on whether you browse as a guest or sign up for a cloud account, Pocketwise processes the following categories of information:
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E3DA]">
                  <h4 className="font-bold text-[#122B1E] text-xs uppercase tracking-wider mb-1">A. Required Account Credentials (Authenticated Users)</h4>
                  <p className="text-xs text-[#5E7166]">
                    Email address, hashed authentication credentials managed via Google Firebase Authentication, and Google profile display name or profile picture (when using Google Sign-In).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E3DA]">
                  <h4 className="font-bold text-[#122B1E] text-xs uppercase tracking-wider mb-1">B. Financial Information Provided by You</h4>
                  <p className="text-xs text-[#5E7166]">
                    Available cash balance, salary/income schedules, recurring commitment bills (rent, loans, subscriptions), logged daily expenses, custom category tags, transaction dates, and target savings goal amounts.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E3DA]">
                  <h4 className="font-bold text-[#122B1E] text-xs uppercase tracking-wider mb-1">C. AI Prompts & Voice Transcripts</h4>
                  <p className="text-xs text-[#5E7166]">
                    User-submitted questions or prompt text sent to the Pocketwise AI Financial Coach, as well as spoken voice audio transcriptions captured via browser speech input when you interact with the Voice Assistant.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E3DA]">
                  <h4 className="font-bold text-[#122B1E] text-xs uppercase tracking-wider mb-1">D. Preferences & Technical Telemetry</h4>
                  <p className="text-xs text-[#5E7166]">
                    Currency setting (e.g. INR ₹), display timezone, onboarding survey choices, browser user agent, IP address, and standard HTTP web log headers recorded by hosting infrastructure.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="how-used" className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3DA] shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#122B1E]">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#122B1E]">3. How We Use Your Information</h2>
              </div>
              <p>We process your data strictly to fulfill application features requested by you:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#2C3E35]">
                <li><strong>Account Authentication & Synchronization:</strong> To authenticate your identity across browser reloads and sync your financial plans safely to Google Cloud Firestore.</li>
                <li><strong>Deterministic Budget Calculations:</strong> To compute daily safe-to-spend allowances, remaining flexible margins, and commitment coverage metrics.</li>
                <li><strong>AI Insights & Category Analysis:</strong> To evaluate spending patterns and generate automated financial coaching advice.</li>
                <li><strong>Voice Commands:</strong> To transcribe hands-free queries (e.g. "Add expense of 250 for lunch") into structured transaction entries.</li>
                <li><strong>Security & Troubleshooting:</strong> To enforce rate limits, prevent unauthorized access, and ensure service reliability.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="ai-third-party" className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3DA] shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#122B1E]">
                  <Cpu className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#122B1E]">4. AI Processing & Third-Party Services</h2>
              </div>
              <p>
                Pocketwise integrates real third-party cloud infrastructure to deliver storage and intelligent recommendations:
              </p>

              <div className="space-y-3 pt-2">
                {LEGAL_CONFIG.thirdPartyServices.map((service, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E3DA] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h4 className="font-bold text-[#122B1E]">{service.name}</h4>
                      <p className="text-xs text-[#5E7166] mt-0.5">{service.purpose}</p>
                    </div>
                    <a
                      href={service.privacyPolicyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-[#22C55E] hover:underline shrink-0"
                    >
                      Privacy Policy ↗
                    </a>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl text-xs text-[#92400E] space-y-1">
                <p className="font-bold">AI Data Transmission Notice:</p>
                <p>
                  When you request AI insights or use the AI Coach chatbot, your budget metrics and prompts are processed securely via Google Gemini APIs. Prompt data is transmitted over TLS encryption solely to generate response outputs and is governed by Google Enterprise privacy commitments.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section id="voice-mic" className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3DA] shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#122B1E]">
                  <Mic className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#122B1E]">5. Voice & Microphone Privacy</h2>
              </div>
              <p>
                Pocketwise includes an optional hands-free Voice Assistant feature.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li><strong>Explicit User Activation Only:</strong> Microphone access is requested only when you explicitly press the Voice Assistant microphone icon. We never record background audio.</li>
                <li><strong>Browser Speech Recognition:</strong> Audio is processed using standard Web Speech API provided by your browser (e.g., Chrome Speech Recognition engine).</li>
                <li><strong>Audio File Retention:</strong> Pocketwise does not record or retain raw audio `.wav`/`.mp3` recordings on our servers. Only the resulting text transcript is processed to execute financial logging commands.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="storage-security" className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3DA] shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#122B1E]">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#122B1E]">6. Storage, Security & Retention</h2>
              </div>
              <p>
                Authenticated user documents are stored in <strong>Google Cloud Firestore</strong> hosted in the <code>asia-southeast1</code> region.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li><strong>Security Rules Enforcement:</strong> Firestore Security Rules enforce strict document-level user isolation. Users can only query or write documents under their own authenticated <code>/users/{'{userId}'}</code> tree.</li>
                <li><strong>Encryption in Transit & Rest:</strong> Data is encrypted using TLS in transit and standard AES-256 at rest within Google Cloud infrastructure.</li>
                <li><strong>Retention Period:</strong> Your financial data is retained as long as your account remains active. You may export your financial data or request permanent account deletion at any time in the Account Privacy settings.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="user-rights" className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3DA] shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#122B1E]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#122B1E]">7. Your Rights & Indian DPDP Act 2023</h2>
              </div>
              <p>
                In compliance with the <strong>Digital Personal Data Protection Act, 2023 (India)</strong> and global privacy standards, you enjoy the following rights as a Data Principal:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E3DA]">
                  <strong>Right to Access:</strong> View all saved financial plans, expenses, and commitments in your dashboard or download a JSON export.
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E3DA]">
                  <strong>Right to Correction:</strong> Edit or update any transaction, budget goal, or commitment item at any time.
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E3DA]">
                  <strong>Right to Erasure:</strong> Request complete deletion of your account and Firestore data records.
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E3DA]">
                  <strong>Grievance Redressal:</strong> Submit privacy concerns directly to our designated Grievance Officer.
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section id="contact" className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E3DA] shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#122B1E]">
                  <Mail className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#122B1E]">8. Contact & Grievance Redressal</h2>
              </div>
              <p>
                If you have questions, privacy inquiries, or wish to exercise your data principal rights, please contact our Grievance Officer:
              </p>
              <div className="p-5 bg-[#FAF8F5] rounded-2xl border border-[#E8E3DA] text-xs space-y-2">
                <p><strong>Name:</strong> {LEGAL_CONFIG.grievanceOfficer.name}</p>
                <p><strong>Title:</strong> {LEGAL_CONFIG.grievanceOfficer.title}</p>
                <p><strong>Email:</strong> <a href={`mailto:${LEGAL_CONFIG.grievanceEmail}`} className="text-[#22C55E] underline">{LEGAL_CONFIG.grievanceEmail}</a></p>
                <p><strong>Support Email:</strong> <a href={`mailto:${LEGAL_CONFIG.supportEmail}`} className="text-[#22C55E] underline">{LEGAL_CONFIG.supportEmail}</a></p>
                <p><strong>Address:</strong> {LEGAL_CONFIG.grievanceOfficer.address}</p>
              </div>
            </section>
          </article>
        </div>
      </main>
    </div>
  );
};
