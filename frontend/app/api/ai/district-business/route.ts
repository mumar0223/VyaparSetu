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
    const state = body.state || dbContext?.state || "Maharashtra";
    const district = body.district || dbContext?.city || "Pune";
    const budget = Number(body.budget || dbContext?.totalSavedLiquidity || 200000);
    const category = body.category || dbContext?.category || "Any / High Growth";
    const riskLevel = body.riskLevel || "Moderate";

    // 1. Fetch real-time Mandi market rates from data.gov.in
    const mandiRecords = await fetchDistrictMandiRates(state, district, 10);

    // 2. Fetch UDYAM MSME District Intelligence & ODOP data
    const udyamStats = getUdyamDistrictIntelligence(district, state);

    // 3. Prepare Prompt for Google Vertex AI Gemini 3.7 Flash
    const mandiDataSummary = mandiRecords.length > 0
      ? mandiRecords
          .map(
            (r) =>
              `- ${r.commodity} (${r.variety || "Local"}): Modal Price ₹${r.modalPrice}/qtl (Min: ₹${r.minPrice}, Max: ₹${r.maxPrice}) at ${r.market}`
          )
          .join("\n")
      : "Standard agricultural staples and regional cash crops available in local APMC.";

    const systemInstruction = `You are VyaparSetu's Chief District Economic AI Strategist and Indian MSME Venture Predictor.
You analyze real-time agricultural mandi commodity rates (from data.gov.in), UDYAM MSME registration density, One District One Product (ODOP) focus, and user capital budget to predict the absolute best-suited micro/small businesses for a given Indian district.

Your advice MUST be:
- Deeply grounded in the actual district economy, raw materials, wholesale APMC price spreads, and local trade logistics.
- Realistic about startup CAPEX and monthly OPEX vs realistic margins.
- Directly aligned with Indian Government Subsidies (PMEGP 25-35% capital subsidy, PMFME 35% food micro-enterprise subsidy, Mudra Shishu/Kishor/Tarun collateral-free loans, PM Vishwakarma, NABARD).
- Structured strictly as valid JSON with no markdown wrapping or conversational commentary.`;

    const userPrompt = `Predict the top 4 best business opportunities in ${district} District, ${state} for an entrepreneur with a capital budget of ₹${budget.toLocaleString("en-IN")}.

LIVE DISTRICT MARKET GROUND-TRUTH (from data.gov.in / Agmarknet):
${mandiDataSummary}

UDYAM MSME DISTRICT PROFILE & DENSITY:
- ODOP Product: ${udyamStats.odopProduct || "Local Agricultural Produce"}
- Sector Saturation: ${udyamStats.topSectors.map((s) => `${s.sector} (${s.saturationLevel} Saturation)`).join(", ")}
- High Potential Gap: ${udyamStats.highPotentialGap}

ENTREPRENEUR PROFILE:
- District & State: ${district}, ${state}
- Total Available Capital Budget: ₹${budget.toLocaleString("en-IN")}
- Target Sector / Preference: ${category}
- Risk Appetite: ${riskLevel}
${dbContext ? `- Existing Monthly Expenses: ₹${dbContext.calculatedMonthlyExpenses?.toLocaleString("en-IN")}` : ""}

Provide a detailed JSON response matching this EXACT schema:
{
  "districtSummary": "2-3 sentences explaining ${district}'s economic DNA, supply chain strengths, and why it offers high ROI for this budget.",
  "liveMandiInsight": "1-2 sentences summarizing how the live data.gov.in Mandi prices create margin opportunities in ${district}.",
  "udyamInsight": "1-2 sentences summarizing UDYAM registration gaps and blue-ocean MSME sectors in ${district}.",
  "predictedBusinesses": [
    {
      "id": "pred-1",
      "rank": 1,
      "title": "Business Name (e.g. Solar-Powered Cold Pressed Oil Extraction Unit)",
      "sector": "Agro-Processing / Retail / Logistics / Manufacturing",
      "matchScore": 96,
      "summary": "Crisp 2-sentence summary of the business concept and value proposition.",
      "capitalRequired": {
        "min": 150000,
        "max": 250000,
        "formatted": "₹1.5 Lakh - ₹2.5 Lakh"
      },
      "monthlyProfit": {
        "min": 35000,
        "max": 60000,
        "formatted": "₹35,000 - ₹60,000 / month",
        "marginPercentage": 28
      },
      "paybackPeriodMonths": 6,
      "whyInThisDistrict": "Detailed rationale referencing local commodities, mandi arrivals, and specific geographic advantages of ${district}.",
      "udyamAlignment": "How this leverages Udyam registration benefits, priority sector lending, and MSME tax benefits.",
      "matchedSubsidies": [
        {
          "name": "PMEGP Capital Subsidy",
          "percentage": "35% Subsidy",
          "details": "Direct capital grant of up to 35% for rural manufacturing/processing units under KVIC.",
          "portalUrl": "https://www.kviconline.gov.in/pmegpeportal/"
        },
        {
          "name": "PMFME Scheme",
          "percentage": "35% Credit Linked",
          "details": "Ministry of Food Processing 35% grant for micro-food processing enterprise machinery.",
          "portalUrl": "https://pmfme.mofpi.gov.in/"
        }
      ],
      "riskLevel": "LOW" | "MODERATE" | "HIGH",
      "executionSteps": [
        "Procure Udyam Registration and local FSSAI/Trade License",
        "Source raw material directly from ${district} APMC yard during peak arrivals",
        "Set up semi-automated packaging unit with standardized branding",
        "Establish supply tie-ups with 20+ local Kirana stores and regional wholesalers"
      ]
    }
  ]
}`;

    // 4. Dispatch to Vertex AI Gemini 3.7 Flash
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
      console.error("[District-Business API] Vertex AI call failed, falling back to gemini-2.5-flash / gemini provider:", aiErr);
      try {
        const fallbackModel = getLanguageModel("gemini", "gemini-2.5-flash");
        const result = await generateText({
          model: fallbackModel,
          system: systemInstruction,
          prompt: userPrompt,
        });
        aiResponseText = result.text;
      } catch (fallbackErr) {
        console.error("[District-Business API] Secondary AI fallback failed:", fallbackErr);
      }
    }

    // 5. Clean & Parse JSON Output
    let parsedData = null;
    if (aiResponseText) {
      try {
        const cleanJson = aiResponseText
          .replace(/```json\s*/gi, "")
          .replace(/```\s*$/gi, "")
          .trim();
        parsedData = JSON.parse(cleanJson);
      } catch (parseErr) {
        console.warn("[District-Business API] JSON parse failed on AI text:", parseErr, "Text snippet:", aiResponseText.slice(0, 300));
      }
    }

    // 6. Graceful structured fallback if AI was unavailable
    if (!parsedData || !Array.isArray(parsedData.predictedBusinesses)) {
      parsedData = generateGroundedFallbackPredictions(district, state, budget, mandiRecords, udyamStats);
    }

    // Save generated district predictions in Prisma
    if (user) {
      try {
        await prisma.districtBusinessPrediction.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            district,
            state,
            budget,
            category,
            riskLevel,
            predictions: parsedData.predictedBusinesses as any,
            districtSummary: parsedData.districtSummary,
            liveMandiInsight: parsedData.liveMandiInsight,
            mandiRecords: JSON.parse(JSON.stringify(mandiRecords)),
          },
          update: {
            district,
            state,
            budget,
            category,
            riskLevel,
            predictions: parsedData.predictedBusinesses as any,
            districtSummary: parsedData.districtSummary,
            liveMandiInsight: parsedData.liveMandiInsight,
            mandiRecords: JSON.parse(JSON.stringify(mandiRecords)),
          },
        });
      } catch {}
    }

    return NextResponse.json({
      success: true,
      query: { district, state, budget, category, riskLevel },
      mandiRecords,
      udyamStats,
      ...parsedData,
    });
  } catch (error: any) {
    console.error("[District-Business API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate district business prediction",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (user) {
      const saved = await prisma.districtBusinessPrediction.findUnique({
        where: { userId: user.id },
      });
      if (saved) {
        return NextResponse.json({
          success: true,
          district: saved.district,
          state: saved.state,
          budget: saved.budget,
          predictedBusinesses: saved.predictions,
          districtSummary: saved.districtSummary,
          liveMandiInsight: saved.liveMandiInsight,
          mandiRecords: saved.mandiRecords,
          savedInDb: true,
        });
      }
    }
  } catch {}
  return POST(req);
}

