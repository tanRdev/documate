import { cn } from "@/lib/utils";
import React from "react";

type Props = {
    className?: string;
    children: React.ReactNode;
};

export default function LayoutWrapper({ className, children }: Props) {
    return (
        <div className={cn("mx-auto w-full max-w-screen-xl px-2.5", className)}>
            {children}
        </div>
    );
}
