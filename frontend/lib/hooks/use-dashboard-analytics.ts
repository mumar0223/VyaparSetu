"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const CACHE_KEY = "vyaparsetu_dashboard_analytics_v3";
const ONE_HOUR_MS = 60 * 60 * 1000; // 1 hour TTL

export interface DashboardAnalyticsData {
  business: {
    name: string;
    category: string;
    industry: string;
    city: string;
    state: string;
    regNumber: string;
  };
  kpis: {
    healthScore: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    netProfit: number;
    profitMargin: number;
    runwayDays: number;
    liquidBuffer: number;
    totalOutstandingDebt: number;
    monthlyEmiBurden: number;
  };
  cashflowTrend: {
    month: string;
    inflow: number;
    outflow: number;
    net: number;
  }[];
  expenseCategories: {
    name: string;
    amount: number;
    color: string;
    percentage: number;
  }[];
  mandiRates: {
    commodity: string;
    mandi: string;
    ratePerQtl: number;
    change: string;
    trend: "up" | "down" | "stable";
    arrivalQty: string;
    advice: string;
  }[];
  savingsGoals: {
    id: string;
    name: string;
    targetAmount: number;
    savedAmount: number;
    progress: number;
    targetDate: string;
  }[];
  debts: {
    id: string;
    lender: string;
    amountOutStanding: number;
    totalAmount: number;
    emiAmount: number;
    interestRate: number;
    nextPaymentDate: string;
    status: string;
  }[];
  aiActionItems: {
    id: string;
    type: string;
    badge: string;
    title: string;
    desc: string;
    prompt: string;
  }[];
  timestamp: number;
}

export function useDashboardAnalytics() {
  const [data, setData] = useState<DashboardAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const hasDataRef = useRef<boolean>(false);
  hasDataRef.current = data !== null;

  const fetchAnalytics = useCallback(async (force = false) => {
    // 1. Check local cache first if not forced
    if (!force && typeof window !== "undefined") {
      try {
        const cachedRaw = localStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          const age = Date.now() - (cached.timestamp || 0);
          if (age < ONE_HOUR_MS && cached.data) {
            setData(cached.data);
            setLastFetched(cached.timestamp);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to read dashboard cache:", err);
      }
    }

    if (hasDataRef.current) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch("/api/analytics/dashboard");
      if (!res.ok) throw new Error("Failed to load analytics data");
      const resData: DashboardAnalyticsData = await res.json();

      setData(resData);
      setLastFetched(Date.now());

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ timestamp: Date.now(), data: resData })
          );
        } catch {
          // Ignore localStorage quota errors
        }
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err instanceof Error ? err.message : "Error fetching analytics");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    isRefreshing,
    error,
    lastFetched,
    refetch: () => fetchAnalytics(true),
  };
}
