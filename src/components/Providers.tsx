"use client";

import React from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

type Props = {
    children: React.ReactNode;
};

export default function Providers({ children }: Props) {
    const [queryClient] = React.useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