function generateGroundedFallbackPredictions(
  district: string,
  state: string,
  budget: number,
  mandiRecords: any[],
  udyamStats: any
) {
  const topCommodity = mandiRecords[0]?.commodity || "Agricultural Staples";
  return {
    districtSummary: `${district} is an active regional hub in ${state} with strong agro-commodity flows, active APMC wholesale markets, and expanding micro-enterprise clusters.`,
    liveMandiInsight: `Real-time APMC Mandi rates indicate strong arrivals of ${topCommodity}, creating high-margin value-addition and primary aggregation opportunities.`,
    udyamInsight: `UDYAM MSME data indicates low saturation in organized packaging and cold-chain micro-units, offering a clear blue-ocean entry for ₹${budget.toLocaleString("en-IN")} investment.`,
    predictedBusinesses: [
      {
        id: "pred-1",
        rank: 1,
        title: `Primary Processing & Branded Packaging Unit (${topCommodity} & Regional Pulses)`,
        sector: "Agro-Processing & Value Addition",
        matchScore: 95,
        summary: `Procure ${topCommodity} and staples in bulk from ${district} APMC Mandi at wholesale rates, clean, grade, and package into branded retail packs for local Kirana distribution.`,
        capitalRequired: {
          min: Math.round(budget * 0.7),
          max: budget,
          formatted: `₹${(Math.round(budget * 0.7)).toLocaleString("en-IN")} - ₹${budget.toLocaleString("en-IN")}`,
        },
        monthlyProfit: {
          min: Math.round(budget * 0.18),
          max: Math.round(budget * 0.32),
          formatted: `₹${(Math.round(budget * 0.18)).toLocaleString("en-IN")} - ₹${(Math.round(budget * 0.32)).toLocaleString("en-IN")} / month`,
          marginPercentage: 24,
        },
        paybackPeriodMonths: 7,
        whyInThisDistrict: `Direct farm-gate access in ${district} bypasses multiple intermediary trader commissions, providing a 14% gross margin advantage.`,
        udyamAlignment: `Qualifies for Micro Enterprise status under Udyam, unlocking 2% interest subvention and priority collateral-free bank loans.`,
        matchedSubsidies: [
          {
            name: "PMEGP Capital Subsidy",
            percentage: "Up to 35%",
            details: "Ministry of MSME capital subsidy on plant, machinery, and working capital.",
            portalUrl: "https://www.kviconline.gov.in/pmegpeportal/",
          },
          {
            name: "PMFME Micro Food Scheme",
            percentage: "35% Credit-Linked",
            details: "Direct capital grant for equipment modernization and branding.",
            portalUrl: "https://pmfme.mofpi.gov.in/",
          },
        ],
        riskLevel: "LOW",
        executionSteps: [
          "Complete online Udyam and FSSAI basic registration",
          `Establish wholesale sourcing account at ${district} APMC Mandi`,
          "Procure semi-automatic sealing and nitrogen-flush packaging machine",
          "Onboard 30 local retailers on a weekly cash-and-carry delivery schedule",
        ],
      },
      {
        id: "pred-2",
        rank: 2,
        title: "Cold-Chain Mini Hub & Farm-Gate Aggregation Point",
        sector: "Logistics & Storage",
        matchScore: 91,
        summary: "Establish a 5-10 MT modular solar-powered micro cold room near transport junctions to preserve perishable vegetables and fruits for off-peak price surge sales.",
        capitalRequired: {
          min: Math.round(budget * 0.8),
          max: Math.round(budget * 1.2),
          formatted: `₹${(Math.round(budget * 0.8)).toLocaleString("en-IN")} - ₹${(Math.round(budget * 1.2)).toLocaleString("en-IN")}`,
        },
        monthlyProfit: {
          min: Math.round(budget * 0.15),
          max: Math.round(budget * 0.28),
          formatted: `₹${(Math.round(budget * 0.15)).toLocaleString("en-IN")} - ₹${(Math.round(budget * 0.28)).toLocaleString("en-IN")} / month`,
          marginPercentage: 30,
        },
        paybackPeriodMonths: 9,
        whyInThisDistrict: `Perishable produce in ${district} experiences 20-30% price drops during peak harvest; holding for 10-14 days unlocks substantial price arbitrage.`,
        udyamAlignment: "Eligible for NABARD Rural Infrastructure Subsidies and priority sector green energy grants.",
        matchedSubsidies: [
          {
            name: "NABARD Agri-Marketing Infrastructure (AMI)",
            percentage: "33.3% Capital Subsidy",
            details: "Subsidy for rural storage and non-perishable/perishable warehousing.",
            portalUrl: "https://www.nabard.org/",
          },
        ],
        riskLevel: "MODERATE",
        executionSteps: [
          "Identify 500 sq.ft lease space within 2km of the central highway/mandi",
          "Install prefabricated thermal insulation panel unit with solar backup",
          "Partner with 10 farmer producer groups (FPOs) on profit-sharing basis",
        ],
      },
      {
        id: "pred-3",
        rank: 3,
        title: "B2B Digital Wholesale Supply & Bulk Distribution",
        sector: "Commerce & Distribution",
        matchScore: 88,
        summary: "Aggregate FMCG staples, regional edible oils, and packaged condiments to supply small village and neighborhood Kirana stores with next-day doorstep delivery.",
        capitalRequired: {
          min: Math.round(budget * 0.5),
          max: Math.round(budget * 0.85),
          formatted: `₹${(Math.round(budget * 0.5)).toLocaleString("en-IN")} - ₹${(Math.round(budget * 0.85)).toLocaleString("en-IN")}`,
        },
        monthlyProfit: {
          min: Math.round(budget * 0.14),
          max: Math.round(budget * 0.25),
          formatted: `₹${(Math.round(budget * 0.14)).toLocaleString("en-IN")} - ₹${(Math.round(budget * 0.25)).toLocaleString("en-IN")} / month`,
          marginPercentage: 16,
        },
        paybackPeriodMonths: 5,
        whyInThisDistrict: `Village stores in ${district} hinterlands travel 15-25km weekly for stock replenishment; consolidated delivery captures steady recurring margins.`,
        udyamAlignment: "Eligible for PM Mudra Tarun Working Capital Overdraft at subsidized interest rates.",
        matchedSubsidies: [
          {
            name: "PM Mudra Yojana (Tarun Tier)",
            percentage: "Collateral Free",
            details: "Up to ₹10 Lakhs working capital loan at 8.5% p.a. subvented rate.",
            portalUrl: "https://www.mudra.org.in/",
          },
        ],
        riskLevel: "LOW",
        executionSteps: [
          "Negotiate direct distributor pricing with regional oil and grain mills",
          "Set up WhatsApp business ordering catalog for 50 village retailers",
          "Deploy shared tempo logistics for fixed weekly route delivery",
        ],
      },
    ],
  };
}
