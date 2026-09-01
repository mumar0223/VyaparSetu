import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserBusinessFullContext } from "@/lib/business-helper";
import { SchemesClient } from "../schemes/schemes-client";

export const dynamic = "force-dynamic";

export default async function SchemesForYouPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const dbContext = await getUserBusinessFullContext(user.id);

  // 1. Fetch persistent saved schemes from PostgreSQL
  let saved = await prisma.governmentSchemeMatch.findUnique({
    where: { userId: user.id },
  });

  // 2. If user has never generated schemes, generate initial and save to DB
  if (!saved) {
    const businessName = dbContext?.businessName || "My Rural Enterprise";
    const category = dbContext?.category || "General / MSME";
    const city = dbContext?.city || "Pune";
    const state = dbContext?.state || "Maharashtra";
    const annualRevenue = Number(dbContext?.annualRevenue || 1200000);

    const initialSchemes = [
      {
        id: "pmegp",
        name: "Prime Minister Employment Generation Programme (PMEGP)",
        ministry: "Ministry of MSME / KVIC",
        matchScore: 96,
        subsidy: "Up to 35% Direct Capital Subsidy",
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
    ];

    saved = await prisma.governmentSchemeMatch.create({
      data: {
        userId: user.id,
        schemes: initialSchemes,
        summary: `${businessName} in ${city}, ${state} pre-qualifies for high-impact capital subsidies and collateral-free working capital under Ministry of MSME and MoFPI programs.`,
        totalSubsidies: "Up to ₹17.5 Lakhs in Direct Capital Grants",
        district: city,
        state: state,
        lastEvaluatedAt: new Date(),
      },
    });
  }

  const initialMatchData = {
    schemes: (saved?.schemes as any[]) || [],
    summary: saved?.summary || "",
    totalSubsidies: saved?.totalSubsidies || "Up to ₹17.5 Lakhs in Subsidies",
    district: saved?.district || dbContext?.city || "Pune",
    state: saved?.state || dbContext?.state || "Maharashtra",
    lastEvaluatedAt: saved?.lastEvaluatedAt ? saved.lastEvaluatedAt.toISOString() : new Date().toISOString(),
  };

  return (
    <SchemesClient
      profile={JSON.parse(JSON.stringify(dbContext))}
      initialMatchData={initialMatchData}
    />
  );
}
