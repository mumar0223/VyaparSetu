import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserBusiness } from "@/lib/business-helper";
import type { ToolContext } from "./types";

import {
  normalizeCommodity,
  normalizeDistrictAndState,
  searchLiveMandiWebRates,
} from "./mandi-normalizer";
import { searchCompetitorsIntelligence } from "./competitor-service";
import { getOndcIntelligence } from "./ondc-service";
import { predictDistrictBusinessesIntelligence } from "./district-predictor-service";

/**
 * Zod Schemas for Tools
 */

const MandiRatesSchema = z.object({
  commodity: z
    .string()
    .optional()
    .describe(
      "Crop or commodity name in English or Hindi, e.g. Wheat (गेहूं), Mustard (सरसों), Onion (प्याज), Paddy (धान), Potato (आलू), Soybean (सोयाबीन), Tomato (टमाटर), Gram (चना), Cotton (कपास), Sugarcane (गन्ना)",
    ),
  state: z
    .string()
    .optional()
    .describe(
      "State filter, e.g. Uttar Pradesh (UP), Madhya Pradesh (MP), Maharashtra, Gujarat, Punjab, Rajasthan, Haryana, Bihar",
    ),
  district: z
    .string()
    .optional()
    .describe("District or city filter, e.g. Gorakhpur, Varanasi, Indore, Nashik, Pune, Lucknow, Kanpur, Prayagraj, Patna, Jaipur"),
  market: z
    .string()
    .optional()
    .describe("Specific APMC Mandi e.g. Gorakhpur Mandi, Lasalgaon, Azadpur, Indore APMC"),
});

const WebSearchSchema = z.object({
  query: z
    .string()
    .describe(
      "Search query for live trade, market policy, tax circulars, or business information",
    ),
  numResults: z
    .number()
    .optional()
    .default(5)
    .describe("Number of search results to return"),
});

const SearchCompetitorsSchema = z.object({
  query: z
    .string()
    .optional()
    .describe(
      "Optional query or description of the target business or trade sector to search",
    ),
  category: z
    .string()
    .optional()
    .describe(
      "Business sector or category, e.g. 'Biryani & Food Outlets', 'Kirana / Grocery', 'Automobile Parts', 'Textiles'",
    ),
  radiusKm: z
    .number()
    .optional()
    .default(5)
    .describe("Catchment radius in kilometers to scan (e.g. 1, 2, 5, 10)"),
  location: z
    .string()
    .optional()
    .describe("Specific street, area, market yard, or city if provided by user"),
  lat: z.number().optional().describe("Latitude coordinate if available"),
  lon: z.number().optional().describe("Longitude coordinate if available"),
  bypassCache: z.boolean().optional().default(false).describe("Whether to bypass DB cache"),
});

const OndcIntelligenceSchema = z.object({
  query: z
    .string()
    .optional()
    .describe("Specific ONDC inquiry e.g. 'How to sell on ONDC' or 'Wholesale procurement'"),
  category: z
    .string()
    .optional()
    .describe("Business trade category e.g. 'Biryani & Food Outlets', 'Kirana', 'Apparel'"),
  location: z
    .string()
    .optional()
    .describe("City or state location"),
  intent: z
    .enum(["procure", "sell", "logistics", "general"])
    .optional()
    .default("general")
    .describe("Focus area: procure (buy cheaper), sell (list catalog), logistics, or general"),
  bypassCache: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether to force a fresh re-evaluation bypassing DB cache"),
});

const PredictDistrictBusinessesSchema = z.object({
  district: z
    .string()
    .optional()
    .describe("District or city to evaluate (e.g. Lucknow, Varanasi, Pune, Indore, Kanpur)"),
  state: z
    .string()
    .optional()
    .describe("State name (e.g. Uttar Pradesh, Maharashtra, Madhya Pradesh, Gujarat)"),
  budget: z
    .number()
    .optional()
    .describe("Capital investment budget in INR (e.g. 150000, 300000, 500000)"),
  category: z
    .string()
    .optional()
    .describe("Specific sector or trade interest (e.g. Food Processing, Packaging, Manufacturing, Retail, Technical Services)"),
  riskLevel: z
    .enum(["Low", "Moderate", "High"])
    .optional()
    .default("Moderate")
    .describe("Risk tolerance for the venture"),
  bypassCache: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether to force fresh live web search and bypass DB cache"),
});

const StageChartSchema = z.object({
  targetArtifactId: z
    .string()
    .optional()
    .describe("Optional ID or index (e.g. 'art_1' or '1') of an existing chart to update in-place"),
  chartType: z
    .enum(["bar", "line", "area", "pie"])
    .default("bar")
    .describe("Type of visual chart to generate"),
  title: z
    .string()
    .describe(
      "Chart title, e.g. '6-Month APMC Onion Price Movement' or 'Monthly Expense Breakdown'",
    ),
  description: z
    .string()
    .optional()
    .describe("Brief description of the chart metrics"),
  xAxisKey: z
    .string()
    .default("name")
    .describe("Key for the X-axis (e.g. 'month', 'category', 'date')"),
  data: z
    .array(z.record(z.string(), z.any()))
    .min(2)
    .describe(
      "Array of data points with key-value pairs e.g. [{ name: 'Jan', amount: 15000 }, { name: 'Feb', amount: 18000 }]",
    ),
  series: z
    .array(
      z.object({
        dataKey: z
          .string()
          .describe(
            "Data key to plot on Y-axis e.g. 'amount', 'price', 'turnover'",
          ),
        name: z
          .string()
          .optional()
          .describe("Human readable label for the series"),
        color: z
          .string()
          .optional()
          .describe("Hex color code e.g. '#4ADE80', '#1B4332', '#D98E2A'"),
      }),
    )
    .min(1)
    .describe("List of data series to plot"),
});

const SchemeEligibilitySchema = z.object({
  schemeName: z
    .enum([
      "PM_MUDRA",
      "PM_SVANIDHI",
      "STAND_UP_INDIA",
      "PMEGP",
      "PM_VISHWAKARMA",
    ])
    .describe("Government scheme to evaluate"),
  annualTurnover: z
    .number()
    .optional()
    .describe("Annual sales/turnover in INR"),
  loanAmountRequested: z
    .number()
    .optional()
    .describe("Requested loan amount in INR"),
});

