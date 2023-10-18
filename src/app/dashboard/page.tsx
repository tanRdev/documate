import React from "react";
import UserDashboard from "@/components/UserDashboard";
import { checkSubscription } from "@/lib/stripe/stripe";

interface DashboardProps {}

export default async function Page({}: DashboardProps) {
    const isSubscribed = await checkSubscription();

    return (
        <div className="flex w-full">
            <div className="w-full flex-col">
                <UserDashboard isSubscribed={isSubscribed} />
            </div>
        </div>
    );
}
