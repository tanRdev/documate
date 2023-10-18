import { db } from "@/db";
import { deleteFromS3, getS3Url, getSignedUploadUrl } from "@/lib/aws/s3-server";
import { checkSubscription } from "@/lib/stripe/stripe";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const FREE_TIER_FILE_LIMIT = 10;
const STALE_UPLOAD_WINDOW_MS = 60 * 60 * 1000;

function buildFileId(fileName: string) {
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "-");
    return `uploads/${Date.now()}-${crypto.randomUUID()}-${sanitizedName}`;
}

async function cleanupStalePendingUploads(userId: string) {
    const staleUploads = await db.file.findMany({
        where: {
            userId,
            uploadStatus: "PENDING",
            createdAt: {
                lt: new Date(Date.now() - STALE_UPLOAD_WINDOW_MS),
            },
        },
    });

    for (const file of staleUploads) {
        try {
            await deleteFromS3(file.id);
        } catch (error) {
            console.error(error);
        }
    }

    if (staleUploads.length > 0) {
        await db.file.deleteMany({
            where: {
                id: {
                    in: staleUploads.map((file) => file.id),
                },
            },
        });
    }
}

export async function POST(req: Request) {
    const { userId } = auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { fileName, contentType, fileSize } = await req.json();

        await cleanupStalePendingUploads(userId);

        if (!fileName || !contentType) {
            return NextResponse.json(
                { error: "Missing upload data." },
                { status: 400 }
            );
        }

        if (contentType !== "application/pdf") {
            return NextResponse.json(
                { error: "Only PDF uploads are supported." },
                { status: 400 }
            );
        }

        if (typeof fileSize === "number" && fileSize > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "File too large." },
                { status: 400 }
            );
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
            return NextResponse.json(
                { error: "Free tier file limit reached." },
                { status: 403 }
            );
        }

        const fileId = buildFileId(fileName);
        const upload = await getSignedUploadUrl(
            fileId,
            contentType,
            MAX_FILE_SIZE,
            userId
        );

        await db.file.create({
            data: {
                id: fileId,
                key: fileId,
                name: fileName,
                url: getS3Url(fileId),
                userId,
                uploadStatus: "PENDING",
            },
        });

        return NextResponse.json(
            {
                fileId,
                fileName,
                uploadUrl: upload.url,
                fields: upload.fields,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Could not prepare upload." },
            { status: 500 }
        );
    }
}
