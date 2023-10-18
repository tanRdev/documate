"use client";

import React from "react";
import { Button } from "./ui/button";
import axios from "axios";
import { Loader2 } from "lucide-react";

interface SubscribeBtnProps {
    isSubscribed?: boolean;
}

export default function SubscribeBtn({ isSubscribed }: SubscribeBtnProps) {
    const [loading, setLoading] = React.useState(false);

    const handleSubscription = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/stripe");
            window.location.href = response.data.url;
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            disabled={loading}
            onClick={handleSubscription}
            variant="outline"
            className="w-full"
        >
            {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            ) : isSubscribed ? (
                "Manage Plan"
            ) : (
                "Upgrade"
            )}
        </Button>
    );
}
