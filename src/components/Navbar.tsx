"use client";

import { UserButton } from "@clerk/nextjs";
import React from "react";
import Link from "next/link";
import { buttonVariants } from "./ui/button";
import {
    ChevronDown,
    ListMinus,
    CreditCard,
    User2,
    UserPlus,
    LayoutDashboard,
    Home,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "./ui/separator";
import { usePathname } from "next/navigation";

interface Props {
    userId: string | null;
}

export default function Navbar({ userId }: Props) {
    const pathname = usePathname();
    const isDashboard = pathname === "/dashboard";

    return (
        <>
            <nav className="h-18 block w-full border-b border-gray-200 py-4 backdrop-blur-lg transition-all sm:hidden">
                <div
                    className={`flex items-center justify-center ${
                        userId ? "justify-between px-8" : ""
                    }`}
                >
                    <Dialog>
                        <DialogTrigger className="flex items-center justify-center">
                            <h2 className="ml-3 text-lg font-medium uppercase tracking-wide text-white">
                                DocuMate
                            </h2>
                            <ListMinus className="h-4 w-4" />
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </DialogTrigger>

                        <DialogContent className="bg-white-100 shadow-lg">
                            <DialogHeader>
                                <div className="mb-2 flex items-center justify-center">
                                    <h2 className="ml-3 text-lg font-medium uppercase tracking-wide text-white">
                                        DocuMate
                                    </h2>
                                    <ListMinus className="h-4 w-4" />
                                </div>
                            </DialogHeader>
                            <Separator />
                            <ul className="flex-col justify-center">
                                <li>
                                    <Link
                                        href="/"
                                        className={buttonVariants({
                                            variant: "ghost",
                                            size: "lg",
                                            className: "mb-2 mt-2 text-xl",
                                        })}
                                    >
                                        <Home className="mr-2 h-6 w-6" />
                                        Home
                                    </Link>
                                </li>
                                {userId ? (
                                    <div>
                                        <li>
                                            <Link
                                                href="/dashboard"
                                                className={buttonVariants({
                                                    variant: "ghost",
                                                    size: "lg",
                                                    className: "text-xl",
                                                })}
                                            >
                                                <LayoutDashboard className="mr-2 h-6 w-6" />
                                                Dashboard
                                            </Link>
                                        </li>
                                    </div>
                                ) : (
                                    <div>
                                        <li>
                                            <Link
                                                href="/sign-in"
                                                className={buttonVariants({
                                                    variant: "ghost",
                                                    size: "lg",
                                                    className:
                                                        "flex cursor-pointer items-center text-xl",
                                                })}
                                            >
                                                <User2 className="mr-2 h-6 w-6" />
                                                Sign in
                                            </Link>
                                        </li>
                                        <li className="mt-2">
                                            <Link
                                                href="/sign-up"
                                                className={buttonVariants({
                                                    variant: "ghost",
                                                    size: "lg",
                                                    className: "text-xl",
                                                })}
                                            >
                                                <UserPlus className="mr-2 h-6 w-6" />
                                                Sign up
                                            </Link>
                                        </li>
                                    </div>
                                )}
                                <li>
                                    <Link
                                        href="/pricing"
                                        className={buttonVariants({
                                            variant: "ghost",
                                            size: "lg",
                                            className: "mt-2 text-xl",
                                        })}
                                    >
                                        <CreditCard className="mr-2 h-6 w-6" />
                                        Pricing
                                    </Link>
                                </li>
                            </ul>
                        </DialogContent>
                    </Dialog>
                    {userId && <UserButton afterSignOutUrl="/" />}
                </div>
            </nav>

            <nav className="h-18 sticky inset-x-0 top-0 hidden w-full py-4 transition-all sm:block">
                <div className="flex items-center justify-between px-6">
                    <div className="flex items-center justify-between gap-x-2 text-gray-900">
                        <Link
                            href="/"
                            className={buttonVariants({
                                variant: "ghost",
                                size: "sm",
                                className: "flex items-center",
                            })}
                        >
                            <h1 className="ml-3 text-base font-medium uppercase tracking-wide text-white">
                                DocuMate
                            </h1>
                            <ListMinus className="h-4 w-4" />
                        </Link>
                    </div>

                    <div>
                        <Link
                            href="/pricing"
                            className={buttonVariants({
                                variant: "ghost",
                                size: "sm",
                            })}
                        >
                            Pricing
                        </Link>
                    </div>

                    <div className="flex items-center justify-between gap-x-2">
                        {userId ? (
                            <div className="flex items-center justify-between gap-x-4">
                                {!isDashboard && (
                                    <Link
                                        href="/dashboard"
                                        className={buttonVariants({
                                            variant: "outline",
                                            size: "sm",
                                        })}
                                    >
                                        Dashboard
                                    </Link>
                                )}
                                <UserButton afterSignOutUrl="/" />
                            </div>
                        ) : (
                            <div className="flex items-center justify-between gap-x-4">
                                <Link
                                    href="/sign-in"
                                    className={buttonVariants({
                                        variant: "outline",
                                        size: "sm",
                                    })}
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/sign-up"
                                    className={buttonVariants({
                                        variant: "default",
                                        size: "sm",
                                    })}
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
}
