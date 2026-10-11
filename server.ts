/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

// Server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// System prompt for conversational financial onboarding
const ONBOARDING_SYSTEM_PROMPT = `You are "Sage", the encouraging, calm, highly competent AI financial onboarding coach for Pocketwise (a modern fintech budgeting app).
You are guiding the user through setting up their custom budget cycle.

CRITICAL RULES:
1. Ask ONE clear, focused question at a time. Never overwhelm the user with multiple questions or dense financial jargon.
2. Adapt each follow-up question directly to what the user said.
3. Be warm, non-judgmental, and reassuring. If they have low income or debt, normalize it and focus on clarity.
4. Support ANY positive amount or zero. DO NOT assume ₹10,000. Accept any valid currency (INR default, USD, EUR, etc.).
5. If the user provides multiple pieces of info in one reply, gracefully accept them, update the extracted data, and move to the next missing area.
6. Unknown fields must remain null rather than turning into zero.

Key areas to cover:
1. Expected income or available money for this plan period.
2. Planning cycle dates: Start date and end date (suggesting today or 1st of the month through month end).
3. Any expenses already paid in this period (e.g. phone recharge, grocery run).
4. Upcoming essential living expenses and due dates (rent/room share, utilities, Wi-Fi, EMIs).
5. Recurring subscriptions (streaming, gym, music) and whether any can be paused if needed.
6. Emergency cushion preference (suggesting a modest buffer like ₹1,000 or custom).
7. Savings goals (target amount and currently saved).

When you have collected income, cycle dates, essential commitments, emergency buffer, and savings goal (usually after 4 to 6 conversational turns), set "isReadyForReview" to true, and invite them to review their complete summary on the next screen.

You MUST respond in valid JSON format adhering to the schema:
{
  "message": "Your conversational response and next single question",
  "extractedData": {
    "monthlyIncome": number | null,
    "currency": string,
    "planStartDate": "YYYY-MM-DD" | null,
    "planEndDate": "YYYY-MM-DD" | null,
    "emergencyBuffer": number | null,
    "savingsGoalTarget": number | null,
    "savingsGoalCurrent": number | null,
    "commitments": [
      {
        "name": string,
        "category": "essential" | "subscription" | "flexible",
        "amount": number,
        "dueDate": "YYYY-MM-DD",
        "frequency": "once" | "weekly" | "monthly",
        "isPaid": boolean,
        "note": string
      }
    ],
    "expenses": [
      {
        "name": string,
        "amount": number,
        "date": "YYYY-MM-DD",
        "category": string,
        "essential": boolean
      }
    ]
  },
  "isReadyForReview": boolean,
  "confidenceScore": number
}`;