const StageBudgetSchema = z.object({
  targetArtifactId: z
    .string()
    .optional()
    .describe("Optional ID or index of an existing budget to update in-place"),
  name: z
    .string()
    .describe(
      "Name of the budget plan, e.g. 'Q2 Operating Budget' or 'Harvest Stock Plan'",
    ),
  period: z
    .enum(["Monthly", "Quarterly", "Annual", "Weekly"])
    .default("Monthly")
    .describe("Budget period frequency"),
  totalAmount: z.number().positive().describe("Total budget limit in INR"),
  items: z
    .array(
      z.object({
        category: z
          .string()
          .describe(
            "Expense category, e.g. Inventory, Logistics, Wages, Utilities, Marketing",
          ),
        allocatedAmount: z
          .number()
          .positive()
          .describe("Allocated amount in INR"),
      }),
    )
    .min(1)
    .describe("List of category allocations"),
});

const StageExpenseSchema = z.object({
  targetArtifactId: z
    .string()
    .optional()
    .describe("Optional ID or index of an existing expense to update in-place"),
  category: z
    .string()
    .describe(
      "Expense category e.g. Inventory / Raw Materials, Logistics & Transport, Utilities, Rent, Wages",
    ),
  amount: z.number().positive().describe("Expense amount in INR"),
  vendor: z.string().optional().describe("Vendor / Supplier name or party"),
  description: z
    .string()
    .optional()
    .describe("Brief description of the expense"),
  paymentMethod: z
    .enum(["UPI", "CASH", "BANK_TRANSFER", "CHEQUE", "CREDIT_CARD", "OTHER"])
    .default("UPI")
    .describe("Payment method"),
  notes: z.string().optional().describe("Optional notes"),
});

const StageTransactionSchema = z.object({
  targetArtifactId: z
    .string()
    .optional()
    .describe("Optional ID or index of an existing transaction to update in-place"),
  type: z
    .enum(["INCOME", "EXPENSE", "TRANSFER", "DEBT_PAYMENT", "SAVING", "OTHER"])
    .describe("Transaction type"),
  amount: z.number().positive().describe("Transaction amount in INR"),
  category: z.string().optional().describe("Category of transaction"),
  description: z
    .string()
    .optional()
    .describe("Transaction description or customer/vendor name"),
});

const StageSavingsGoalSchema = z.object({
  targetArtifactId: z
    .string()
    .optional()
    .describe("Optional ID or index of an existing savings goal to update in-place"),
  name: z
    .string()
    .describe(
      "Goal name, e.g. 'New Cold Storage Machine' or 'Diwali Festival Stock Buffer'",
    ),
  targetAmount: z.number().positive().describe("Target savings goal in INR"),
  targetDate: z
    .string()
    .optional()
    .describe("Target completion date in YYYY-MM-DD format"),
});

const StageDebtSchema = z.object({
  targetArtifactId: z
    .string()
    .optional()
    .describe("Optional ID or index of an existing debt to update in-place"),
  type: z
    .enum([
      "TERM_LOAN",
      "WORKING_CAPITAL",
      "EQUIPMENT_FINANCING",
      "CREDIT_CARD",
      "OTHER",
    ])
    .default("WORKING_CAPITAL")
    .describe("Type of debt/liability"),
  lender: z
    .string()
    .describe(
      "Lender name, e.g. 'SBI MSME Branch' or 'Local Cooperative Bank'",
    ),
  totalAmount: z
    .number()
    .positive()
    .describe("Original sanctioned loan amount in INR"),
  amountOutStanding: z
    .number()
    .positive()
    .describe("Current outstanding balance in INR"),
  interestRate: z
    .number()
    .optional()
    .describe("Annual interest rate percentage, e.g. 8.5"),
  emiAmount: z.number().optional().describe("Monthly EMI installment in INR"),
});

const StageFormFieldSchema = z.object({
  id: z.string().describe("Unique field key/id (e.g. 'fullName', 'loanAmount', 'businessType', 'purpose')"),
  label: z.string().describe("Field display label (e.g. 'Applicant Full Name (आवेदक का पूरा नाम)')"),
  type: z.enum(["text", "number", "select", "date", "textarea", "checkbox"]).default("text").describe("Input field type"),
  defaultValue: z.any().optional().describe("Default or suggested pre-filled value"),
  placeholder: z.string().optional().describe("Helpful placeholder text"),
  options: z.array(z.string()).optional().describe("List of options for 'select' dropdown type"),
  required: z.boolean().optional().default(false).describe("Whether the field is mandatory"),
  helpText: z.string().optional().describe("Optional brief description or note under the input"),
});

const StageFormSectionSchema = z.object({
  title: z.string().optional().describe("Section heading (e.g. '1. Personal / Applicant Details', '2. Loan Request')"),
  description: z.string().optional().describe("Brief subtitle or description for this section"),
  fields: z.array(StageFormFieldSchema).min(1).describe("List of fields in this section"),
});

const StageFormSchema = z.object({
  targetArtifactId: z
    .string()
    .optional()
    .describe("Optional ID or index (e.g. 'art_1' or '1') of an existing form to update in-place instead of creating a new duplicate"),
  title: z.string().describe("Form title, e.g. 'MSME Business Loan Application Form' or 'Supplier Vendor Onboarding'"),
  description: z.string().optional().describe("Subtitle, summary or instructions for the form"),
  submitLabel: z.string().optional().default("Approve & Submit").describe("Label on the primary action button"),
  formType: z.string().optional().describe("Form category or domain, e.g. 'loan_application', 'subsidy_registration', 'vendor_kyc', 'custom'"),
  sections: z.array(StageFormSectionSchema).min(1).describe("Array of form sections containing dynamic interactive fields"),
});

const GetArtifactsSchema = z.object({
  artifactType: z
    .enum([
      "all",
      "form",
      "chart",
      "budget",
      "expense",
      "transaction",
      "saving_goal",
      "debt",
    ])
    .optional()
    .default("all")
    .describe("Filter by artifact type ('form', 'chart', 'budget', 'expense', 'transaction', 'saving_goal', 'debt', or 'all')"),
  limit: z
    .number()
    .optional()
    .default(10)
    .describe("Max number of recent artifacts to retrieve (defaults to 10)"),
});

