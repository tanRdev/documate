import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import LayoutWrapper from "@/components/LayoutWrapper";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "DocuMate — AI Document Assistant",
    description:
        "Chat with your PDFs using AI. Upload documents, ask questions, and get answers grounded in the actual content.",
};

export default function Home() {
    return (
        <LayoutWrapper className="flex h-[calc(100vh-72px)] flex-col items-center justify-center text-center">
            <div className="bg-white-50 absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="mb-4 flex max-w-fit items-center justify-center space-x-2 overflow-hidden rounded-full border border-blue-200 bg-blue-50 px-7 py-2 shadow-sm backdrop-blur transition-all">
                <p className="text-sm text-blue-900">
                    AI-powered document chat
                </p>
            </div>

            <div>
                <h1 className="max-w-4xl text-5xl font-medium md:text-6xl lg:text-7xl">
                    Chat with your <span className="text-blue-600">PDFs</span>
                </h1>
                <p className="mt-5 max-w-2xl text-zinc-700 sm:text-lg">
                    Upload a document, ask questions, and get answers grounded
                    in the actual content — not hallucinated.
                </p>
            </div>

            <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-x-6">
                <Link
                    className={buttonVariants({
                        variant: "default",
                        size: "lg",
                        className: "mt-5",
                    })}
                    href="/dashboard"
                >
                    <p className="text-lg font-semibold">Get Started</p>
                </Link>
                <Link
                    className={buttonVariants({
                        variant: "outline",
                        size: "lg",
                        className: "mt-5",
                    })}
                    href="/pricing"
                >
                    <p className="text-lg font-semibold">View Plans</p>
                </Link>
            </div>
        </LayoutWrapper>
    );
}
