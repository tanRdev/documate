import { db } from "@/db";
import { getContext } from "@/lib/pinecone/pinecone";
import { auth } from "@clerk/nextjs";
import { Message, OpenAIStream, StreamingTextResponse } from "ai";
import { NextResponse } from "next/server";
import {
    ChatCompletionRequestMessage,
    Configuration,
    OpenAIApi,
} from "openai-edge";

const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);
function buildPrompt(context: string): ChatCompletionRequestMessage {
    return {
        role: "system",
        content: `You are DocuMate, a document assistant that answers questions using the provided document context.

START CONTEXT BLOCK
${context}
END CONTEXT BLOCK

Use the context block when it contains the answer.
If the context does not contain the answer, say "I'm sorry, but I don't know the answer to that question." Do not invent details that are not grounded in the document.`,
    };
}

export async function POST(req: Request) {
    try {
        const { userId } = auth();

        if (!userId) {
            return new Response("Unauthorized", { status: 401 });
        }

        const { messages, fileId } = await req.json();

        if (!Array.isArray(messages) || !fileId) {
            return NextResponse.json(
                { error: "Invalid request body." },
                { status: 400 }
            );
        }

        const file = await db.file.findFirst({
            where: {
                id: fileId,
                userId,
                uploadStatus: "SUCCESS",
            },
        });

        if (!file) {
            return new Response("Not found", { status: 404 });
        }

        const latestMessage = [...messages]
            .reverse()
            .find((message: Message) => message.role === "user");

        if (!latestMessage) {
            return NextResponse.json(
                { error: "Missing message." },
                { status: 400 }
            );
        }

        const messageHistory = await db.message.findMany({
            where: {
                fileId,
                userId,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        const context = await getContext(latestMessage.content, fileId);
        const historyMessages: ChatCompletionRequestMessage[] = messageHistory
            .filter(
                (message) =>
                    message.role === "USER" || message.role === "ASSISTANT"
            )
            .map((message) => {
                if (message.role === "USER") {
                    return {
                        role: "user",
                        content: message.content,
                    };
                }

                return {
                    role: "assistant",
                    content: message.content,
                };
            });

        const promptMessages: ChatCompletionRequestMessage[] = [
            ...historyMessages,
            {
                role: "user",
                content: latestMessage.content,
            },
        ];

        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            temperature: 0,
            messages: [buildPrompt(context), ...promptMessages],
            stream: true,
        });

        const stream = OpenAIStream(response, {
            onStart: async () => {
                await db.message.create({
                    data: {
                        content: latestMessage.content,
                        role: "USER",
                        userId,
                        fileId,
                    },
                });
            },
            onCompletion: async (completion) => {
                await db.message.create({
                    data: {
                        content: completion,
                        role: "ASSISTANT",
                        userId,
                        fileId,
                    },
                });
            },
        });

        return new StreamingTextResponse(stream);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "An error occurred during processing" },
            { status: 500 }
        );
    }
}
