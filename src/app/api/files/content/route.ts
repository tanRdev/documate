import { db } from "@/db";
import { getSignedReadUrl } from "@/lib/aws/s3-server";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { userId } = auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
        return NextResponse.json({ error: "Missing file id." }, { status: 400 });
    }

    const file = await db.file.findFirst({
        where: {
            id: fileId,
            userId,
            uploadStatus: {
                not: "FAILED",
            },
        },
    });

    if (!file) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const signedUrl = await getSignedReadUrl(file.id);

    return NextResponse.redirect(signedUrl);
}
