import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="h-full flex flex-col pt-16 sm:pt-16 md:pt-16 lg:pt-8 p-4 md:p-6 lg:p-8 overflow-hidden font-sans space-y-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-24 rounded-2xl bg-white/40 dark:bg-card/40 border border-sage/20 dark:border-border" />
        <Skeleton className="h-24 rounded-2xl bg-white/40 dark:bg-card/40 border border-sage/20 dark:border-border" />
        <Skeleton className="h-24 rounded-2xl bg-white/40 dark:bg-card/40 border border-sage/20 dark:border-border" />
        <Skeleton className="h-24 rounded-2xl bg-white/40 dark:bg-card/40 border border-sage/20 dark:border-border" />
      </div>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 bg-white/40 dark:bg-card/40 rounded-2xl border border-sage/20 dark:border-border p-6 shadow-xs space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}
