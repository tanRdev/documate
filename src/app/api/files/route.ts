import { db } from "@/db";
import {
    deleteFromS3,
    getS3ObjectUserId,
    getS3Url,
} from "@/lib/aws/s3-server";
import { deleteFromPinecone, uploadToPinecone } from "@/lib/pinecone/pinecone";
import { checkSubscription } from "@/lib/stripe/stripe";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

const FREE_TIER_FILE_LIMIT = 10;

export async function POST(req: Request) {
    const { userId } = auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let fileId = "";

    try {
        const body = await req.json();
        fileId = body.fileId;
        const fileName = body.fileName;

        if (!fileId || !fileName) {
            return NextResponse.json(
                { error: "Missing file data." },
                { status: 400 }
            );
        }

        const uploadUserId = await getS3ObjectUserId(fileId);

        if (uploadUserId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [fileCount, isSubscribed] = await Promise.all([
            db.file.count({
                where: {
                    userId,
                    uploadStatus: {
                        not: "FAILED",
                    },
                },
            }),
            checkSubscription(),
        ]);

        if (!isSubscribed && fileCount >= FREE_TIER_FILE_LIMIT) {
            await deleteFromS3(fileId);
            await db.file.deleteMany({
                where: {
                    id: fileId,
                    userId,
                },
            });

            return NextResponse.json(
                { error: "Free tier file limit reached." },
                { status: 403 }
            );
        }

        const file = await db.file.findFirst({
            where: {
                id: fileId,
                userId,
                uploadStatus: "PENDING",
            },
        });

        if (!file) {
            await deleteFromS3(fileId);

            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await db.file.update({
            where: {
                id: fileId,
            },
            data: {
                uploadStatus: "PROCESSING",
            },
        });

        await uploadToPinecone(fileId);

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        if (fileId) {
            try {
                await deleteFromS3(fileId);
                await db.file.deleteMany({
                    where: {
                        id: fileId,
                        userId,
                    },
                });
            } catch (cleanupError) {
                console.error(cleanupError);
            }
        }

        console.error(error);

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function GET() {
    const { userId } = auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const files = await db.file.findMany({
            where: {
                userId,
                uploadStatus: "SUCCESS",
            },
        });

        return NextResponse.json(
            files.map((file) => ({
                ...file,
                url: getS3Url(file.id),
            })),
            { status: 200 }
        );
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    const { userId } = auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
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

        await deleteFromS3(file.id);
        await deleteFromPinecone(file.id);

        await db.file.delete({
            where: {
                id: file.id,
            },
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
