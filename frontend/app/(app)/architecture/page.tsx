import { Workflow } from "lucide-react";

export default function ArchitecturePage() {
  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="p-6 rounded-2xl border border-border bg-card">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Workflow className="size-6 text-primary" /> VyaparSetu Architecture
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Multilingual NLP pipelines, financial structuring engines, and secure banking protocol integrations
          </p>
        </div>

        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40 flex flex-col items-center justify-center gap-3">
          <div className="size-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
            <Workflow className="size-6" />
          </div>
          <h3 className="font-semibold text-lg text-foreground">Infrastructure Overview</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Next.js App Router, Neon PostgreSQL, PBKDF2 cryptography, regional Mandi pricing APIs, and WhatsApp conversational AI integrations.
          </p>
        </div>
      </div>
    </div>
  );
}

