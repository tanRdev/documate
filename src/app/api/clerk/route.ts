import { db } from "@/db";
import { IncomingHttpHeaders } from "http";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook, WebhookRequiredHeaders } from "svix";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || "";

async function handler(request: Request) {
    if (request.method !== "POST") {
        return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    }

    const payload = await request.json();
    const headersList = headers();
    const heads = {
        "svix-id": headersList.get("svix-id"),
        "svix-timestamp": headersList.get("svix-timestamp"),
        "svix-signature": headersList.get("svix-signature"),
    };
    const wh = new Webhook(webhookSecret);
    let evt: Event | null = null;

    try {
        evt = wh.verify(
            JSON.stringify(payload),
            heads as IncomingHttpHeaders & WebhookRequiredHeaders
        ) as Event;
    } catch (err) {
        console.error((err as Error).message);
        return NextResponse.json({}, { status: 400 });
    }

    const eventType: EventType = evt.type;
    if (eventType === "user.created" || eventType === "user.updated") {
        const { id, ...attributes } = evt.data;
        const emailAddresses = attributes.email_addresses;
        // @ts-ignore
        const emailAddress = emailAddresses[0].email_address;

        // Save user to DB after login
        await db.user.upsert({
            where: { id: id as string },
            create: {
                id: id as string,
                email: emailAddress,
            },
            update: {
                id: id as string,
                email: emailAddress,
            },
        });
    }

    return NextResponse.json({ received: true }, { status: 200 });
}

type EventType = "user.created" | "user.updated" | "*";

type Event = {
    data: Record<string, string | number>;
    object: "event";
    type: EventType;
};

export const POST = handler;
