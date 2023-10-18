import React from "react";
import { buttonVariants } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { checkSubscription } from "@/lib/stripe/stripe";
import { Check } from "lucide-react";
import SubscribeBtn from "@/components/SubscribeBtn";
import { auth } from "@clerk/nextjs";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pricing — DocuMate",
    description: "Choose a plan that fits your document chat needs.",
};

const pricingPlans = [
    {
        name: "Starter",
        price: "$0",
        description: "Everything you need to get started",
        features: [
            "Send up to 5 messages per PDF",
            "Add up to 10 PDFs",
            "Chat with your uploaded PDFs",
        ],
    },
    {
        name: "Pro",
        price: "$29.99",
        description: "For power users who need more",
        features: [
            "Send unlimited messages per PDF",
            "Add unlimited PDFs",
            "Chat with your uploaded PDFs",
            "Unlock deeper document analysis",
            "Priority support",
        ],
    },
];

export default async function Page() {
    const { userId } = auth();
    const isSubscribed = await checkSubscription();

    return (
        <section className="relative z-20 overflow-hidden bg-white pb-12 pt-20 lg:pb-[90px] lg:pt-[120px]">
            <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />
            <div>
                <div className="-mx-4 flex flex-wrap">
                    <div className="w-full px-4">
                        <div className="mx-auto mb-[60px] max-w-[510px] text-center lg:mb-20">
                            <span className="text-primary mb-2 block text-lg font-semibold">
                                Pricing
                            </span>
                            <h1 className="text-dark mb-4 text-3xl font-bold sm:text-4xl md:text-[40px] ">
                                Simple, transparent pricing
                            </h1>
                            <p className="text-body-color text-base">
                                Start for free. Upgrade when you need more.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-col justify-center space-y-12 px-4 sm:-mx-4 sm:flex sm:flex-row sm:space-x-12 sm:space-y-0 sm:px-0">
                    {pricingPlans.map((plan) => (
                        <Card
                            key={plan.name}
                            className={plan.name === "Starter" ? "sm:relative" : ""}
                        >
                            <CardHeader>
                                <CardTitle>
                                    <span className="text-primary mb-4 block text-lg font-semibold">
                                        {plan.name}
                                    </span>
                                    <h2 className="text-dark mb-5 text-[42px] font-bold">
                                        {plan.price}
                                        <span className="text-body-color text-base font-medium">
                                            / month
                                        </span>
                                    </h2>
                                </CardTitle>
                                <CardDescription>
                                    <p className="text-body-color border-b border-[#F2F2F2] pb-8 text-base">
                                        {plan.description}
                                    </p>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-col space-y-2">
                                {plan.features.map((feature) => (
                                    <div key={feature} className="flex space-x-2">
                                        <Check className="text-green-500" />
                                        <p className="text-body-color mb-1 text-sm leading-loose sm:text-base">
                                            {feature}
                                        </p>
                                    </div>
                                ))}
                            </CardContent>
                            <CardFooter
                                className={
                                    plan.name === "Starter"
                                        ? "bottom-0 sm:absolute sm:inset-x-0"
                                        : ""
                                }
                            >
                                {plan.name === "Starter" ? (
                                    <Link
                                        href="/sign-up"
                                        className={buttonVariants({
                                            variant: "outline",
                                            size: "lg",
                                            className: "w-full",
                                        })}
                                    >
                                        <p>Get Started Free</p>
                                    </Link>
                                ) : userId ? (
                                    <SubscribeBtn isSubscribed={isSubscribed} />
                                ) : (
                                    <SubscribeBtn isSubscribed={isSubscribed} />
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
