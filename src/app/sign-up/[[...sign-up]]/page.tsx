import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign Up — DocuMate",
    description: "Create a DocuMate account to start chatting with your PDFs.",
};

export default function Page() {
    return (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <SignUp />
        </div>
    );
}