// 1. Conversational AI Onboarding endpoint
app.post('/api/coach/interview', async (req: Request, res: Response) => {
  try {
    const { history, currentExtracted, userMessage } = req.body;

    const todayStr = new Date().toISOString().split('T')[0];

    const contextPrompt = `Current System Date: ${todayStr}.
Current Extracted Profile State: ${JSON.stringify(currentExtracted || {})}
Recent Conversation History:
${(history || [])
  .map((m: { role: string; text: string }) => `${m.role.toUpperCase()}: ${m.text}`)
  .join('\n')}
USER: ${userMessage}

Process the user's latest reply. Merge any new data into the extracted state. Ask the next single logical question or wrap up for review if ready.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contextPrompt,
      config: {
        systemInstruction: ONBOARDING_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('Error in /api/coach/interview:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to consult financial coach',
    });
  }
});

// 2. Financial Coach Advice endpoint (with Search Grounding)
app.post('/api/coach/advise', async (req: Request, res: Response) => {
  try {
    const { prompt, planSummary } = req.body;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `User Budget Context: ${JSON.stringify(planSummary || {})}
Question: ${prompt}`,
      config: {
        systemInstruction:
          'You are Pocketwise Advisor, an objective, reassuring Gen Z financial mentor. Give concise, actionable advice in INR. Avoid generic fluff. Use realistic Indian consumer benchmarks when relevant.',
        tools: [{ googleSearch: {} }],
      },
    });

    res.json({
      success: true,
      advice: response.text,
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
    });
  } catch (error) {
    console.error('Error in /api/coach/advise:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate financial advice',
    });
  }
});

// PHASE 3 ENDPOINT 1: AI Comprehensive Analysis & Actionable Roadmap
app.post('/api/coach/analyze', async (req: Request, res: Response) => {
  try {
    const { engineResult, budget, commitments } = req.body;

    if (!engineResult) {
      return res.status(400).json({ success: false, error: 'Missing engine evaluation data' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const systemPrompt = `You are the Pocketwise AI Financial Coach — a calm, smart, non-judgmental financial strategist for Gen Z users managing money in India.
CRITICAL LAWS:
1. The financial engine output provided is the AUTHORITATIVE, DETERMINISTIC SOURCE OF TRUTH.
2. DO NOT invent, alter, or contradict the engine's numbers (Current cash: ₹${engineResult.currentCash}, Safe daily spend: ₹${engineResult.safeDailySpend || 0}, Unpaid bills: ₹${engineResult.unpaidCommitmentsTotal}, Flexible amount: ₹${engineResult.flexibleAmount}, Emergency buffer: ₹${engineResult.emergencyReserveAllocation}).
3. Explain the actual reality with empathy and practical clarity.
4. Generate a concrete, prioritized roadmap with 3-5 distinct actionable steps divided across three timeframes: 'immediate' (next 24-48 hours), 'mid_cycle' (this week / before upcoming bills), and 'end_of_cycle' (cycle completion).
5. Provide a realistic Indian personal finance benchmark (e.g. 50/30/20 guideline adaptation, urban living benchmarks, rainy day fund rules).

You MUST respond strictly with valid JSON conforming to this schema:
{
  "summary": "2-sentence executive summary of their current situation",
  "cashFlowStatus": "Short assessment of cash stability",
  "strengths": ["string", "string"],
  "vulnerabilities": ["string", "string"],
  "groundedBenchmark": "Realistic Indian consumer financial benchmark or rule of thumb",
  "roadmap": [
    {
      "id": "step-1",
      "priority": "high" | "medium" | "low",
      "title": "Short action title",
      "description": "Clear actionable instruction",
      "category": "bill_protection" | "daily_guardrails" | "savings_growth" | "subscription_pruning",
      "timeframe": "immediate" | "mid_cycle" | "end_of_cycle",
      "impactRupees": number,
      "isCompleted": false
    }
  ]
}`;

    const promptContext = `System Date: ${todayStr}
Engine Evaluation:
- Current Cash: ₹${engineResult.currentCash}
- Total Historical Spent: ₹${engineResult.totalHistoricalSpent}
- Safe Daily Spend: ₹${engineResult.safeDailySpend || 0}
- Days Remaining: ${engineResult.daysRemaining} of ${engineResult.totalPlanDays}
- Flexible Spending Available: ₹${engineResult.flexibleAmount}
- Unpaid Commitments: ₹${engineResult.unpaidCommitmentsTotal}
- Emergency Reserve Protected: ₹${engineResult.emergencyReserveAllocation}
- Savings Goal: Target ₹${engineResult.goalEvaluation?.target || 0}, Current ₹${engineResult.goalEvaluation?.currentSaved || 0}, Achievable: ${engineResult.goalEvaluation?.isAchievable ? 'YES' : 'NO'}
- Identified Risks: ${JSON.stringify(engineResult.risks || [])}
- Active Commitments: ${JSON.stringify((commitments || []).map((c: any) => ({ name: c.name, amount: c.amount, dueDate: c.dueDate, category: c.category, isPaid: c.isPaid, isPaused: c.isPaused })))}

Generate the financial analysis and prioritized actionable roadmap now.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptContext,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        success: true,
        data: {
          ...parsed,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (genError) {
      console.warn('Gemini generateContent error in /api/coach/analyze, falling back to deterministic synthesis:', genError);
      // Fallback deterministic synthesis strictly honoring engine data
      const isDeficit = engineResult.isFlexibleDeficit || engineResult.currentCash < 0;
      const fallbackAnalysis = {
        summary: isDeficit
          ? `Your plan currently has high cash demands exceeding your flexible pool. Prioritizing essential commitments and capping daily spend is critical.`
          : `You are currently on a stable trajectory with ₹${engineResult.currentCash.toLocaleString('en-IN')} available. Keeping daily spending near ₹${Math.round(engineResult.safeDailySpend || 0)} will safeguard your goals.`,
        cashFlowStatus: isDeficit ? 'Tight Cash Flow · Deficit Risk' : 'Balanced & Sustainable',
        strengths: [
          `Protected ₹${engineResult.emergencyReserveAllocation.toLocaleString('en-IN')} emergency reserve intact.`,
          `Remaining ₹${engineResult.currentCash.toLocaleString('en-IN')} in actual cash liquidity.`,
          engineResult.goalEvaluation?.isAchievable ? 'Rainy day savings goal is achievable with current plan.' : 'Active tracking of all upcoming obligations.',
        ],
        vulnerabilities: (engineResult.risks || []).map((r: any) => r.title).slice(0, 3).concat(
          engineResult.unpaidCommitmentsTotal > 0
            ? [`₹${engineResult.unpaidCommitmentsTotal.toLocaleString('en-IN')} in pending essential bills require cash protection.`]
            : []
        ).slice(0, 3),
        groundedBenchmark: 'In India, keeping at least 15-20% of your monthly allowance as an untouched emergency cushion protects against medical and transit surprises.',
        roadmap: [
          {
            id: 'fallback-step-1',
            priority: 'high',
            title: 'Protect Cash for Upcoming Essential Bills',
            description: `Ring-fence ₹${engineResult.unpaidCommitmentsTotal.toLocaleString('en-IN')} to ensure scheduled commitments clear without touching emergency funds.`,
            category: 'bill_protection',
            timeframe: 'immediate',
            impactRupees: engineResult.unpaidCommitmentsTotal,
            isCompleted: false,
          },
          {
            id: 'fallback-step-2',
            priority: 'medium',
            title: `Cap Discretionary Spending at ₹${Math.round(engineResult.safeDailySpend || 0)}/day`,
            description: `Stick to the calculated safe daily allowance for the remaining ${engineResult.daysRemaining} days to avoid premature cash depletion.`,
            category: 'daily_guardrails',
            timeframe: 'mid_cycle',
            impactRupees: Math.round(engineResult.safeDailySpend || 0),
            isCompleted: false,
          },
          {
            id: 'fallback-step-3',
            priority: 'medium',
            title: 'Audit & Pause Non-Essential Subscriptions',
            description: 'Temporarily pause flexible subscriptions to increase your daily spending buffer if cash tightens.',
            category: 'subscription_pruning',
            timeframe: 'mid_cycle',
            impactRupees: 250,
            isCompleted: false,
          },
          {
            id: 'fallback-step-4',
            priority: 'low',
            title: 'Lock In Rainy Day Savings Target',
            description: `Fulfill your ₹${(engineResult.goalEvaluation?.target || 2000).toLocaleString('en-IN')} savings goal before beginning the next budget cycle.`,
            category: 'savings_growth',
            timeframe: 'end_of_cycle',
            impactRupees: Math.max(0, (engineResult.goalEvaluation?.needed || 500)),
            isCompleted: false,
          },
        ],
        generatedAt: new Date().toISOString(),
      };

      return res.json({ success: true, data: fallbackAnalysis });
    }
  } catch (err) {
    console.error('Fatal error in /api/coach/analyze:', err);
    res.status(500).json({ success: false, error: 'Internal error generating financial roadmap' });
  }
});

// PHASE 3 ENDPOINT 2: AI Scenario Simulation Evaluation
app.post('/api/coach/simulate', async (req: Request, res: Response) => {
  try {
    const { simulation, baseline, simulated } = req.body;

    if (!baseline || !simulated) {
      return res.status(400).json({ success: false, error: 'Missing baseline or simulated engine data' });
    }

    const costOneTime = simulation?.oneTimePurchase || 0;
    const costSub = simulation?.weeklySubscription || 0;
    const costUnexpected = simulation?.unexpectedExpense || 0;
    const totalSimSpend = costOneTime + costUnexpected + costSub * Math.ceil(baseline.daysRemaining / 7);

    const deltaDaily = (simulated.safeDailySpend || 0) - (baseline.safeDailySpend || 0);
    const deltaCash = simulated.remainingBalance - baseline.remainingBalance;

    const systemPrompt = `You are the Pocketwise Scenario Evaluator.
Your role is to assess the consequence of a simulated purchase or expense before the user commits it.
The user is considering:
- One-time spend: ₹${costOneTime} (${simulation?.oneTimeTitle || 'Unlabeled'})
- Weekly recurring subscription: ₹${costSub}/wk (${simulation?.weeklySubscriptionTitle || 'Unlabeled'})
- Unexpected cost: ₹${costUnexpected} (${simulation?.unexpectedTitle || 'Unlabeled'})
- Total impact over cycle: ₹${totalSimSpend}

Deterministic Engine Impact:
- Remaining Balance drops by ₹${Math.abs(deltaCash)} (from ₹${baseline.remainingBalance} to ₹${simulated.remainingBalance})
- Safe Daily Allowance drops by ₹${Math.abs(Math.round(deltaDaily))}/day (from ₹${Math.round(baseline.safeDailySpend || 0)}/day to ₹${Math.round(simulated.safeDailySpend || 0)}/day)
- Goal Achievable: Before=${baseline.savingsAchievable ? 'YES' : 'NO'}, After=${simulated.savingsAchievable ? 'YES' : 'NO'}
- Risk Level: Before=${baseline.riskLevel}, After=${simulated.riskLevel}

Respond with valid JSON:
{
  "verdict": "safe" | "caution" | "high_risk",
  "verdictHeadline": "Punchy 5-8 word verdict headline",
  "impactSummary": "2-3 sentences explaining the domino effect on daily spending and bills",
  "tradeOffAdvice": "Clear trade-off advice on what to adjust or reduce to accommodate this",
  "alternatives": ["Concrete alternative 1", "Concrete alternative 2"]
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: 'Evaluate this scenario and provide the JSON assessment.',
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        success: true,
        data: {
          ...parsed,
          evaluatedAt: new Date().toISOString(),
        },
      });
    } catch (aiErr) {
      console.warn('Gemini error in /api/coach/simulate, using deterministic evaluation:', aiErr);
      const isHighRisk = simulated.riskLevel === 'high' || simulated.remainingBalance < 0 || simulated.safeDailySpend === 0;
      const isCaution = simulated.riskLevel === 'moderate' || deltaDaily < -50 || !simulated.savingsAchievable;

      const fallbackVerdict = isHighRisk ? 'high_risk' : isCaution ? 'caution' : 'safe';
      const fallbackHeadline = isHighRisk
        ? 'High Deficit Risk · Postpone or Reduce'
        : isCaution
        ? `Proceed with Caution · Shrinks Daily Pool by ₹${Math.abs(Math.round(deltaDaily))}/day`
        : 'Affordable Decision · Fits Current Plan';

      return res.json({
        success: true,
        data: {
          verdict: fallbackVerdict,
          verdictHeadline: fallbackHeadline,
          impactSummary: `Spending ₹${totalSimSpend.toLocaleString('en-IN')} reduces your safe daily allowance from ₹${Math.round(baseline.safeDailySpend || 0)} to ₹${Math.round(simulated.safeDailySpend || 0)} across the remaining ${baseline.daysRemaining} days.`,
          tradeOffAdvice: isHighRisk
            ? 'Committing this now will breach your essential commitments or emergency reserve. Delay until after bills clear.'
            : `To offset this ₹${totalSimSpend.toLocaleString('en-IN')} purchase, avoid non-essential dining or pause a flexible weekly subscription.`,
          alternatives: [
            'Wait until the start of the next budget cycle when your income refreshes.',
            'Look for a lower-cost alternative or secondhand option.',
            'Pause one recurring entertainment subscription to free up cash headroom.',
          ],
          evaluatedAt: new Date().toISOString(),
        },
      });
    }
  } catch (err) {
    console.error('Fatal error in /api/coach/simulate:', err);
    res.status(500).json({ success: false, error: 'Failed to evaluate financial scenario' });
  }
});

// PHASE 3 ENDPOINT 3: AI Conversational Coach Chat
app.post('/api/coach/chat', async (req: Request, res: Response) => {
  try {
    const { userMessage, history, engineResult, budget } = req.body;

    if (!userMessage) {
      return res.status(400).json({ success: false, error: 'User message is required' });
    }

    const contextText = `User Current Financial Status (Authoritative Deterministic Metrics):
- Available Cash: ₹${engineResult?.currentCash ?? budget?.currentCash ?? 0}
- Safe Daily Spend: ₹${Math.round(engineResult?.safeDailySpend || 0)}
- Days Remaining: ${engineResult?.daysRemaining ?? budget?.totalDays ?? 30} days
- Unpaid Essential Commitments: ₹${engineResult?.unpaidCommitmentsTotal ?? 0}
- Protected Emergency Buffer: ₹${engineResult?.emergencyReserveAllocation ?? budget?.emergencyBuffer ?? 0}
- Flexible Spending Available: ₹${engineResult?.flexibleAmount ?? 0}
- Savings Goal Target: ₹${budget?.savingsGoalTarget ?? 2000} (Saved: ₹${budget?.savingsGoalCurrent ?? 0})
- Active Risk Flags: ${JSON.stringify(engineResult?.risks?.map((r: any) => r.title) || [])}

Recent Conversation:
${(history || []).slice(-6).map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

User Question: ${userMessage}`;

    const systemInstruction = `You are Sage, the Pocketwise AI Financial Coach.
You are talking directly to a Gen Z user in India.
GUIDELINES:
- Be clear, practical, calm, and encouraging. Never shame the user or use confusing jargon.
- Always quote the EXACT numbers provided in the context. Never hallucinate conflicting balances or expenses.
- Give short, punchy paragraphs (2-4 sentences max per paragraph).
- Provide practical consumer wisdom (e.g. UPI budgeting, street food vs swiggy, shared rent realities, pauseable subscriptions).
- Keep total response under 150 words unless specifically asked for a deep breakdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contextText,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        temperature: 0.6,
      },
    });

    const candidate = response.candidates?.[0];
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
    const groundingSources = groundingChunks
      .map((c: any) => ({
        title: c.web?.title || 'Financial Reference',
        url: c.web?.uri || '',
      }))
      .filter((s: any) => s.url);

    res.json({
      success: true,
      data: {
        role: 'assistant',
        content: response.text || 'I analyzed your budget numbers. Everything looks consistent with your financial engine.',
        timestamp: new Date().toISOString(),
        groundingSources: groundingSources.slice(0, 3),
      },
    });
  } catch (error) {
    console.error('Error in /api/coach/chat:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Coach is currently unavailable',
    });
  }
});

