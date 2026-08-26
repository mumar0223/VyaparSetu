import { tool } from "ai";
import { z } from "zod";
import type { ToolContext } from "./types";

/**
 * Agent Tools Registry
 * Defines domain tools for VyaparSetu's autonomous business advisor.
 */
export function getAgentTools(ctx?: ToolContext) {
  return {
    getMandiRates: tool({
      description: "Fetches real-time mandi prices, APMC market arrivals, and price trends for agricultural and trade commodities.",
      parameters: z.object({
        commodity: z.string().describe("Name of commodity e.g. Onion, Wheat, Cotton, Mustard, Tomato"),
        state: z.string().optional().describe("State or district e.g. Maharashtra, Madhya Pradesh, Gujarat"),
      }),
      execute: async ({ commodity, state }) => {
        console.log(`[TOOL:getMandiRates] Fetching rates for "${commodity}" in ${state || "all regions"}...`);
        
        // Mock dynamic realistic data
        const basePrices: Record<string, number> = {
          onion: 1850,
          wheat: 2420,
          cotton: 7150,
          mustard: 5300,
          tomato: 1200,
          soybean: 4600,
        };

        const key = commodity.toLowerCase();
        const avgPrice = basePrices[key] || 2200;
        const minPrice = Math.round(avgPrice * 0.92);
        const maxPrice = Math.round(avgPrice * 1.08);

        return {
          commodity,
          region: state || "Nashik / Indore APMC Market",
          modalPricePerQuintal: `₹${avgPrice}`,
          priceRange: `₹${minPrice} - ₹${maxPrice} / quintal`,
          trend: "Bullish (+3.4% this week)",
          marketArrivals: "420 Quintals (Moderate)",
          recommendation: avgPrice > 2000 ? "Favorable market conditions for immediate selling" : "Hold stock if dry storage is available",
        };
      },
    }),

    evaluateSchemeEligibility: tool({
      description: "Evaluates micro-enterprise eligibility for Indian government credit and subsidy schemes (PM Mudra, PM SVANidhi, Stand-Up India).",
      parameters: z.object({
        schemeName: z.enum(["PM_MUDRA", "PM_SVANIDHI", "STAND_UP_INDIA"]).describe("Government scheme to evaluate"),
        annualTurnover: z.number().describe("Annual turnover / sales in INR"),
        yearsOperating: z.number().optional().default(2).describe("Years in business operation"),
      }),
      execute: async ({ schemeName, annualTurnover, yearsOperating = 2 }) => {
        console.log(`[TOOL:evaluateSchemeEligibility] Evaluating ${schemeName} for turnover ₹${annualTurnover}...`);

        if (schemeName === "PM_MUDRA") {
          const category = annualTurnover < 500000 ? "Shishu (up to ₹50,000)" : annualTurnover < 2500000 ? "Kishore (₹50k - ₹5 Lakhs)" : "Tarun (₹5 Lakhs - ₹10 Lakhs)";
          return {
            scheme: "PM Mudra Yojana (PMMY)",
            eligible: true,
            recommendedCategory: category,
            maxLoanAmount: category.startsWith("Shishu") ? "₹50,000" : category.startsWith("Kishore") ? "₹5,00,000" : "₹10,00,000",
            collateralRequired: "Zero collateral (covered under CGFMU)",
            interestRateRange: "8.40% - 11.15% p.a.",
            requiredDocuments: [
              "Udyam Aadhar Registration",
              "6-Month Bank / UPI Cash Flow Statement",
              "KYC (Aadhaar & PAN)",
              "Business Quotation / Machinary Invoice",
            ],
          };
        }

        if (schemeName === "PM_SVANIDHI") {
          return {
            scheme: "PM SVANidhi (Street Vendor / Micro Seller)",
            eligible: true,
            firstTranche: "₹10,000 (Interest subsidy of 7% on timely repayment)",
            secondTranche: "₹20,000 (after 1st loan clearance)",
            digitalCashback: "Up to ₹1,200/year on UPI transactions",
            requiredDocuments: ["Vending Certificate / Urban Local Body LOR", "Aadhaar Card"],
          };
        }

        return {
          scheme: "Stand-Up India Scheme",
          eligible: yearsOperating >= 1,
          maxLoanAmount: "₹10 Lakhs to ₹1 Crore",
          marginMoney: "Up to 15% state subsidy linkage",
          requiredDocuments: ["Detailed Project Report (DPR)", "Past 2 Years ITR / P&L", "Proof of Manufacturing / Trading Unit"],
        };
      },
    }),
  };
}

export type AgentTools = ReturnType<typeof getAgentTools>;
export const agentTools = getAgentTools();
