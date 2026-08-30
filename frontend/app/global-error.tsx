"use client";

import { RotateCcw, AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF6EB] text-[#1A1A1A] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl border border-[#A8E3D1]/40 shadow-xl">
          <div className="size-16 rounded-2xl bg-[#D98E2A]/10 border border-[#D98E2A]/30 text-[#D98E2A] flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="size-8 text-[#D98E2A]" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#1B4332] mb-2">
            System Error Encountered
          </h1>
          <p className="text-xs text-[#5B6660] mb-6">
            A critical application error occurred. Please refresh or attempt to reset the session.
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-3 bg-[#1B4332] hover:bg-[#0B4632] text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <RotateCcw className="size-4" /> Reset Application
          </button>
        </div>
      </body>
    </html>
  );
}
