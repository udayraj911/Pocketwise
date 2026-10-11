/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const LEGAL_CONFIG = {
  privacyVersion: '1.0.0',
  termsVersion: '1.0.0',
  effectiveDate: 'October 11, 2026',
  lastUpdated: 'October 11, 2026',
  entityName: 'Pocketwise Technologies',
  appName: 'Pocketwise',
  supportEmail: 'support@pocketwise.app',
  privacyEmail: 'privacy@pocketwise.app',
  grievanceEmail: 'grievance@pocketwise.app',
  governingLaw: 'Laws of India (including Digital Personal Data Protection Act, 2023)',
  jurisdiction: 'Bengaluru, Karnataka, India',
  grievanceOfficer: {
    name: 'Grievance Officer',
    title: 'Data Protection & Compliance Officer',
    email: 'grievance@pocketwise.app',
    address: 'Pocketwise Tech, Innovation Hub, Outer Ring Road, Bengaluru, Karnataka 560103, India',
  },
  thirdPartyServices: [
    {
      name: 'Google Firebase Authentication & Cloud Firestore',
      purpose: 'User authentication, identity verification, and persistent real-time cloud data storage',
      privacyPolicyUrl: 'https://firebase.google.com/support/privacy',
    },
    {
      name: 'Google Gemini API / Generative AI',
      purpose: 'AI financial coach explanations, scenario simulation analysis, and expense categorization',
      privacyPolicyUrl: 'https://policies.google.com/privacy',
    },
    {
      name: 'Web Speech API',
      purpose: 'Client-side voice input transcription for hands-free financial voice assistant',
      privacyPolicyUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API',
    },
  ],
};
