/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrandLogo } from './BrandLogo';
import { ShieldCheck } from 'lucide-react';

interface FooterProps {
  onReset: () => void;
  onOpenPrivacyPage: () => void;
  onOpenTermsPage: () => void;
  onOpenPrivacyControls?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onReset,
  onOpenPrivacyPage,
  onOpenTermsPage,
  onOpenPrivacyControls,
}) => {
  return (
    <footer className="w-full border-t border-[#E8E3DA] mt-16 py-8 px-4 text-center text-xs text-[#5E7166]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Mission */}
        <div className="flex items-center gap-3">
          <BrandLogo variant="full" size="compact" showTagline={true} />
        </div>

        {/* Required Legal Links */}
        <div className="flex items-center gap-3 text-xs font-medium text-[#5E7166]">
          <button
            onClick={onOpenPrivacyPage}
            className="hover:text-[#122B1E] hover:underline transition-colors"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button
            onClick={onOpenTermsPage}
            className="hover:text-[#122B1E] hover:underline transition-colors"
          >
            Terms & Conditions
          </button>
          {onOpenPrivacyControls && (
            <>
              <span>•</span>
              <button
                onClick={onOpenPrivacyControls}
                className="hover:text-[#122B1E] hover:underline transition-colors flex items-center gap-1 text-[#22C55E]"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Privacy & Data Rights</span>
              </button>
            </>
          )}
        </div>

        {/* Actions & Disclaimer */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[#7A8C80]">Informational aid only · Not financial advice</span>
          <span>·</span>
          <button
            onClick={onReset}
            className="hover:text-[#133226] hover:underline transition-colors text-[#5E7166]"
          >
            Reset state
          </button>
        </div>
      </div>
    </footer>
  );
};
