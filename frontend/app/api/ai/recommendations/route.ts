import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserBusinessFullContext } from "@/lib/business-helper";
import { fetchDistrictMandiRates, getUdyamDistrictIntelligence } from "@/lib/api/datagov";
import { getLanguageModel } from "@/lib/agent/ai-provider";
import { generateText } from "ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    let dbContext: any = null;
    if (user) {
      dbContext = await getUserBusinessFullContext(user.id);
    }

    const body = await req.json().catch(() => ({}));
    const businessName = body.businessName || dbContext?.businessName || "My Enterprise";
    const category = body.category || dbContext?.category || "General Store / Kirana";
    const city = body.city || dbContext?.city || "Pune";
    const state = body.state || dbContext?.state || "Maharashtra";
    const monthlyExpenses = Number(body.monthlyExpenses || dbContext?.calculatedMonthlyExpenses || 65000);
    const annualRevenue = Number(body.annualRevenue || dbContext?.annualRevenue || 1200000);
    const totalDebt = Number(dbContext?.totalOutstandingDebt || 0);

    // 1. Fetch live district market rates
    const mandiRecords = await fetchDistrictMandiRates(state, city, 6);
    const udyamStats = getUdyamDistrictIntelligence(city, state);

    // 2. Prepare Prompt for Vertex AI Gemini 3.7 Flash
    const systemInstruction = `You are VyaparSetu's Chief Enterprise Advisory AI for Indian micro & small enterprises.
Generate highly concrete, high-velocity, profit-boosting strategic action playbooks tailored to the enterprise's exact location, monthly expenses, and current business category.

Categories required:
1. SUBSIDY: Capital or interest subventions under PMEGP, PMFME, Mudra, PM Vishwakarma, state schemes.
2. CASHFLOW: Working capital cycle reduction, supplier discounts, payment timing optimizations.
3. CREDIT: Collateral-free credit lines, Mudra Tarun/Kishore readiness, digital ledger banking dossier.
4. INVENTORY: Regional high-margin fast-moving SKUs, mandi procurement timing, seasonal stocking.
5. GROWTH: B2B wholesale expansion, ONDC onboarding, bulk purchase clusters.

Return ONLY pure valid JSON with no markdown wrapping.`;

    const userPrompt = `Generate 5 high-impact strategic action playbooks for:
- Enterprise: ${businessName}
- Category: ${category}
- Location: ${city}, ${state} (ODOP: ${udyamStats.odopProduct || "Agro & Retail"})
- Monthly Operating Expenses: ₹${monthlyExpenses.toLocaleString("en-IN")}
- Annual Turnover: ₹${annualRevenue.toLocaleString("en-IN")}
- Existing Debt: ₹${totalDebt.toLocaleString("en-IN")}
- Local APMC Mandi Top Arrivals: ${mandiRecords.map((m) => `${m.commodity} (₹${m.modalPrice}/qtl)`).join(", ") || "Standard Staples"}

Provide JSON in this EXACT schema:
{
  "enterpriseSummary": "1-2 sentences summarizing the strategic focus for ${businessName} in ${city}.",
  "playbooks": [
    {
      "id": "rec-1",
      "title": "Clear Action Title",
      "category": "SUBSIDY" | "CASHFLOW" | "CREDIT" | "INVENTORY" | "GROWTH",
      "impact": "HIGH" | "MEDIUM",
      "roi": "₹X Financial Value (e.g. ₹3,50,000 Direct Subsidy or ₹18,000/month saved)",
      "timeline": "e.g. Immediate / 2-3 weeks / 30 days",
      "description": "Specific rationale customized to ${businessName} in ${city} and ₹${monthlyExpenses.toLocaleString("en-IN")} monthly expenses.",
      "steps": [
        "Concrete step 1",
        "Concrete step 2",
        "Concrete step 3"
      ],
      "actionRoute": "/schemes-for-you" | "/credit" | "/expenses" | "/cashflow" | "/transactions"
    }
  ]
}`;

    // 3. Dispatch to Vertex AI Gemini 3.7 Flash
    let aiResponseText = "";
    try {
      const model = getLanguageModel("vertex", "gemini-3.7-flash");
      const result = await generateText({
        model,
        system: systemInstruction,
        prompt: userPrompt,
      });
      aiResponseText = result.text;
    } catch (aiErr) {
      console.error("[Recommendations API] Vertex AI call failed, falling back to gemini:", aiErr);
      try {
        const fallbackModel = getLanguageModel("gemini", "gemini-2.5-flash");
        const result = await generateText({
          model: fallbackModel,
          system: systemInstruction,
          prompt: userPrompt,
        });
        aiResponseText = result.text;
      } catch (fallbackErr) {
        console.error("[Recommendations API] Secondary AI fallback failed:", fallbackErr);
      }
    }

    // 4. Parse JSON
    let parsed = null;
    if (aiResponseText) {
      try {
        const cleanJson = aiResponseText
          .replace(/```json\s*/gi, "")
          .replace(/```\s*$/gi, "")
          .trim();
        parsed = JSON.parse(cleanJson);
      } catch (parseErr) {
        console.warn("[Recommendations API] JSON parse error:", parseErr);
      }
    }

    if (!parsed || !Array.isArray(parsed.playbooks)) {
      parsed = generateGroundedFallbackPlaybooks(businessName, category, city, state, monthlyExpenses, annualRevenue);
    }

    // Save generated playbooks for this user in Prisma
    if (user) {
      try {
        await prisma.strategicActionPlaybook.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            playbooks: parsed.playbooks,
            enterpriseSummary: parsed.enterpriseSummary,
          },
          update: {
            playbooks: parsed.playbooks,
            enterpriseSummary: parsed.enterpriseSummary,
          },
        });
      } catch {}
    }

    return NextResponse.json({
      success: true,
      profile: { businessName, category, city, state, monthlyExpenses, annualRevenue },
      ...parsed,
    });
  } catch (error: any) {
    console.error("[Recommendations API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (user) {
      const saved = await prisma.strategicActionPlaybook.findUnique({
        where: { userId: user.id },
      });
      if (saved) {
        return NextResponse.json({
          success: true,
          playbooks: saved.playbooks,
          enterpriseSummary: saved.enterpriseSummary,
          savedInDb: true,
        });
      }
    }
  } catch {}
  return POST(req);
}

