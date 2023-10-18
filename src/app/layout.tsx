import { cn } from "@/lib/utils";
import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider, auth } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";
import Providers from "@/components/Providers";
import "react-loading-skeleton/dist/skeleton.css";
import "simplebar-react/dist/simplebar.min.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";

const plusJakartaSans = Plus_Jakarta_Sans({
    weight: ["300", "400", "500", "700"],
    subsets: ["latin"],
});

interface RootProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: "DocuMate",
    description: "AI-powered document chat — upload PDFs and get answers grounded in the actual content.",
    icons: {
        icon: "/favicon.png",
    },
};

export default function RootLayout({ children }: RootProps) {
    const { userId } = auth();

    return (
        <ClerkProvider>
            <Providers>
                <html lang="en" className="light">
                    <body
                        className={cn(
                            "bg-white-50 min-h-screen antialiased",
                            plusJakartaSans.className
                        )}
                    >
                        <Navbar userId={userId} />
                        {children}
                        <Toaster />
                    </body>
                </html>
            </Providers>
        </ClerkProvider>
    );
}