// ==========================================
// PHASE 5: REAL-TIME VOICE AI ASSISTANT ENDPOINT
// ==========================================
app.post('/api/voice/process', async (req: Request, res: Response) => {
  try {
    const {
      speechTranscript,
      conversationHistory,
      engineResult,
      budget,
      commitments,
      currentClock, // { isoDate, timeString, weekday, dayOfMonth, monthName, year, timezone }
    } = req.body;

    if (!speechTranscript || typeof speechTranscript !== 'string') {
      return res.status(400).json({ success: false, error: 'Speech transcript is required' });
    }

    const trimmedInput = speechTranscript.trim();
    const systemDate = currentClock?.isoDate || new Date().toISOString().split('T')[0];
    const systemTimezone = currentClock?.timezone || 'Asia/Kolkata';

    // Build authoritative financial context for Gemini
    const safeDaily = Math.round(engineResult?.safeDailySpend ?? 0);
    const availableCash = engineResult?.currentCash ?? budget?.currentCash ?? 0;
    const unpaidBills = engineResult?.unpaidCommitmentsTotal ?? 0;
    const emergencyBuffer = engineResult?.emergencyReserveAllocation ?? budget?.emergencyBuffer ?? 0;
    const flexibleAmount = engineResult?.flexibleAmount ?? 0;
    const daysRemaining = engineResult?.daysRemaining ?? budget?.totalDays ?? 30;
    const goalTarget = budget?.savingsGoalTarget ?? 0;
    const goalCurrent = budget?.savingsGoalCurrent ?? 0;

    const systemPrompt = `You are the Pocketwise Real-Time Voice Financial Assistant for a Gen Z user in India.
Current System Clock: ${systemDate} (${currentClock?.weekday || ''}, ${currentClock?.monthName || ''} ${currentClock?.year || ''}) [Timezone: ${systemTimezone}].

CRITICAL MANDATES & CONSTRAINTS:
1. AUTHORITATIVE TRUTH: Use the exact deterministic calculations provided below. NEVER invent, guess, or contradict balances.
   - Available Liquid Cash: ₹${availableCash}
   - Safe Daily Spend: ₹${safeDaily}/day
   - Days Remaining in Plan: ${daysRemaining}
   - Unpaid Essential Bills: ₹${unpaidBills}
   - Protected Emergency Buffer: ₹${emergencyBuffer}
   - Flexible Spending Pool: ₹${flexibleAmount}
   - Savings Goal Target: ₹${goalTarget} (Current: ₹${goalCurrent})
   - Active Commitments: ${JSON.stringify((commitments || []).map((c: any) => ({ name: c.name, amount: c.amount, dueDate: c.dueDate, isPaid: c.isPaid })))}

2. VOICE CONVERSATIONAL TONE:
   - "spokenText": Designed specifically for text-to-speech. Natural, concise, empathetic, warm, easy to listen to (1 to 3 short sentences max). Avoid emojis or complex symbols in spokenText.
   - "displayText": Clear, readable text shown in the transcript UI with proper formatting (e.g., ₹ symbols, bullet points if helpful).

3. DATE AWARENESS & RELATIVE DATES:
   - "today" = ${systemDate}
   - Resolve relative dates ("tomorrow", "next Monday", "end of this month") into exact ISO YYYY-MM-DD dates using the current system date (${systemDate}).

4. FINANCIAL ACTIONS & SAFETY SAFEGUARDS:
   - If the user explicitly asks to add, record, change, or plan a financial record (e.g. "I spent ₹450 on lunch", "Add ₹5000 freelance income", "Add bill for electricity ₹1200 due next week", "Change my savings goal to ₹5000"):
     Extract the intended action into a structured "proposedAction" object.
     Set "requiresConfirmation": true.
     The assistant MUST ask for confirmation in spokenText (e.g., "I've drafted an expense of ₹450 for lunch on today's date. Shall I save this to your records?").
   - If information is missing or ambiguous (e.g., "I spent money on coffee" without an amount):
     DO NOT guess or invent an amount! Ask a follow-up question in spokenText and set proposedAction to null.
   - If the request is merely informational or hypothetical (e.g., "Can I afford headphones?", "How much can I spend today?", "What bills are due?"):
     Directly answer using the engine numbers and set proposedAction to null.

5. JSON RESPONSE SCHEMA (Respond ONLY with valid JSON):
{
  "spokenText": "Short natural spoken response for TTS",
  "displayText": "Readable display message for UI",
  "followUpQuestion": null | "string if details were missing",
  "proposedAction": null | {
    "actionType": "add_expense" | "record_income" | "add_bill" | "adjust_savings_goal" | "set_emergency_buffer",
    "title": "Short title (e.g. Lunch with friends)",
    "description": "Clear human-readable summary of proposed change",
    "amount": number,
    "category": "needs" | "wants" | "income" | "savings" | "debt" | "emergency" | "custom",
    "customCategory": "optional custom category string",
    "date": "YYYY-MM-DD",
    "dueDate": "YYYY-MM-DD if bill",
    "isPaid": boolean,
    "notes": "optional notes",
    "targetGoalAmount": number,
    "requiresConfirmation": true
  }
}`;

    const conversationContext = (conversationHistory || [])
      .slice(-6)
      .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const promptMessage = `Active Conversation History:
${conversationContext || 'None (New Voice Session)'}

User Just Said: "${trimmedInput}"`;

    try {
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptMessage,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const parsed = JSON.parse(aiResponse.text || '{}');

      // Sanitize proposed action if present
      let proposedAction = parsed.proposedAction || null;
      if (proposedAction && proposedAction.actionType) {
        proposedAction.id = `action-${Date.now()}`;
        proposedAction.status = 'pending_confirmation';
        proposedAction.requiresConfirmation = true;
        // Ensure date is resolved
        if (!proposedAction.date) {
          proposedAction.date = systemDate;
        }
      }

      return res.json({
        success: true,
        data: {
          spokenText: parsed.spokenText || parsed.displayText || 'I understood your request.',
          displayText: parsed.displayText || parsed.spokenText || 'I processed your request.',
          proposedAction,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (modelError) {
      console.warn('Gemini error in /api/voice/process, falling back to deterministic voice assistant rule engine:', modelError);

      // Deterministic Voice Rule Engine Fallback
      const lower = trimmedInput.toLowerCase();
      let spoken = '';
      let display = '';
      let action: any = null;

      if (lower.includes('safe') || lower.includes('spend today') || lower.includes('daily spend')) {
        spoken = `You can safely spend up to ${safeDaily} rupees today. You have ${availableCash} rupees in available cash.`;
        display = `Your safe daily spending allowance is ₹${safeDaily} for today. Total available cash is ₹${availableCash.toLocaleString('en-IN')}.`;
      } else if (lower.includes('afford') || lower.includes('can i buy')) {
        // Extract amount if present
        const match = lower.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*)/);
        const requestedAmount = match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
        if (requestedAmount > 0) {
          if (requestedAmount <= safeDaily) {
            spoken = `Yes, you can comfortably afford ${requestedAmount} rupees today within your daily allowance of ${safeDaily} rupees.`;
            display = `Yes! At ₹${requestedAmount}, this comfortably fits within your ₹${safeDaily} safe daily spend for today without compromising your plan.`;
          } else if (requestedAmount <= flexibleAmount) {
            spoken = `You can afford ${requestedAmount} rupees from your flexible pool, but it is higher than your ${safeDaily} rupees daily rate.`;
            display = `At ₹${requestedAmount}, this exceeds today's ₹${safeDaily} daily rate, but fits in your overall flexible pool (₹${flexibleAmount}). It will reduce your remaining daily allowance.`;
          } else {
            spoken = `Spending ${requestedAmount} rupees would put your budget in deficit or breach your unpaid bills. I recommend holding off.`;
            display = `Caution: Spending ₹${requestedAmount} exceeds your available flexible pool (₹${flexibleAmount}) and would threaten your ₹${unpaidBills} in pending bills.`;
          }
        } else {
          spoken = `How much does the item cost? Please tell me the amount so I can check your affordability.`;
          display = `How much does the item cost? Mention the price and I'll calculate whether it fits your safe daily spend and flexible pool.`;
        }
      } else if (lower.includes('spent') || lower.includes('expense') || lower.includes('bought') || lower.includes('paid')) {
        const match = lower.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*)/);
        const amount = match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
        if (amount > 0) {
          spoken = `I understood an expense of ${amount} rupees. Shall I record this in your expenses?`;
          display = `I've prepared an expense of ₹${amount.toLocaleString('en-IN')}. Please confirm below to add it to your transaction ledger.`;
          action = {
            id: `action-${Date.now()}`,
            actionType: 'add_expense',
            title: trimmedInput.slice(0, 30),
            description: `Record expense of ₹${amount} on ${systemDate}`,
            amount,
            category: lower.includes('food') || lower.includes('grocer') || lower.includes('rent') ? 'needs' : 'wants',
            date: systemDate,
            isPaid: true,
            status: 'pending_confirmation',
            requiresConfirmation: true,
          };
        } else {
          spoken = `I heard you made an expense, but couldn't detect the amount. How many rupees did you spend?`;
          display = `I noticed you want to log an expense, but couldn't catch the amount. How much did you spend?`;
        }
      } else if (lower.includes('received') || lower.includes('income') || lower.includes('salary') || lower.includes('freelance')) {
        const match = lower.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*)/);
        const amount = match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
        if (amount > 0) {
          spoken = `I understood an income inflow of ${amount} rupees. Would you like me to record this?`;
          display = `I've prepared an inflow of ₹${amount.toLocaleString('en-IN')}. Please confirm to record this income.`;
          action = {
            id: `action-${Date.now()}`,
            actionType: 'record_income',
            title: 'Income Inflow',
            description: `Record income inflow of ₹${amount}`,
            amount,
            category: 'income',
            date: systemDate,
            isPaid: true,
            status: 'pending_confirmation',
            requiresConfirmation: true,
          };
        } else {
          spoken = `How much income did you receive? Please state the amount in rupees.`;
          display = `How much income did you receive? Please specify the amount so I can log it.`;
        }
      } else if (lower.includes('bill') || lower.includes('due') || lower.includes('unpaid')) {
        spoken = `You have ${unpaidBills} rupees in upcoming unpaid essential bills.`;
        display = `You currently have ₹${unpaidBills.toLocaleString('en-IN')} in pending essential bills scheduled before the end of this cycle.`;
      } else {
        spoken = `You have ${availableCash} rupees available with a safe daily rate of ${safeDaily} rupees across ${daysRemaining} remaining days.`;
        display = `Summary: Available Cash ₹${availableCash.toLocaleString('en-IN')} · Safe Daily Spend ₹${safeDaily}/day · ${daysRemaining} days left in cycle.`;
      }

      return res.json({
        success: true,
        data: {
          spokenText: spoken,
          displayText: display,
          proposedAction: action,
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('Fatal error in /api/voice/process:', error);
    res.status(500).json({ success: false, error: 'Voice processing failed' });
  }
});

// 3. System time & health endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    systemTime: new Date().toISOString(),
    timezone: 'Asia/Kolkata',
  });
});


// Setup Vite middleware in dev or static serving in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Pocketwise server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
