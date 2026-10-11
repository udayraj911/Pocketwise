/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';
import { LEGAL_CONFIG } from '../config/legalConfig';
import { recordUserConsent } from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
  onOpenPrivacyPage?: () => void;
  onOpenTermsPage?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'signup',
  onOpenPrivacyPage,
  onOpenTermsPage,
}) => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedConsent, setAcceptedConsent] = useState(false); // UNCHECKED by default
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

  const getCleanAuthError = (err: unknown): string => {
    if (err instanceof Error) {
      if (err.message.includes('auth/email-already-in-use')) {
        return 'An account already exists with this email address. Try signing in instead.';
      }
      if (err.message.includes('auth/invalid-credential') || err.message.includes('auth/wrong-password')) {
        return 'Invalid email or password. Please double-check and try again.';
      }
      if (err.message.includes('auth/user-not-found')) {
        return 'No account found with this email. Create a new account below.';
      }
      if (err.message.includes('auth/weak-password')) {
        return 'Password is too weak. Please use at least 6 characters.';
      }
      if (err.message.includes('auth/popup-closed-by-user')) {
        return 'Google sign-in popup was closed before completing.';
      }
      return err.message;
    }
    return 'Authentication failed. Please try again.';
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        await recordUserConsent(user.uid, LEGAL_CONFIG.privacyVersion, LEGAL_CONFIG.termsVersion);
      }
      onClose();
    } catch (err) {
      setErrorMsg(getCleanAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'signup' && !acceptedConsent) {
      setErrorMsg('You must agree to the Terms & Conditions and acknowledge the Privacy Policy to create an account.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const newUser = await registerWithEmail(email.trim(), password);
        if (newUser) {
          await recordUserConsent(newUser.uid, LEGAL_CONFIG.privacyVersion, LEGAL_CONFIG.termsVersion);
        }
        onClose();
      } else if (mode === 'login') {
        await loginWithEmail(email.trim(), password);
        onClose();
      } else if (mode === 'forgot') {
        await resetPassword(email.trim());
        setResetSent(true);
      }
    } catch (err) {
      setErrorMsg(getCleanAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#E8E3DA] space-y-5 animate-slideUp">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo variant="icon" size="default" />
            <div>
              <h3 className="text-lg font-bold text-[#1C2B22]">
                {mode === 'signup' ? 'Create Your Account' : mode === 'login' ? 'Welcome Back' : 'Reset Password'}
              </h3>
              <p className="text-xs text-[#5E7166]">
                Pocketwise Cloud Firestore secure persistence
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

        {/* Google 1-Click Sign-in */}
        {mode !== 'forgot' && (
          <div className="space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-[#D5CEC2] hover:bg-[#FAF8F5] text-[#1C2B22] font-semibold text-xs flex items-center justify-center gap-2.5 transition-colors shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 text-xs text-[#8B9B90]">
              <div className="flex-1 h-px bg-[#E8E3DA]" />
              <span>or with email</span>
              <div className="flex-1 h-px bg-[#E8E3DA]" />
            </div>
          </div>
        )}

        {/* Error message banner */}
        {errorMsg && (
          <div className="p-3 bg-[#FEE5D8] border border-[#FCD2BF] rounded-xl flex items-start gap-2 text-xs text-[#9A3412]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Reset email confirmation */}
        {resetSent && (
          <div className="p-3 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl flex items-start gap-2 text-xs text-[#1B5E20]">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Password reset link sent to <strong>{email}</strong>. Check your inbox!</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#5E7166] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8B9B90] absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-[#DDD7CD] focus:outline-none focus:ring-2 focus:ring-[#133226]"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#5E7166]">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-[#133226] font-medium hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8B9B90] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-[#DDD7CD] focus:outline-none focus:ring-2 focus:ring-[#133226]"
                />
              </div>
            </div>
          )}

          {/* REAL SIGN-UP CONSENT CHECKBOX */}
          {mode === 'signup' && (
            <div className="p-3 bg-[#FAF8F5] border border-[#E8E3DA] rounded-xl space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#2C3E35]">
                <input
                  type="checkbox"
                  checked={acceptedConsent}
                  onChange={(e) => setAcceptedConsent(e.target.checked)}
                  className="mt-0.5 rounded border-[#C2BAB0] text-[#122B1E] focus:ring-[#122B1E] shrink-0"
                />
                <span className="leading-snug">
                  I have read and agree to the{' '}
                  <button
                    type="button"
                    onClick={onOpenTermsPage}
                    className="font-bold text-[#122B1E] underline hover:text-[#22C55E]"
                  >
                    Terms & Conditions
                  </button>{' '}
                  and acknowledge the{' '}
                  <button
                    type="button"
                    onClick={onOpenPrivacyPage}
                    className="font-bold text-[#122B1E] underline hover:text-[#22C55E]"
                  >
                    Privacy Policy
                  </button>
                  .
                </span>
              </label>
              <p className="text-[10px] text-[#7A8C80] pl-6">
                Consent record (timestamp & policy versions) will be saved securely upon registration.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'signup' && !acceptedConsent)}
            className="w-full py-2.5 px-4 bg-[#133226] text-[#D4F478] rounded-xl font-bold text-xs hover:bg-[#1A4233] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <span>Processing...</span>
            ) : mode === 'signup' ? (
              <>
                <span>Create Free Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : mode === 'login' ? (
              <>
                <span>Sign In to Pocketwise</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <span>Send Reset Email</span>
            )}
          </button>
        </form>

        {/* Footer Legal Links */}
        <div className="pt-2 border-t border-[#E8E3DA] flex items-center justify-between text-[11px] text-[#5E7166]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPrivacyPage}
              className="hover:text-[#122B1E] underline"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={onOpenTermsPage}
              className="hover:text-[#122B1E] underline"
            >
              Terms & Conditions
            </button>
          </div>

          <div className="text-[10px] text-[#8B9B90]">
            v{LEGAL_CONFIG.privacyVersion}
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="text-center text-xs text-[#5E7166]">
          {mode === 'signup' ? (
            <div>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className="font-bold text-[#133226] hover:underline"
              >
                Sign in
              </button>
            </div>
          ) : mode === 'login' ? (
            <div>
              Need an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                }}
                className="font-bold text-[#133226] hover:underline"
              >
                Sign up free
              </button>
            </div>
          ) : (
            <div>
              Remembered your password?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className="font-bold text-[#133226] hover:underline"
              >
                Back to sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