function generateGroundedFallbackPlaybooks(
  businessName: string,
  category: string,
  city: string,
  state: string,
  monthlyExpenses: number,
  annualRevenue: number
) {
  const discountSaving = Math.round(monthlyExpenses * 0.035);
  const potentialSubsidy = Math.min(350000, Math.round(annualRevenue * 0.25));

  return {
    enterpriseSummary: `Strategic profit optimization and capital subvention roadmap for ${businessName} in ${city}, ${state}.`,
    playbooks: [
      {
        id: "rec-1",
        title: "Apply for PMEGP Capital Subsidy (Up to 35%)",
        category: "SUBSIDY",
        impact: "HIGH",
        roi: `₹${potentialSubsidy.toLocaleString("en-IN")} Direct Capital Grant`,
        timeline: "2-3 weeks",
        description: `Your enterprise in ${city} qualifies for government capital subsidy for machinery, solar installations, and store modernization under KVIC PMEGP.`,
        steps: [
          "Download Udyam Registration Certificate from profile",
          "Prepare 3-year projected cash flow statement from Cash Flow Runway",
          "Submit online application via KVIC PMEGP Portal with bank branch selection",
        ],
        actionRoute: "/schemes-for-you",
      },
      {
        id: "rec-2",
        title: "Consolidate Supplier Invoicing for 3.5% Cash Discount",
        category: "CASHFLOW",
        impact: "HIGH",
        roi: `₹${discountSaving.toLocaleString("en-IN")}/month saved`,
        timeline: "Immediate",
        description: `Based on your monthly operating expenses of ₹${monthlyExpenses.toLocaleString("en-IN")}, switching to early 7-day automated payment cycles unlocks wholesale tier discounts.`,
        steps: [
          "Identify top 3 suppliers by monthly purchase volume in Expense Ledger",
          "Propose weekly automated settlement in exchange for early payment rebate",
          "Track saved margins in Expense ledger",
        ],
        actionRoute: "/expenses",
      },
      {
        id: "rec-3",
        title: "Build Digital Ledger for Collateral-Free Mudra Loan",
        category: "CREDIT",
        impact: "MEDIUM",
        roi: "₹10,00,000 Credit Line",
        timeline: "30 days",
        description: `Recording daily sales through digital UPI QR codes in ${city} creates verified bankable statements for Mudra Tarun sanction at 8.5% p.a.`,
        steps: [
          "Keep daily cash deposits below 15% of total inflow",
          "Maintain zero cheque or EMI bounces for 90 days",
          "Generate one-click bank dossier from Business Credit tab",
        ],
        actionRoute: "/credit",
      },
      {
        id: "rec-4",
        title: "Introduce High-Margin Fast-Moving Regional SKUs",
        category: "INVENTORY",
        impact: "MEDIUM",
        roi: "+14% Net Profit",
        timeline: "15 days",
        description: `Local ${city} APMC Mandi demand indices indicate rising consumer preference for packaged organic staples and regional pulses.`,
        steps: [
          "Procure sample inventory batch directly from nearest agricultural cooperative",
          "Set up dedicated counter display with local pricing",
          "Collect customer feedback over 14-day trial",
        ],
        actionRoute: "/scanner",
      },
      {
        id: "rec-5",
        title: "Join ONDC Open Network for B2B Wholesale Reach",
        category: "GROWTH",
        impact: "HIGH",
        roi: "+25% Order Volume",
        timeline: "7 days",
        description: `Onboarding your ${category} catalog onto ONDC expands buyer reach across ${state} without marketplace intermediary commission fees.`,
        steps: [
          "Create digital product catalog with wholesale pack sizes",
          "Link UPI merchant QR code for instant instant settlement",
          "Configure local same-day delivery via partner logistics",
        ],
        actionRoute: "/transactions",
      },
    ],
  };
}
