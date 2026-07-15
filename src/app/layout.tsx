import { AiFloatingButtonLazy } from "@/components/ai/ai-floating-button-lazy";
import { AuthProvider } from "@/providers/auth-provider";
import { ModalProvider } from "@/providers/modal-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { SITE } from "@/lib/constants";
import type { Metadata } from "next";
import { Alexandria, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";

const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-alexandria",
  display: "swap",
});

const notoNaskh = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["500", "600", "700"],
  variable: "--font-editorial",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${SITE.name} | ${SITE.tagline}`,
  description: SITE.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${alexandria.variable} ${notoNaskh.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <ModalProvider>
              {children}
              <AiFloatingButtonLazy />
            </ModalProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
