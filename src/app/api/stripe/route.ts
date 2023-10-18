import { db } from "@/db";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

function absoluteUrl(path: string) {
    if (typeof window !== "undefined") return path;
    if (process.env.NEXT_PUBLIC_BASE_URL)
        return `https://${process.env.NEXT_PUBLIC_BASE_URL}${path}`;
    return `http://localhost:${process.env.PORT ?? 3000}${path}`;
}

export async function GET(): Promise<Response> {
    try {
        const { userId } = auth();

        if (!userId) {
            return new Response("Unauthorized", { status: 401 });
        }

        const dbUser = await db.user.findFirst({
            where: {
                id: userId,
            },
        });

        if (!dbUser) {
            return new Response(
                JSON.stringify({
                    isSubscribed: false,
                    isCanceled: false,
                }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        }

        const returnUrl = absoluteUrl("/");

        return NextResponse.json({
            url: returnUrl,
        });
    } catch (error) {
        console.error("Stripe error", error);
        return new Response("Internal server error", { status: 500 });
    }
}
