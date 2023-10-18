import { db } from "@/db";
import { auth } from "@clerk/nextjs";

export const checkSubscription = async (): Promise<boolean> => {
    const { userId } = auth();
    if (!userId) {
        return false;
    }

    const dbUser = await db.user.findFirst({
        where: {
            id: userId,
        },
    });

    if (!dbUser) {
        return false;
    }

    const isSubscribed = Boolean(
        dbUser.stripePriceId &&
            dbUser.stripeCurrentPeriodEnd && // 86400000 = 1D
            dbUser.stripeCurrentPeriodEnd.getTime() + 86_400_000 > Date.now()
    );

    return isSubscribed;
};