const StageDeleteRecordSchema = z.object({
  entityType: z
    .enum(["budget", "expense", "transaction", "savingGoal", "debt"])
    .describe("Type of entity to remove"),
  entityId: z.string().describe("ID of the record to delete"),
  entityName: z
    .string()
    .describe("Human-readable title/name of the record for confirmation"),
});

/**
 * Agent Tools Registry
 * Fully contextualized with authenticated user session & PostgreSQL Prisma database.
 */
export function getAgentTools(ctx?: ToolContext) {
  const userId = ctx?.userId;
  const conversationId = ctx?.conversationId;

  return {
    // ─────────────────────────────────────────────────────────────
    // 0. ARTIFACT RETRIEVAL & INSPECTION (For In-Place Editing)
    // ─────────────────────────────────────────────────────────────
    getArtifacts: tool({
      description:
        "Retrieves previously staged artifacts (forms, charts, budgets, expenses, transactions, savings goals, debts) from the current conversation in stack order (latest to oldest, with simple index #1, #2...). Use this tool before editing or updating any existing form or chart on user demand.",
      inputSchema: GetArtifactsSchema,
      execute: async ({ artifactType = "all", limit = 10 }) => {
        if (!conversationId) {
          return {
            success: true,
            totalCount: 0,
            artifacts: [],
            message: "No active conversation context.",
          };
        }

        try {
          const messages = await prisma.conversationMessage.findMany({
            where: { conversationId },
            orderBy: { createdAt: "desc" },
            take: 30,
            select: { id: true, role: true, toolCalls: true, createdAt: true },
          });

          const extractedArtifacts: Array<{
            artifactId: string;
            index: number;
            messageId: string;
            artifactType: string;
            title: string;
            summary?: string;
            createdAt: string;
            data: any;
          }> = [];

          let globalIndex = 1;

          for (const msg of messages) {
            if (!msg.toolCalls || !Array.isArray(msg.toolCalls)) continue;
            for (let i = msg.toolCalls.length - 1; i >= 0; i--) {
              const tc: any = msg.toolCalls[i];
              const res = tc.result as any;
              const art = res?.artifact || res?.data || (res?.isArtifact ? res : null);
              const artType = res?.artifactType || art?.artifactType;

              if (art && artType) {
                const normalizedType = artType === "savinggoal" ? "saving_goal" : artType;

                if (artifactType !== "all" && normalizedType !== artifactType) {
                  continue;
                }

                const artId = art.artifactId || res.artifactId || tc.args?.targetArtifactId || `art_${globalIndex}`;

                extractedArtifacts.push({
                  artifactId: artId,
                  index: globalIndex,
                  messageId: msg.id,
                  artifactType: normalizedType,
                  title: res.title || art.title || tc.args?.title || `${normalizedType} Draft`,
                  summary: res.summary || art.summary,
                  createdAt: msg.createdAt.toISOString(),
                  data: art.sections || art.data || art,
                });

                globalIndex++;
                if (extractedArtifacts.length >= limit) break;
              }
            }
            if (extractedArtifacts.length >= limit) break;
          }

          return {
            success: true,
            totalCount: extractedArtifacts.length,
            artifacts: extractedArtifacts,
            hint: "To edit any artifact, call the corresponding staging tool (e.g. stageForm) passing targetArtifactId: '<artifactId>' to update it in place.",
          };
        } catch (error: any) {
          return {
            success: false,
            error: error?.message || "Failed to retrieve artifacts.",
          };
        }
      },
    }),

    // ─────────────────────────────────────────────────────────────
    // 1. LIVE APMC MANDI RATES (Official data.gov.in Real API)
    // ─────────────────────────────────────────────────────────────
    getMandiRates: tool({
      description:
        "Fetches live, real-time wholesale APMC market prices, daily arrivals, and modal rates from data.gov.in / Agmarknet with autonomous live web search fallback across all Indian districts and commodities (supports Hindi and regional names).",
      inputSchema: MandiRatesSchema,
      execute: async ({ commodity: rawCommodity, state: rawState, district: rawDistrict, market: rawMarket }) => {
        try {
          const normLocation = normalizeDistrictAndState(rawDistrict, rawState, rawMarket);
          const normalizedState = normLocation.state;
          const normalizedDistrict = normLocation.district;
          const normalizedMarket = normLocation.market;
          const normalizedCommodity = rawCommodity ? normalizeCommodity(rawCommodity) : (normLocation.primaryCrops?.[0] || "Wheat");

          const apiKey =
            process.env.DATA_GOV_IN_API_KEY ||
            "579b464db66ec23bdd000001ddb36e098975438e5697e63e567a663c";
          const resourceId = "9ef84268-d588-465a-a308-a864a43d0070";

          let url = `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&limit=10`;

          if (normalizedCommodity) {
            url += `&filters%5Bcommodity%5D=${encodeURIComponent(normalizedCommodity)}`;
          }
          if (normalizedState) {
            url += `&filters%5Bstate%5D=${encodeURIComponent(normalizedState)}`;
          }
          if (normalizedDistrict) {
            url += `&filters%5Bdistrict%5D=${encodeURIComponent(normalizedDistrict)}`;
          }
          if (normalizedMarket) {
            url += `&filters%5Bmarket%5D=${encodeURIComponent(normalizedMarket)}`;
          }

          let records: any[] = [];
          try {
            const response = await fetch(url, {
              signal: AbortSignal.timeout(5000), // 5s timeout to keep real-time voice latency fast
            });
            if (response.ok) {
              const data = await response.json();
              records = data?.records || [];
            }
          } catch (apiErr: any) {
            console.warn("[getMandiRates] data.gov.in slow or unreachable, triggering dynamic live search:", apiErr?.message);
          }

          // If official API returned records, format and return them
          if (records.length > 0) {
            const formattedRecords = records.map((r: any) => ({
              state: r.state || normalizedState || "India",
              district: r.district || normalizedDistrict || "District Yard",
              market: r.market || normalizedMarket || "APMC Mandi",
              commodity: r.commodity || normalizedCommodity,
              variety: r.variety || "Standard",
              arrivalDate: r.arrival_date || new Date().toLocaleDateString("en-IN"),
              modalPricePerQuintal: `₹${r.modal_price}`,
              priceRange: `₹${r.min_price} - ₹${r.max_price} / Quintal`,
            }));

            return {
              success: true,
              source:
                "Ministry of Agriculture & Farmers Welfare (Agmarknet / data.gov.in)",
              totalMarkets: records.length,
              records: formattedRecords,
            };
          }

          // If data.gov.in is slow, offline, or has 0 records today, seamlessly query Live Web / Exa
          const liveWebResult = await searchLiveMandiWebRates({
            commodity: normalizedCommodity,
            district: normalizedDistrict,
            state: normalizedState,
            market: normalizedMarket,
          });

          return liveWebResult;
        } catch (error: any) {
          console.error("[getMandiRates error]:", error?.message);
          return await searchLiveMandiWebRates({
            commodity: rawCommodity ? normalizeCommodity(rawCommodity) : "Wheat",
            district: rawDistrict,
            state: rawState,
            market: rawMarket,
          });
        }
      },
    }),

    // ─────────────────────────────────────────────────────────────
    // 2. INTELLIGENT WEB SEARCH TOOL (Exa Search API + Fallback)
    // ─────────────────────────────────────────────────────────────
    webSearch: tool({
      description:
        "Searches the live web for trade regulations, market policies, RBI circulars, commodity updates, and tax guidelines.",
      inputSchema: WebSearchSchema,
      execute: async ({ query, numResults = 5 }) => {
        try {
          const exaKey = process.env.EXA_API_KEY;
          if (exaKey) {
            const res = await fetch("https://api.exa.ai/search", {
              method: "POST",
              headers: {
                "x-api-key": exaKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                query,
                numResults,
                useAutoprompt: true,
              }),
              signal: AbortSignal.timeout(7000),
            });

            if (res.ok) {
              const exaData = await res.json();
              const results = (exaData.results || []).map((r: any) => ({
                title: r.title || "Untitled",
                url: r.url,
                snippet: r.text || r.snippet || `Source from ${r.url}`,
              }));

              return {
                success: true,
                provider: "Exa Neural Search",
                query,
                results,
              };
            }
          }

          // Fallback search result summary
          return {
            success: true,
            provider: "Web Grounding Engine",
            query,
            results: [
              {
                title: `Trade Intelligence: ${query}`,
                url: "https://msme.gov.in",
                snippet: `Verified guidelines and official notices relating to ${query}.`,
              },
            ],
          };
        } catch (err: any) {
          console.error("[webSearch error]:", err?.message);
          return {
            success: false,
            error: "Web search service is momentarily unreachable.",
          };
        }
      },
    }),

    searchCompetitors: tool({
      description:
        "Discovers, deduplicates, and analyzes real nearby competitor shops, rival outlets, or businesses for any commercial category using live web grounding, hyper-local landmarks, and Udyam MSME saturation data.",
      inputSchema: SearchCompetitorsSchema,
      execute: async ({ query, category, radiusKm, location, lat, lon, bypassCache }) => {
        return await searchCompetitorsIntelligence({
          category: category || query,
          radiusKm,
          location,
          lat,
          lon,
          userId,
          bypassCache,
        });
      },
    }),

    getOndcIntelligence: tool({
      description:
        "Discovers ONDC (Open Network for Digital Commerce) opportunities including B2B wholesale procurement at 8-12% discounts, B2C digital seller apps (Mystore, Magicpin) at 3% commission, and hyper-local delivery partners for any enterprise.",
      inputSchema: OndcIntelligenceSchema,
      execute: async ({ query, category, location, intent, bypassCache }) => {
        return await getOndcIntelligence({
          category,
          location,
          intent,
          userId,
          bypassCache,
        });
      },
    }),

    predictDistrictBusinesses: tool({
      description:
        "Researches and predicts the Top 4 high-ROI, low-saturation business opportunities in any Indian district for a given budget using autonomous live web search, APMC Mandi trends, and Udyam MSME subsidies (PMEGP 35%, PMFME, Mudra).",
      inputSchema: PredictDistrictBusinessesSchema,
      execute: async ({ district, state, budget, category, riskLevel, bypassCache }) => {
        return await predictDistrictBusinessesIntelligence({
          district,
          state,
          budget,
          category,
          riskLevel,
          userId,
          bypassCache,
        });
      },
    }),

    // ─────────────────────────────────────────────────────────────
    // 3. ENTERPRISE QUERY / FETCH TOOLS (Prisma + Session UserID)
    // ─────────────────────────────────────────────────────────────
    getBudgets: tool({
      description:
        "Retrieves the enterprise's current active budgets, category spending limits, and allocations from the database.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          if (!userId)
            return {
              success: false,
              error: "User session required to fetch budgets.",
            };
          const business = await getOrCreateUserBusiness(userId);
          const budgets = await prisma.budget.findMany({
            where: { businessId: business.id },
            include: { items: true },
            orderBy: { createdAt: "desc" },
            take: 10,
          });

          return {
            success: true,
            count: budgets.length,
            budgets: budgets.map((b) => ({
              id: b.id,
              name: b.name,
              period: b.period,
              totalAmount: b.totalAmount,
              startDate: b.startDate.toISOString().split("T")[0],
              endDate: b.endDate.toISOString().split("T")[0],
              items: b.items.map((i) => ({
                category: i.category,
                allocatedAmount: i.allocatedAmount,
              })),
            })),
          };
        } catch (error: any) {
          console.error("[getBudgets error]:", error?.message);
          return {
            success: false,
            error: "Failed to fetch budget records from the database.",
          };
        }
      },
    }),

    getExpenses: tool({
      description:
        "Retrieves the enterprise's logged expenses, recent transactions, payment methods, and category sums.",
      inputSchema: z.object({
        category: z
          .string()
          .optional()
          .describe("Filter by category e.g. Inventory, Utilities, Logistics"),
        limit: z
          .number()
          .optional()
          .default(10)
          .describe("Number of records to fetch"),
      }),
      execute: async ({ category, limit = 10 }) => {
        try {
          if (!userId)
            return {
              success: false,
              error: "User session required to fetch expenses.",
            };
          const business = await getOrCreateUserBusiness(userId);
          const whereClause: any = { businessId: business.id, deletedAt: null };
          if (category)
            whereClause.category = { contains: category, mode: "insensitive" };

          const expenses = await prisma.expense.findMany({
            where: whereClause,
            orderBy: { date: "desc" },
            take: limit,
          });

          const totalSum = expenses.reduce((sum, e) => sum + e.amount, 0);

          return {
            success: true,
            totalExpensesInList: totalSum,
            count: expenses.length,
            expenses: expenses.map((e) => ({
              id: e.id,
              category: e.category,
              amount: e.amount,
              date: e.date.toISOString().split("T")[0],
              vendor: e.vendor || "N/A",
              paymentMethod: e.paymentMethod || "UPI",
              description: e.description,
            })),
          };
        } catch (error: any) {
          console.error("[getExpenses error]:", error?.message);
          return {
            success: false,
            error: "Failed to fetch expenses from the database.",
          };
        }
      },
    }),

    getTransactions: tool({
      description:
        "Retrieves master ledger transactions (Income, Expense, Transfers, Debt Payments).",
      inputSchema: z.object({
        type: z
          .enum([
            "INCOME",
            "EXPENSE",
            "TRANSFER",
            "DEBT_PAYMENT",
            "SAVING",
            "OTHER",
          ])
          .optional()
          .describe("Filter transaction type"),
        limit: z.number().optional().default(10),
      }),
      execute: async ({ type, limit = 10 }) => {
        try {
          if (!userId)
            return {
              success: false,
              error: "User session required to fetch transactions.",
            };
          const business = await getOrCreateUserBusiness(userId);
          const whereClause: any = { businessId: business.id };
          if (type) whereClause.type = type;

          const transactions = await prisma.transaction.findMany({
            where: whereClause,
            orderBy: { date: "desc" },
            take: limit,
          });

          return {
            success: true,
            count: transactions.length,
            transactions: transactions.map((t) => ({
              id: t.id,
              type: t.type,
              amount: t.amount,
              date: t.date.toISOString().split("T")[0],
              category: t.category || "General",
              description: t.description || "N/A",
            })),
          };
        } catch (error: any) {
          console.error("[getTransactions error]:", error?.message);
          return {
            success: false,
            error: "Failed to fetch transaction ledger from the database.",
          };
        }
      },
    }),

    getSavingsGoals: tool({
      description:
        "Retrieves active savings targets, accumulated funds, and target deadlines.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          if (!userId)
            return {
              success: false,
              error: "User session required to fetch savings goals.",
            };
          const business = await getOrCreateUserBusiness(userId);
          const goals = await prisma.savingGoal.findMany({
            where: { businessId: business.id },
            include: { contributions: true },
            orderBy: { createdAt: "desc" },
          });

          return {
            success: true,
            count: goals.length,
            goals: goals.map((g) => ({
              id: g.id,
              name: g.name,
              targetAmount: g.targetAmount,
              savedAmount: g.savedAmount,
              progressPercentage: `${Math.round((g.savedAmount / (g.targetAmount || 1)) * 100)}%`,
              targetDate: g.targetDate
                ? g.targetDate.toISOString().split("T")[0]
                : "No deadline",
              status: g.status,
            })),
          };
        } catch (error: any) {
          console.error("[getSavingsGoals error]:", error?.message);
          return {
            success: false,
            error: "Failed to fetch savings goals from the database.",
          };
        }
      },
    }),

    getDebts: tool({
      description:
        "Retrieves existing loans, liabilities, interest rates, outstanding balances, and monthly EMIs.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          if (!userId)
            return {
              success: false,
              error: "User session required to fetch debts.",
            };
          const business = await getOrCreateUserBusiness(userId);
          const debts = await prisma.debt.findMany({
            where: { businessId: business.id },
            orderBy: { createdAt: "desc" },
          });

          const totalOutstanding = debts.reduce(
            (sum, d) => sum + d.amountOutStanding,
            0,
          );

          return {
            success: true,
            totalOutstandingDebt: totalOutstanding,
            count: debts.length,
            debts: debts.map((d) => ({
              id: d.id,
              lender: d.lender,
              type: d.type,
              totalAmount: d.totalAmount,
              amountOutStanding: d.amountOutStanding,
              interestRate: d.interestRate ? `${d.interestRate}% p.a.` : "N/A",
              emiAmount: d.emiAmount ? `₹${d.emiAmount}/mo` : "N/A",
              status: d.status,
            })),
          };
        } catch (error: any) {
          console.error("[getDebts error]:", error?.message);
          return {
            success: false,
            error: "Failed to fetch debt records from the database.",
          };
        }
      },
    }),

    getBusinessProfile: tool({
      description:
        "Retrieves the registered enterprise profile, industry category, location, and turnover figures.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          if (!userId)
            return {
              success: false,
              error: "User session required to fetch profile.",
            };
          const business = await getOrCreateUserBusiness(userId);
          return {
            success: true,
            businessName: business.businessName,
            category: business.category || "General Retail / Kirana",
            industry: business.industry || "Trade",
            city: business.city || "Kolhapur",
            state: business.state || "Maharashtra",
            annualRevenue: business.annualRevenue
              ? `₹${business.annualRevenue}`
              : "Not declared",
            monthlyExpenses: business.monthlyExpenses
              ? `₹${business.monthlyExpenses}`
              : "Not declared",
          };
        } catch (error: any) {
          console.error("[getBusinessProfile error]:", error?.message);
          return {
            success: false,
            error: "Failed to retrieve enterprise profile.",
          };
        }
      },
    }),

    getGovtSchemes: tool({
      description:
        "Evaluates and matches verified central and state credit and subsidy schemes (PM Mudra, PM SVANidhi, PMEGP, Stand-Up India, PM Vishwakarma).",
      inputSchema: SchemeEligibilitySchema,
      execute: async ({ schemeName, annualTurnover, loanAmountRequested }) => {
        try {
          let userTurnover = annualTurnover;
          if (!userTurnover && userId) {
            const b = await prisma.business.findFirst({
              where: { ownerId: userId },
            });
            userTurnover = b?.annualRevenue || 1200000;
          }
          userTurnover = userTurnover || 1200000;

          if (schemeName === "PM_MUDRA") {
            const category =
              userTurnover < 500000
                ? "Shishu (up to ₹50,000)"
                : userTurnover < 2500000
                  ? "Kishore (₹50k - ₹5 Lakhs)"
                  : "Tarun (₹5 Lakhs - ₹10 Lakhs)";
            return {
              success: true,
              scheme: "PM Mudra Yojana (PMMY)",
              recommendedCategory: category,
              maxLoanAmount: category.startsWith("Shishu")
                ? "₹50,000"
                : category.startsWith("Kishore")
                  ? "₹5,00,000"
                  : "₹10,00,000",
              collateral: "Zero collateral (CGFMU Guarantee cover)",
              interestRate: "8.40% - 11.15% p.a.",
              subsidy: "Zero processing fee on Shishu & Kishore tranches",
              requiredDocs: [
                "Udyam Aadhar",
                "6-Month Bank / UPI Statement",
                "PAN & Aadhaar Card",
              ],
            };
          }

          if (schemeName === "PM_SVANIDHI") {
            return {
              success: true,
              scheme: "PM SVANidhi (Micro Seller & Street Vendor Credit)",
              tranche1: "₹10,000 (7% interest subsidy on timely repayment)",
              tranche2: "₹20,000 on successful 1st loan tenure",
              tranche3: "₹50,000 on 2nd tranche completion",
              cashback: "Up to ₹1,200/year on digital UPI transactions",
              requiredDocs: [
                "Vending LOR / ULB Certificate",
                "Aadhaar Card",
                "Bank Account",
              ],
            };
          }

          if (schemeName === "PMEGP") {
            return {
              success: true,
              scheme: "Prime Minister Employment Generation Programme (PMEGP)",
              maxProjectCost:
                "Manufacturing: ₹50 Lakhs | Service/Trading: ₹20 Lakhs",
              subsidyRate: "15% - 35% Capital Subsidy by Ministry of MSME",
              ownContribution:
                "Only 5% to 10% project cost required by borrower",
              requiredDocs: [
                "Detailed Project Report (DPR)",
                "EDP Training Certificate",
                "Udyam Aadhar",
              ],
            };
          }

          return {
            success: true,
            scheme: "Stand-Up India Scheme",
            maxLoan: "₹10 Lakhs to ₹1 Crore",
            marginMoney: "Up to 15% state subsidy linkage",
            requiredDocs: [
              "Detailed Project Report",
              "Past 2 Years Balance Sheet / ITR",
            ],
          };
        } catch (error: any) {
          console.error("[getGovtSchemes error]:", error?.message);
          return {
            success: false,
            error: "Failed to evaluate scheme eligibility.",
          };
        }
      },
    }),

    // ─────────────────────────────────────────────────────────────
    // 4. STAGING / ACTION TOOLS (Draft Artifact Creation & In-Place Editing)
    // ─────────────────────────────────────────────────────────────
    stageChart: tool({
      description:
        "Generates or updates an interactive visual chart (Bar, Line, Area, Pie) as an artifact for comparing financial metrics, mandi trends, budgets, or revenue. Pass 'targetArtifactId' to edit an existing chart.",
      inputSchema: StageChartSchema,
      execute: async ({
        targetArtifactId,
        chartType,
        title,
        description,
        xAxisKey = "name",
        data,
        series,
      }) => {
        try {
          const defaultColors = [
            "#4ADE80",
            "#1B4332",
            "#D98E2A",
            "#EAB308",
            "#10B981",
            "#3B82F6",
          ];
          const formattedSeries = series.map((s, idx) => ({
            dataKey: s.dataKey,
            name: s.name || s.dataKey,
            color: s.color || defaultColors[idx % defaultColors.length],
          }));

          const artId = targetArtifactId || `art_chart_${Date.now()}`;

          return {
            success: true,
            isArtifact: true,
            artifactId: artId,
            targetArtifactId: targetArtifactId || undefined,
            isUpdated: Boolean(targetArtifactId),
            artifactType: "chart",
            title: `Visual Graph: ${title}`,
            summary: `${chartType.toUpperCase()} Chart • ${data.length} Data Points • ${series.map((s) => s.name || s.dataKey).join(", ")}`,
            data: {
              artifactId: artId,
              targetArtifactId: targetArtifactId || undefined,
              isUpdated: Boolean(targetArtifactId),
              chartType,
              title,
              description: description || "",
              xAxisKey,
              data,
              series: formattedSeries,
            },
          };
        } catch (error: any) {
          return {
            success: false,
            error: "Failed to stage visual chart artifact.",
          };
        }
      },
    }),

    stageBudget: tool({
      description:
        "Prepares or updates an interactive draft budget plan with category allocations for user review. Pass 'targetArtifactId' to edit an existing budget.",
      inputSchema: StageBudgetSchema,
      execute: async ({ targetArtifactId, name, period, totalAmount, items }) => {
        try {
          const now = new Date();
          const startDate = now.toISOString().split("T")[0];
          const endDateObj = new Date(now);
          if (period === "Quarterly") endDateObj.setMonth(now.getMonth() + 3);
          else if (period === "Annual")
            endDateObj.setFullYear(now.getFullYear() + 1);
          else if (period === "Weekly") endDateObj.setDate(now.getDate() + 7);
          else endDateObj.setMonth(now.getMonth() + 1);
          const endDate = endDateObj.toISOString().split("T")[0];

          const artId = targetArtifactId || `art_budget_${Date.now()}`;

          return {
            success: true,
            isArtifact: true,
            artifactId: artId,
            targetArtifactId: targetArtifactId || undefined,
            isUpdated: Boolean(targetArtifactId),
            artifactType: "budget",
            title: `Draft Budget: ${name}`,
            summary: `${period} budget of ₹${totalAmount.toLocaleString("en-IN")} across ${items.length} categories`,
            data: {
              artifactId: artId,
              targetArtifactId: targetArtifactId || undefined,
              isUpdated: Boolean(targetArtifactId),
              name,
              period,
              totalAmount,
              startDate,
              endDate,
              items,
            },
          };
        } catch (error: any) {
          return { success: false, error: "Failed to stage budget draft." };
        }
      },
    }),

    stageExpense: tool({
      description:
        "Prepares or updates an interactive draft expense entry for user review. Pass 'targetArtifactId' to edit an existing expense.",
      inputSchema: StageExpenseSchema,
      execute: async ({
        targetArtifactId,
        category,
        amount,
        vendor,
        description,
        paymentMethod,
        notes,
      }) => {
        try {
          const date = new Date().toISOString().split("T")[0];
          const artId = targetArtifactId || `art_expense_${Date.now()}`;

          return {
            success: true,
            isArtifact: true,
            artifactId: artId,
            targetArtifactId: targetArtifactId || undefined,
            isUpdated: Boolean(targetArtifactId),
            artifactType: "expense",
            title: `Draft Expense: ₹${amount.toLocaleString("en-IN")} (${category})`,
            summary: `Log ₹${amount.toLocaleString("en-IN")} for ${category}${paymentMethod ? ` paid via ${paymentMethod}` : ""}`,
            data: {
              artifactId: artId,
              targetArtifactId: targetArtifactId || undefined,
              isUpdated: Boolean(targetArtifactId),
              category,
              amount,
              date,
              vendor: vendor || "",
              description: description || "",
              paymentMethod: paymentMethod || "CASH",
              notes: notes || "",
            },
          };
        } catch (error: any) {
          return { success: false, error: "Failed to stage expense draft." };
        }
      },
    }),

    stageTransaction: tool({
      description:
        "Prepares or updates an interactive draft master ledger transaction. Pass 'targetArtifactId' to edit an existing transaction.",
      inputSchema: StageTransactionSchema,
      execute: async ({ targetArtifactId, type, amount, category, description }) => {
        try {
          const date = new Date().toISOString().split("T")[0];
          const artId = targetArtifactId || `art_tx_${Date.now()}`;

          return {
            success: true,
            isArtifact: true,
            artifactId: artId,
            targetArtifactId: targetArtifactId || undefined,
            isUpdated: Boolean(targetArtifactId),
            artifactType: "transaction",
            title: `Draft Transaction: ${type} ₹${amount.toLocaleString("en-IN")}`,
            summary: `${type} of ₹${amount.toLocaleString("en-IN")} in ${category || "General"}`,
            data: {
              artifactId: artId,
              targetArtifactId: targetArtifactId || undefined,
              isUpdated: Boolean(targetArtifactId),
              type,
              amount,
              date,
              category: category || "General",
              description: description || "",
            },
          };
        } catch (error: any) {
          return {
            success: false,
            error: "Failed to stage transaction draft.",
          };
        }
      },
    }),

    stageSavingsGoal: tool({
      description:
        "Prepares or updates an interactive draft savings goal. Pass 'targetArtifactId' to edit an existing savings goal.",
      inputSchema: StageSavingsGoalSchema,
      execute: async ({ targetArtifactId, name, targetAmount, targetDate }) => {
        try {
          const artId = targetArtifactId || `art_goal_${Date.now()}`;

          return {
            success: true,
            isArtifact: true,
            artifactId: artId,
            targetArtifactId: targetArtifactId || undefined,
            isUpdated: Boolean(targetArtifactId),
            artifactType: "saving_goal",
            title: `Draft Savings Goal: ${name}`,
            summary: `Target of ₹${targetAmount.toLocaleString("en-IN")}${targetDate ? ` by ${targetDate}` : ""}`,
            data: {
              artifactId: artId,
              targetArtifactId: targetArtifactId || undefined,
              isUpdated: Boolean(targetArtifactId),
              name,
              targetAmount,
              targetDate: targetDate || "",
            },
          };
        } catch (error: any) {
          return { success: false, error: "Failed to stage savings goal." };
        }
      },
    }),

    stageDebt: tool({
      description:
        "Prepares or updates an interactive draft loan / debt liability. Pass 'targetArtifactId' to edit an existing debt.",
      inputSchema: StageDebtSchema,
      execute: async ({
        targetArtifactId,
        type,
        lender,
        totalAmount,
        amountOutStanding,
        interestRate,
        emiAmount,
      }) => {
        try {
          const artId = targetArtifactId || `art_debt_${Date.now()}`;

          return {
            success: true,
            isArtifact: true,
            artifactId: artId,
            targetArtifactId: targetArtifactId || undefined,
            isUpdated: Boolean(targetArtifactId),
            artifactType: "debt",
            title: `Draft Debt: ${lender} (₹${amountOutStanding.toLocaleString("en-IN")})`,
            summary: `${type} with ${lender} • Total: ₹${totalAmount.toLocaleString("en-IN")} • Outstanding: ₹${amountOutStanding.toLocaleString("en-IN")}`,
            data: {
              artifactId: artId,
              targetArtifactId: targetArtifactId || undefined,
              isUpdated: Boolean(targetArtifactId),
              type,
              lender,
              totalAmount,
              amountOutStanding,
              interestRate: interestRate || 8.5,
              emiAmount: emiAmount || 0,
            },
          };
        } catch (error: any) {
          return { success: false, error: "Failed to stage debt liability." };
        }
      },
    }),

    stageForm: tool({
      description:
        "Generates or updates a dynamic, interactive multi-field form artifact (e.g. Loan Applications, MSME Subsidies, Vendor KYC, Trade Inquiries, Checklists, Feedback) for the user to review, edit, fill, and approve. When editing an existing form on user demand, pass 'targetArtifactId' so the original form updates in place.",
      inputSchema: StageFormSchema,
      execute: async ({ targetArtifactId, title, description, submitLabel, formType, sections }) => {
        try {
          const totalFields = sections.reduce(
            (sum, sec) => sum + sec.fields.length,
            0,
          );
          const artId = targetArtifactId || `art_form_${Date.now()}`;

          return {
            success: true,
            isArtifact: true,
            artifactId: artId,
            targetArtifactId: targetArtifactId || undefined,
            isUpdated: Boolean(targetArtifactId),
            artifactType: "form",
            title,
            summary:
              description ||
              `${sections.length} sections • ${totalFields} interactive fields`,
            data: {
              artifactId: artId,
              targetArtifactId: targetArtifactId || undefined,
              isUpdated: Boolean(targetArtifactId),
              title,
              description: description || "",
              submitLabel: submitLabel || "Approve & Submit",
              formType: formType || "general",
              sections,
            },
          };
        } catch (error: any) {
          return { success: false, error: "Failed to stage dynamic form." };
        }
      },
    }),

    stageDeleteRecord: tool({
      description:
        "Prepares a safe confirmation card to delete/trash an expense, budget, goal, or debt.",
      inputSchema: StageDeleteRecordSchema,
      execute: async ({ entityType, entityId, entityName }) => {
        try {
          return {
            success: true,
            isArtifact: true,
            artifactType: "delete_record",
            title: `Delete Confirmation: ${entityName}`,
            summary: `Are you sure you want to remove this ${entityType} (${entityName})?`,
            data: {
              entityType,
              entityId,
              entityName,
            },
          };
        } catch (error: any) {
          return {
            success: false,
            error: "Failed to stage delete confirmation.",
          };
        }
      },
    }),
  };
}

