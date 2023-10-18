"use client";

import React from "react";
import { toast } from "sonner";
import { Loader2, UploadCloud } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { useDropzone } from "react-dropzone";
import { uploadToS3 } from "@/lib/aws/s3-client";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface PDFUploaderProps {
    disabled?: boolean;
}

export default function PDFUploader({ disabled }: PDFUploaderProps) {
    const [isOpen, setIsOpen] = React.useState<boolean>(false);

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    setIsOpen(false);
                }
            }}
        >
            <DialogTrigger
                onClick={() => {
                    if (!disabled) {
                        setIsOpen(true);
                    }
                }}
                asChild
            >
                <div className="w-full">
                    <Button variant="outline" className="w-full" disabled={disabled}>
                        Add PDF
                    </Button>
                </div>
            </DialogTrigger>
            <DialogContent>
                <PDFUpload />
            </DialogContent>
        </Dialog>
    );
}

function PDFUpload() {
    const [isLoading, setIsLoading] = React.useState(false);

    const { getRootProps, getInputProps } = useDropzone({
        accept: { "application/pdf": [".pdf"] },
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            const file = acceptedFiles[0];

            if (!file) {
                return;
            }

            if (file.size > MAX_FILE_SIZE) {
                toast.error("File too large!");
                return;
            }

            try {
                setIsLoading(true);

                const data = await uploadToS3(file);
                const response = await fetch("/api/files", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        fileId: data.fileId,
                        fileName: data.fileName,
                    }),
                });

                if (!response.ok) {
                    throw new Error(
                        "An error occurred while creating the file record."
                    );
                }

                toast.success("Successfully uploaded file!");
                window.location.reload();
            } catch (error) {
                console.error(error);
                toast.error("Something went wrong.");
            } finally {
                setIsLoading(false);
            }
        },
    });

    return (
        <div className="relative flex w-full items-center justify-center p-4">
            <label
                htmlFor="dropzone-file"
                className="flex h-44 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
                {...getRootProps()}
            >
                <div className="flex flex-col items-center justify-center p-6">
                    {isLoading ? (
                        <Loader2 className="mb-4 h-8 w-8 animate-spin text-gray-500 dark:text-gray-400" />
                    ) : (
                        <UploadCloud className="mb-4 h-8 w-8 text-gray-500 dark:text-gray-400" />
                    )}
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Accepted file types: .pdf (Max size: 10mb)
                    </p>
                </div>
                <input
                    {...getInputProps()}
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                />
            </label>
        </div>
    );
}
