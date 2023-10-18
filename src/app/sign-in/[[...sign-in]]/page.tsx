import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign In — DocuMate",
    description: "Sign in to your DocuMate account.",
};

export default function Page() {
    return (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <SignIn afterSignInUrl="/dashboard" />
        </div>
    );
}
