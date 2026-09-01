import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserBusinessFullContext } from "@/lib/business-helper";
import { getLanguageModel } from "@/lib/agent/ai-provider";
import { generateText } from "ai";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const saved = await prisma.governmentSchemeMatch.findUnique({
      where: { userId: user.id },
    });

    if (!saved) {
      return NextResponse.json({ success: false, found: false });
    }

    return NextResponse.json({
      success: true,
      found: true,
      data: {
        schemes: saved.schemes,
        summary: saved.summary,
        totalSubsidies: saved.totalSubsidies,
        district: saved.district,
        state: saved.state,
        lastEvaluatedAt: saved.lastEvaluatedAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbContext = await getUserBusinessFullContext(user.id);
    const body = await req.json().catch(() => ({}));

    const businessName = body.businessName || dbContext?.businessName || "My Rural Enterprise";
    const category = body.category || dbContext?.category || "General / MSME";
    const city = body.city || dbContext?.city || "Pune";
    const state = body.state || dbContext?.state || "Maharashtra";
    const annualRevenue = Number(body.annualRevenue || dbContext?.annualRevenue || 1200000);
    const monthlyExpenses = Number(
      body.monthlyExpenses || dbContext?.calculatedMonthlyExpenses || dbContext?.monthlyExpenses || 65000
    );
    const totalLiquidity = Number(dbContext?.totalSavedLiquidity || 250000);

    const systemPrompt = `You are VyaparSetu's Senior Government Schemes & Subsidies Underwriting Specialist for Indian MSMEs.
You evaluate the enterprise's real financials, industry sector, and geographic district to determine exact eligibility for Indian central and state government subsidy and credit schemes.

Evaluate across these primary programs:
1. PMEGP (Prime Minister's Employment Generation Programme - up to 35% capital subsidy, Ministry of MSME / KVIC)
2. PMFME (PM Formalisation of Micro food processing Enterprises - 35% credit-linked subsidy, MoFPI)
3. Pradhan Mantri MUDRA Yojana (Shishu/Kishore/Tarun - up to ₹10 Lakhs collateral-free credit, DFS)
4. PM Vishwakarma Scheme (₹15,000 toolkits + 5% subsidized loans for traditional artisans/trades)
5. CGTMSE (Credit Guarantee Scheme for Micro & Small Enterprises - 85% sovereign collateral cover, SIDBI)
6. PM Surya Ghar: Muft Bijli Yojana (Up to ₹78,000 capital subsidy for commercial/rooftop solar)
7. Stand-Up India / State Industrial Subsidies (Financing for SC/ST/Women entrepreneurs or backward districts)

CRITICAL: Return ONLY valid JSON matching this schema:
{
  "summary": "2-sentence executive summary of total grants & credit pre-qualifications.",
  "totalSubsidies": "Calculated total potential grant/subsidy (e.g. 'Up to ₹17.5 Lakhs in Direct Capital Grants')",
  "schemes": [
    {
      "id": "pmegp",
      "name": "Prime Minister Employment Generation Programme (PMEGP)",
      "ministry": "Ministry of MSME / KVIC",
      "matchScore": 96,
      "subsidy": "Up to 35% Direct Capital Subsidy",
      "subsidyAmount": "₹8.75 Lakhs Capital Grant",
      "maxLoan": "₹50 Lakhs (Manufacturing) / ₹20 Lakhs (Service)",
      "capitalStructure": {
        "grant": "35% (Non-refundable)",
        "bankLoan": "60% (Term Loan)",
        "ownerMargin": "5% (Self Contribution)"
      },
      "eligibleCategories": ["Manufacturing", "Services", "Food Processing", "Packaging", "General"],
      "description": "Credit-linked capital subsidy for setting up new micro-enterprises and employment generation in rural and semi-urban areas.",
      "whyEligible": "Specific explanation of why this business in ${city}, ${state} qualifies based on sector and scale.",
      "bankTips": "Key points for bank loan officer and District Industries Centre (DIC) approval.",
      "documents": [
        "Udyam Registration Certificate",
        "Detailed Project Report (DPR)",
        "Aadhaar & PAN Card",
        "Rural Area Certificate (issued by Gram Panchayat/Patwari for 35% rate)",
        "Bank Account Statement (6 Months)"
      ],
      "applicationUrl": "https://www.kviconline.gov.in/pmegpeportal/",
      "portalName": "KVIC Official e-Portal"
    }
  ]
}`;

    const userPrompt = `Evaluate real-time government scheme eligibility for:
Business Name: ${businessName}
Sector: ${category}
Location: ${city}, ${state}
Annual Turnover: ₹${annualRevenue.toLocaleString("en-IN")}
Monthly Operating Expenses: ₹${monthlyExpenses.toLocaleString("en-IN")}
Available Self Capital Liquidity: ₹${totalLiquidity.toLocaleString("en-IN")}`;

    let aiText = "";
    try {
      const model = getLanguageModel("vertex", "gemini-3.7-flash");
      const res = await generateText({
        model,
        system: systemPrompt,
        prompt: userPrompt,
      });
      aiText = res.text;
    } catch {
      try {
        const fallbackModel = getLanguageModel("gemini", "gemini-2.5-flash");
        const res = await generateText({
          model: fallbackModel,
          system: systemPrompt,
          prompt: userPrompt,
        });
        aiText = res.text;
      } catch {}
    }

    let parsedResult: any = null;
    if (aiText) {
      try {
        const cleanJson = aiText.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();
        parsedResult = JSON.parse(cleanJson);
      } catch {}
    }

    if (!parsedResult || !Array.isArray(parsedResult.schemes)) {
      parsedResult = getFallbackGroundedSchemes(businessName, category, city, state, annualRevenue);
    }

    // Save ONLY the generated output in the database for this user
    const savedRecord = await prisma.governmentSchemeMatch.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        schemes: parsedResult.schemes,
        summary: parsedResult.summary,
        totalSubsidies: parsedResult.totalSubsidies || "Up to ₹17.5 Lakhs in Subsidies",
        district: city,
        state: state,
        lastEvaluatedAt: new Date(),
      },
      update: {
        schemes: parsedResult.schemes,
        summary: parsedResult.summary,
        totalSubsidies: parsedResult.totalSubsidies || "Up to ₹17.5 Lakhs in Subsidies",
        district: city,
        state: state,
        lastEvaluatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        schemes: savedRecord.schemes,
        summary: savedRecord.summary,
        totalSubsidies: savedRecord.totalSubsidies,
        district: savedRecord.district,
        state: savedRecord.state,
        lastEvaluatedAt: savedRecord.lastEvaluatedAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function getFallbackGroundedSchemes(
  businessName: string,
  category: string,
  city: string,
  state: string,
  annualRevenue: number
) {
  return {
    summary: `${businessName} in ${city}, ${state} pre-qualifies for high-impact capital subsidies and collateral-free working capital under Ministry of MSME and MoFPI programs.`,
    totalSubsidies: "Up to ₹17.5 Lakhs in Direct Capital Grants",
    schemes: [
      {
        id: "pmegp",
        name: "Prime Minister Employment Generation Programme (PMEGP)",
        ministry: "Ministry of MSME / KVIC",
        matchScore: 96,
        subsidy: "Up to 35% Capital Subsidy",
        subsidyAmount: "₹8.75 Lakhs Capital Grant",
        maxLoan: "₹50 Lakhs (Manufacturing) / ₹20 Lakhs (Service)",
        capitalStructure: {
          grant: "35% (Non-refundable)",
          bankLoan: "60% (Term Loan)",
          ownerMargin: "5% (Self Contribution)",
        },
        eligibleCategories: ["Manufacturing", "Services", "Food Processing", "Packaging", "General"],
        description:
          "Credit-linked capital subsidy scheme aimed at generating self-employment opportunities through micro-enterprises in rural and urban areas.",
        whyEligible: `Location in ${city}, ${state} qualifies for rural/special category 35% subsidy on project capital outlay.`,
        bankTips: "Highlight local raw material sourcing and local worker employment in Detailed Project Report.",
        documents: [
          "Udyam Registration Certificate",
          "Detailed Project Report (DPR)",
          "Aadhaar & PAN Card",
          "Rural Area Certificate",
          "Bank Account Statement (6 Months)",
        ],
        applicationUrl: "https://www.kviconline.gov.in/pmegpeportal/",
        portalName: "KVIC Official e-Portal",
      },
      {
        id: "pmfme",
        name: "PM Formalisation of Micro Food Processing Enterprises (PMFME)",
        ministry: "Ministry of Food Processing Industries (MoFPI)",
        matchScore: 92,
        subsidy: "35% Credit-Linked Subsidy",
        subsidyAmount: "Up to ₹10 Lakhs Grant",
        maxLoan: "₹30 Lakhs Project Cost",
        capitalStructure: {
          grant: "35% (Credit-linked)",
          bankLoan: "55% (Bank Credit)",
          ownerMargin: "10% (Margin Money)",
        },
        eligibleCategories: ["Food Processing", "Agro-Enterprises", "Bakery", "Cold-Pressed Oil", "Spices"],
        description:
          "Financial, technical, and business support for micro food processing units, self-help groups, and farmer producer organizations.",
        whyEligible: `Eligible for credit-linked capital subsidy for equipment upgrades and brand packaging in ${city}.`,
        bankTips: "Submit FSSAI registration along with machinery quotation.",
        documents: [
          "FSSAI Basic Registration",
          "Udyam Certificate",
          "Machinery Proforma Invoice",
          "Land / Rent Agreement",
        ],
        applicationUrl: "https://pmfme.mofpi.gov.in/",
        portalName: "PMFME Official Portal",
      },
      {
        id: "mudra",
        name: "Pradhan Mantri MUDRA Yojana (PMMY)",
        ministry: "Department of Financial Services",
        matchScore: 94,
        subsidy: "Collateral-Free Institutional Credit",
        subsidyAmount: "100% Guarantee Cover",
        maxLoan: "₹10 Lakhs (Tarun Tier)",
        capitalStructure: {
          grant: "Zero Collateral Required",
          bankLoan: "Up to ₹10 Lakhs Working Capital",
          ownerMargin: "Nil to 10%",
        },
        eligibleCategories: ["Retail", "Services", "Kirana", "Distribution", "Workshops", "General"],
        description:
          "Provides institutional credit without third-party collateral to micro and small non-corporate enterprises.",
        whyEligible: `Clean turnover of ₹${(annualRevenue / 100000).toFixed(1)} Lakhs supports instant underwriting by nationalized and regional rural banks.`,
        bankTips: "Present UPI/digital ledger receipts to prove consistent monthly cash inflows.",
        documents: [
          "Mudra Loan Application Form",
          "Proof of Business Identity & Address",
          "Last 12 Months Bank Statement",
          "ITR / Balance Sheet if available",
        ],
        applicationUrl: "https://www.mudra.org.in/",
        portalName: "MUDRA Official Portal",
      },
      {
        id: "pm-surya-ghar",
        name: "PM Surya Ghar: Muft Bijli Yojana (Commercial & MSME Rooftop)",
        ministry: "Ministry of New and Renewable Energy",
        matchScore: 89,
        subsidy: "Direct Financial Assistance Grant",
        subsidyAmount: "Up to ₹78,000 Direct Grant",
        maxLoan: "Subsidized Solar Loans at 7% p.a.",
        capitalStructure: {
          grant: "Direct DBT Subsidy into Account",
          bankLoan: "Collateral-Free Solar Loan",
          ownerMargin: "10%",
        },
        eligibleCategories: ["Commercial Shops", "Offices", "Manufacturing Sheds", "General"],
        description:
          "Government initiative to promote solar rooftop power generation with direct capital grants and priority bank loans.",
        whyEligible: `Cuts enterprise operating power electricity tariffs by up to 70% in ${city}.`,
        bankTips: "Apply online at National Solar Portal with electricity consumer number.",
        documents: [
          "Recent Electricity Bill",
          "Roof Ownership / Consent Letter",
          "Bank Account Passbook for DBT",
        ],
        applicationUrl: "https://pmsuryaghar.gov.in/",
        portalName: "National Solar Portal",
      },
      {
        id: "cgtmse",
        name: "Credit Guarantee Fund Trust for Micro and Small Enterprises (CGTMSE)",
        ministry: "Ministry of MSME & SIDBI",
        matchScore: 88,
        subsidy: "85% Sovereign Guarantee Cover",
        subsidyAmount: "Zero Third-Party Collateral",
        maxLoan: "Up to ₹500 Lakhs",
        capitalStructure: {
          grant: "Guaranteed by Ministry of MSME",
          bankLoan: "100% Clean Loan",
          ownerMargin: "15%",
        },
        eligibleCategories: ["Manufacturing", "Services", "Agro-Enterprises", "Retail"],
        description:
          "Enables first-generation entrepreneurs to access term loans and working capital without pledging land or property collateral.",
        whyEligible: "Banks are legally barred from demanding mortgage collateral for eligible MSME loans under CGTMSE.",
        bankTips: "Ask the branch manager specifically for CGTMSE coverage under MSME guidelines.",
        documents: [
          "Udyam Registration Certificate",
          "Business Plan / Financial Projections",
          "KYC of Proprietor / Partners",
        ],
        applicationUrl: "https://www.cgtmse.in/",
        portalName: "CGTMSE Official Portal",
      },
    ],
  };
}
