import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ReactQueryProvider } from "@/components/query-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "VyaparSetu — AI Hyper-Local Business Advisory & Financial Structuring",
  description:
    "AI-driven hyper-local business advisory and financial structuring assistant for rural micro-entrepreneurs. Transform grassroots commerce with intelligent credit structuring, scheme matching, and local market advisory.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased text-ink bg-cream min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          <ReactQueryProvider>
            {children}
            <Toaster position="bottom-right" />
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
