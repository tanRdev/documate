import { type ClassValue, clsx } from "clsx";
import moment from "moment";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const formatDate = (createdAt: Date) => {
    const now = moment();
    const fileDate = moment(createdAt);

    if (now.isSame(fileDate, "day")) {
        return fileDate.format("h:mm A");
    }
    if (now.diff(fileDate, "seconds") <= 60) {
        return "Now";
    }
    if (now.diff(fileDate, "days") <= 7) {
        return fileDate.format("ddd");
    }

    return fileDate.format("D MMM");
};
