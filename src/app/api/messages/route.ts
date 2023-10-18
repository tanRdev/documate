import { db } from "@/db";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
    try {
        const { userId } = auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { fileId } = await req.json();

        if (!fileId) {
            return NextResponse.json(
                { error: "Missing file id." },
                { status: 400 }
            );
        }

        const file = await db.file.findFirst({
            where: {
                id: fileId,
                userId,
            },
        });

        if (!file) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
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

        return NextResponse.json(
            messageHistory.map((message) => ({
                id: message.id,
                content: message.content,
                role: message.role.toLowerCase(),
            }))
        );
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "An error occurred when fetching message history." },
            { status: 500 }
        );
    }
};