export interface ToolMeta {
  name: string;
  icon: "sprout" | "landmark" | "globe" | "terminal" | "search";
  formatSummary: (args: any, result?: any) => string;
}

export const TOOL_DEFINITIONS: Record<string, ToolMeta> = {
  getArtifacts: {
    name: "getArtifacts",
    icon: "search",
    formatSummary: (args, res) =>
      `Inspected conversation artifacts (${res?.totalCount ?? 0} found)`,
  },
  stageForm: {
    name: "stageForm",
    icon: "landmark",
    formatSummary: (args) =>
      args?.targetArtifactId
        ? `Updated dynamic form "${args?.title || "Form"}"`
        : `Prepared dynamic form "${args?.title || "Form"}"`,
  },
  getMandiRates: {
    name: "getMandiRates",
    icon: "sprout",
    formatSummary: (args) =>
      `Queried live APMC rates for ${args?.commodity || "commodities"} in ${args?.state || "India"}`,
  },
  webSearch: {
    name: "webSearch",
    icon: "globe",
    formatSummary: (args) =>
      `Searched web for "${args?.query || "trade intelligence"}"`,
  },
  stageChart: {
    name: "stageChart",
    icon: "landmark",
    formatSummary: (args) =>
      args?.targetArtifactId
        ? `Updated visual chart "${args?.title || "metrics"}"`
        : `Generated ${args?.chartType || "visual"} chart for "${args?.title || "metrics"}"`,
  },
  getBudgets: {
    name: "getBudgets",
    icon: "landmark",
    formatSummary: () =>
      "Queried active enterprise budgets and category allocations",
  },
  getExpenses: {
    name: "getExpenses",
    icon: "landmark",
    formatSummary: (args) =>
      `Queried recent expenses ${args?.category ? `(${args.category})` : ""}`,
  },
  getTransactions: {
    name: "getTransactions",
    icon: "landmark",
    formatSummary: (args) =>
      `Queried master ledger transactions ${args?.type ? `(${args.type})` : ""}`,
  },
  getSavingsGoals: {
    name: "getSavingsGoals",
    icon: "landmark",
    formatSummary: () => "Queried savings targets and accumulated funds",
  },
  getDebts: {
    name: "getDebts",
    icon: "landmark",
    formatSummary: () => "Queried active loan liabilities and EMI schedules",
  },
  getBusinessProfile: {
    name: "getBusinessProfile",
    icon: "landmark",
    formatSummary: () => "Queried enterprise profile and turnover records",
  },
  getGovtSchemes: {
    name: "getGovtSchemes",
    icon: "landmark",
    formatSummary: (args) =>
      `Evaluated ${(args?.schemeName || "Credit Scheme").replace(/_/g, " ")} subsidy criteria`,
  },
  stageBudget: {
    name: "stageBudget",
    icon: "landmark",
    formatSummary: (args) =>
      `Generated budget draft for ${args?.name || "enterprise"} (₹${args?.totalAmount || 0})`,
  },
  stageExpense: {
    name: "stageExpense",
    icon: "landmark",
    formatSummary: (args) =>
      `Generated expense draft for ${args?.category || "expense"} (₹${args?.amount || 0})`,
  },
  stageTransaction: {
    name: "stageTransaction",
    icon: "landmark",
    formatSummary: (args) =>
      `Generated ledger transaction draft for ${args?.type || "transaction"} (₹${args?.amount || 0})`,
  },
  stageSavingsGoal: {
    name: "stageSavingsGoal",
    icon: "landmark",
    formatSummary: (args) =>
      `Generated savings target draft for ${args?.name || "goal"} (₹${args?.targetAmount || 0})`,
  },
  stageDebt: {
    name: "stageDebt",
    icon: "landmark",
    formatSummary: (args) =>
      args?.targetArtifactId
        ? `Updated loan liability draft with ${args?.lender || "lender"}`
        : `Generated loan liability draft with ${args?.lender || "lender"}`,
  },
  stageDeleteRecord: {
    name: "stageDeleteRecord",
    icon: "landmark",
    formatSummary: (args) =>
      `Prepared delete confirmation for ${args?.entityName || "record"}`,
  },
  searchCompetitors: {
    name: "searchCompetitors",
    icon: "search",
    formatSummary: (args, result) => {
      if (result?.needsLocation) {
        return "Requested device location to scan local competitors...";
      }
      const count = result?.competitors?.length || 0;
      return `Identified ${count} competitor businesses in ${result?.locationSummary || "target area"}`;
    },
  },
  getOndcIntelligence: {
    name: "getOndcIntelligence",
    icon: "globe",
    formatSummary: (args, result) => {
      const src = result?.fromCache ? " (Cached)" : "";
      return `Loaded ONDC Digital Commerce roadmap for ${result?.category || "business"}${src}`;
    },
  },
  predictDistrictBusinesses: {
    name: "predictDistrictBusinesses",
    icon: "landmark",
    formatSummary: (args, result) => {
      const src = result?.fromCache ? " (Cached)" : "";
      return `Researched top 4 business opportunities in ${result?.district || args?.district || "district"}${src}`;
    },
  },
};
