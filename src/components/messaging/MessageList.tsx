import { cn } from "@/lib/utils";
import { File } from "@prisma/client";
import { Message } from "ai/react";
import { Loader2 } from "lucide-react";

interface Props {
    messages: Message[];
    isLoading?: boolean;
    isLoadingFiles: boolean;
    isPDFSelected: boolean;
    files: File[];
    userFirstName: string | null;
    isExceedingFreeTier: boolean;
}

export default function MessageList({
    messages,
    isPDFSelected,
    isLoading,
    isLoadingFiles,
    userFirstName,
    isExceedingFreeTier,
}: Props) {
    if (isLoadingFiles || (isPDFSelected && isLoading)) {
        return (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        );
    }

    if (!isPDFSelected || messages.length < 1) {
        return (
            <div className="flex-1">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
                    <div className="flex flex-col items-center gap-2 text-center text-gray-300">
                        <h1 className="text-xl font-bold tracking-tight sm:text-4xl">
                            DocuMate
                        </h1>
                        <p className="max-w-sm text-sm text-gray-500">
                            Select a PDF to view the document and ask questions
                            about it.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col gap-2 px-4">
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={cn("my-4 flex gap-3 text-sm text-gray-300", {
                        "justify-end": message.role.toLowerCase() === "user",
                        "justify-start":
                            message.role.toLowerCase() === "assistant",
                    })}
                >
                    <div
                        className={cn(
                            "rounded bg-white px-3 py-1 text-sm text-gray-800 shadow-md ring-1 ring-gray-900/10",
                            {
                                "bg-black text-gray-100":
                                    message.role.toLowerCase() === "user",
                            }
                        )}
                    >
                        <p className="leading-relaxed">
                            <span
                                className={
                                    message.role.toLowerCase() === "user"
                                        ? "block text-right font-bold text-gray-100"
                                        : "block text-left font-bold text-gray-700"
                                }
                            >
                                {message.role.toLowerCase() === "user"
                                    ? userFirstName || "You"
                                    : "DocuMate"}{" "}
                            </span>

                            {message.content}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
