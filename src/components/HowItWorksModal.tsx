/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Sliders, Calendar } from 'lucide-react';
import { BrandEmblem } from './BrandLogo';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-[#E8E3DA] space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE2]">
          <div className="flex items-center gap-2.5">
            <BrandEmblem sizePx={32} />
            <div>
              <h3 className="text-base font-bold text-[#1C2B22]">
                How Pocketwise Works
              </h3>
              <p className="text-xs text-[#5E7166]">
                Simple, stress-free money planning for Gen Z
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-[#F2EDE4] flex items-center justify-center text-[#5E7166]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-4 text-xs text-[#4A5D50]">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-[#133226] text-[#D4F478] font-bold text-xs flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <strong className="text-[#1C2B22] block mb-0.5 text-sm">Protected Essentials First</strong>
              Upcoming room share (₹3,000) and essential bills are segregated immediately so you never risk missing rent.
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-[#133226] text-[#D4F478] font-bold text-xs flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <strong className="text-[#1C2B22] block mb-0.5 text-sm">₹1,000 Emergency Shield</strong>
              We keep ₹1,000 off-limits from daily spending. If unexpected moments happen, you have an instant cushion.
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-[#133226] text-[#D4F478] font-bold text-xs flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <strong className="text-[#1C2B22] block mb-0.5 text-sm">Safe Daily Spending Number</strong>
              Whatever is left after essentials and your buffer is divided by your remaining days. Spend up to this number every day without checking your balance.
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-[#133226] text-[#D4F478] font-bold text-xs flex items-center justify-center shrink-0">
              4
            </div>
            <div>
              <strong className="text-[#1C2B22] block mb-0.5 text-sm">Preview Before Swiping</strong>
              Thinking of new sneakers or an OTT subscription? Move the simulator sliders first to see how it affects your daily allowance and savings goal before committing.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#F0EBE2] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-[#133226] text-[#D4F478] rounded-xl hover:bg-[#1C4233]"
          >
            Got it, let’s plan!
          </button>
        </div>
      </div>
    </div>
  );
};
