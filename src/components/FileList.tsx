import React from "react";
import { Input } from "@/components/ui/input";
import { MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Skeleton from "react-loading-skeleton";
import { CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import PDFUploader from "./PDFUploader";
import { File } from "@prisma/client";
import SubscribeBtn from "./SubscribeBtn";

interface ListProps {
    files: File[];
    onFileSelect: (file: File) => void;
    selectedFileId: string;
    isLoading: boolean;
}

export default function FileList({
    files,
    onFileSelect,
    selectedFileId,
    isLoading,
}: ListProps) {
    const [searchTerm, setSearchTerm] = React.useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState("");

    React.useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300); // Delay: 300ms

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const filteredFiles = files
        ? files.filter((file) =>
              file.name
                  .toLowerCase()
                  .includes(debouncedSearchTerm.toLowerCase())
          )
        : [];

    if (isLoading)
        return (
            <div className="grid gap-y-2 overflow-hidden">
                <div className="p-4">
                    <Skeleton
                        height={50}
                        width={350}
                        className="mb-4 w-80 px-3 py-2"
                    />
                </div>
                <div className="p-4">
                    <Skeleton height={50} width={350} />
                </div>
                <div className="p-4">
                    <Skeleton count={6} height={50} width={350} />
                </div>
            </div>
        );

    return (
        <div className="grid overflow-hidden">
            {/* Buttons */}
            <div className="mt-4 px-4">
                <div className="justify-center space-y-2 sm:flex sm:gap-x-2 sm:space-y-0">
                    <PDFUploader />
                </div>
            </div>

            {/* Search */}
            <div className="mt-4 px-4">
                <Input
                    type="text"
                    className="w-full px-3 py-2"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>

            <div className="mx-2 mt-4">
                <div className="mx-6 mb-2 flex items-center justify-start">
                    <h1 className="text-sm font-semibold uppercase text-gray-500 sm:text-lg">
                        Chats
                    </h1>
                </div>
                {filteredFiles.length > 0 ? (
                    filteredFiles
                        .sort(
                            (a, b) =>
                                new Date(b.createdAt).getTime() -
                                new Date(a.createdAt).getTime()
                        )
                        .map((file) => (
                            <button
                                type="button"
                                className={`h-22 w-full rounded text-left ${
                                    file.id === selectedFileId
                                        ? "bg-gray-200"
                                        : "bg-transparent hover:bg-gray-100"
                                }`}
                                key={file.id}
                                onClick={() => {
                                    onFileSelect(file);
                                }}
                            >
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="flex cursor-pointer items-center justify-between space-x-2 text-sm font-medium text-gray-700">
                                        <MessageSquare className="text-muted-foreground h-4 w-4" />
                                        <span>
                                            {" "}
                                            {file.name.length > 30
                                                ? `${file.name.slice(0, 30)}...`
                                                : file.name}
                                        </span>
                                    </CardTitle>
                                    <p className="text-muted-foreground text-xs sm:ml-8">
                                        {formatDate(file.createdAt)}
                                    </p>
                                </CardHeader>
                                <Separator className="mt-2" />
                            </button>
                        ))
                ) : (
                    <div className="mx-6 mt-4 flex items-center justify-start">
                        <h2 className="pb-6 text-sm text-gray-500 sm:text-base">
                            No files found.
                        </h2>
                    </div>
                )}
            </div>
        </div>
    );
}
