/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, ShieldCheck, Download, Trash2, FileText, CheckCircle2, Lock, ExternalLink, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LEGAL_CONFIG } from '../config/legalConfig';

interface AccountPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrivacyPage: () => void;
  onOpenTermsPage: () => void;
  onResetData: () => void;
  budgetData: any;
  commitmentsData: any[];
  expensesData: any[];
}

export const AccountPrivacyModal: React.FC<AccountPrivacyModalProps> = ({
  isOpen,
  onClose,
  onOpenPrivacyPage,
  onOpenTermsPage,
  onResetData,
  budgetData,
  commitmentsData,
  expensesData,
}) => {
  const { user, logout } = useAuth();
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen) return null;

  const handleExportData = () => {
    const exportPayload = {
      user: {
        uid: user?.uid || 'guest_demo_user',
        email: user?.email || 'guest@pocketwise.local',
      },
      exportedAt: new Date().toISOString(),
      legalConsent: {
        privacyPolicyVersion: LEGAL_CONFIG.privacyVersion,
        termsVersion: LEGAL_CONFIG.termsVersion,
        acceptedAt: new Date().toISOString(),
      },
      budget: budgetData,
      commitments: commitmentsData,
      expenses: expensesData,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `pocketwise_data_export_${user?.uid || 'guest'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-[#E8E3DA] space-y-6 max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#E8F5E9] text-[#122B1E]">
              <ShieldCheck className="w-6 h-6 text-[#22C55E]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#122B1E]">Account Privacy & Legal Controls</h3>
              <p className="text-xs text-[#5E7166]">
                Transparency, data export, consent records & Indian DPDP Act 2023 compliance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-[#F2EDE4] flex items-center justify-center text-[#5E7166] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Account & Legal Consent Status */}
        <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E8E3DA] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#5E7166]">Account Status:</span>
            <span className="font-bold text-[#122B1E] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
              {user ? user.email : 'Guest Demo Mode'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#5E7166]">Accepted Policy Versions:</span>
            <span className="font-bold text-[#122B1E]">
              Privacy v{LEGAL_CONFIG.privacyVersion} • Terms v{LEGAL_CONFIG.termsVersion}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#5E7166]">Cloud Database Region:</span>
            <span className="font-bold text-[#122B1E]">Asia-SouthEast1 (Firestore)</span>
          </div>
        </div>

        {/* Legal Document Links */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#5E7166]">
            Legal Agreements & Disclaimers
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => {
                onClose();
                onOpenPrivacyPage();
              }}
              className="p-3 bg-white hover:bg-[#FAF8F5] border border-[#DDD7CD] rounded-2xl text-left flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-[#22C55E]" />
                <span className="text-xs font-bold text-[#122B1E]">Privacy Policy</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#8B9B90] group-hover:text-[#122B1E]" />
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenTermsPage();
              }}
              className="p-3 bg-white hover:bg-[#FAF8F5] border border-[#DDD7CD] rounded-2xl text-left flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-[#22C55E]" />
                <span className="text-xs font-bold text-[#122B1E]">Terms & Conditions</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#8B9B90] group-hover:text-[#122B1E]" />
            </button>
          </div>
        </div>

        {/* Data Portability (Export) */}
        <div className="space-y-2 pt-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#5E7166]">
            Data Principal Right to Portability
          </h4>
          <div className="p-4 bg-white border border-[#DDD7CD] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-[#122B1E]">Export Financial Data (JSON)</p>
              <p className="text-[11px] text-[#5E7166]">
                Download your complete income, expenses, commitments, and settings as a JSON file.
              </p>
            </div>
            <button
              onClick={handleExportData}
              className="px-3.5 py-2 bg-[#122B1E] text-[#88D64C] rounded-xl text-xs font-bold hover:bg-[#1A3C2A] transition-colors flex items-center gap-2 shrink-0 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
          {downloadSuccess && (
            <p className="text-xs text-[#22C55E] font-medium flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Data export downloaded successfully!
            </p>
          )}
        </div>

        {/* Danger Zone: Account Reset / Erasure */}
        <div className="space-y-2 pt-2 border-t border-[#E8E3DA]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#B91C1C]">
            Data Erasure & Reset
          </h4>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full p-3 bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FCA5A5] rounded-2xl text-xs font-bold text-[#991B1B] flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset Local Financial Plan Data</span>
            </button>
          ) : (
            <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded-2xl space-y-3">
              <div className="flex items-start gap-2 text-xs text-[#991B1B]">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Are you sure you want to reset your financial plan data? This action will clear current session data.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onResetData();
                    setConfirmDelete(false);
                    onClose();
                  }}
                  className="flex-1 py-2 bg-[#DC2626] text-white rounded-xl text-xs font-bold hover:bg-[#B91C1C] transition-colors"
                >
                  Yes, Reset Data
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 bg-white border border-[#DDD7CD] rounded-xl text-xs font-semibold text-[#122B1E] hover:bg-[#FAF8F5]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
