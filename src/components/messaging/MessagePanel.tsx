import React from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useChat } from "ai/react";
import MessageList from "./MessageList";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { File } from "@prisma/client";

interface Props {
    fileName: string;
    fileId: string;
    isPDFSelected: boolean;
    files: File[];
    isLoadingFiles: boolean;
    userFirstName: string | null;
}

export default function MessagePanel({
    files,
    fileName,
    fileId,
    isPDFSelected,
    isLoadingFiles,
    userFirstName,
}: Props) {
    const [hydratedFileId, setHydratedFileId] = React.useState("");

    const { data, isLoading } = useQuery({
        queryKey: ["messages", fileId],
        queryFn: async () => {
            if (!fileId) {
                return [];
            }

            const response = await axios.post("/api/messages", {
                fileId,
            });

            return response.data;
        },
        enabled: Boolean(fileId),
    });

    const {
        input,
        handleInputChange,
        handleSubmit,
        messages,
        setMessages,
    } = useChat({
        api: "/api/message",
        body: {
            fileId,
        },
        initialMessages: data || [],
    });

    React.useEffect(() => {
        if (!fileId || !data || hydratedFileId === fileId) {
            return;
        }

        setMessages(data);
        setHydratedFileId(fileId);
    }, [data, fileId, hydratedFileId, setMessages]);

    return (
        <div className="relative h-full w-full bg-gray-50 p-4">
            <div className="flex flex-col p-6">
                <MessageList
                    messages={messages}
                    isPDFSelected={isPDFSelected}
                    isLoading={isLoading}
                    files={files}
                    isLoadingFiles={isLoadingFiles}
                    userFirstName={userFirstName}
                    isExceedingFreeTier={false}
                />
            </div>

            <div className="absolute inset-x-0 bottom-0 px-6 py-2">
                <form
                    className="flex w-full items-center justify-center space-x-2"
                    onSubmit={handleSubmit}
                    id="message-input"
                >
                    <Input
                        className="flex h-10 w-full rounded-md border border-gray-800 bg-transparent px-3 py-2 text-sm text-gray-800 placeholder-gray-800 focus:outline-none focus:ring-2 focus:ring-[#9ca3af] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder={
                            isPDFSelected
                                ? `Ask about ${fileName || "your PDF"}`
                                : "Select a PDF to start chatting"
                        }
                        value={input}
                        onChange={handleInputChange}
                        disabled={!isPDFSelected || isLoading}
                    />
                    <Button
                        className="inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-gray-200 disabled:pointer-events-none disabled:opacity-50"
                        disabled={!isPDFSelected || isLoading}
                    >
                        Send
                    </Button>
                </form>
                <div className="mt-2 flex justify-center pb-1">
                    <h2 className="text-xs text-gray-600">Powered by OpenAI</h2>
                </div>
            </div>
        </div>
    );
}
