"use client";

import React from "react";
import {
    ChevronLeft,
    Download,
    Loader2,
    Maximize,
    Printer,
    Trash2,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import { toast } from "sonner";
import { useResizeDetector } from "react-resize-detector";
import { Input } from "./ui/input";
import SimpleBar from "simplebar-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { useReactToPrint } from "react-to-print";
import axios from "axios";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PDFViewerProps {
    fileURL: string;
    fileName: string;
    fileId: string;
    handleReturnToDashboard: () => void;
}

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

export default function PDFViewer({
    fileURL,
    fileName,
    fileId,
    handleReturnToDashboard,
}: PDFViewerProps) {
    const [numPages, setNumPages] = React.useState<number | null>();
    const [pageNumber, setPageNumber] = React.useState<number>(1);
    const [scale, setScale] = React.useState<number>(1);
    const [rotation, setRotation] = React.useState<number>(0);
    const [renderedScale, setRenderedScale] = React.useState<number | null>(
        null
    );
    const { width, ref } = useResizeDetector();

    const handlePageNumberSubmit = () => {
        // Validate page number before setting it
        if (pageNumber > 0 && pageNumber <= (numPages || 1)) {
            setPageNumber(pageNumber);
        }
    };

    const reactToPrintContent = React.useCallback(() => {
        return ref.current;
    }, [ref]);

    const handlePrint = useReactToPrint({
        content: reactToPrintContent,
        documentTitle: fileName,
        removeAfterPrint: true,
    });

    async function handleDelete() {
        try {
            await axios.delete("/api/files", { data: { fileId } });
            toast.success("File deleted.");
            window.location.reload();
            handleReturnToDashboard();
        } catch (error) {
            console.error(error);
            toast.error("Could not delete file.");
        }
    }

    return (
        <div className="flex w-full flex-col items-center rounded-md bg-white shadow">
            <div className="flex h-16 w-full items-center justify-between border-b border-zinc-200 px-2">
                <div className="flex items-center gap-1.5">
                    <Button
                        variant="ghost"
                        aria-label="return-to-dashboard"
                        onClick={handleReturnToDashboard}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Input
                        type="number"
                        value={pageNumber}
                        onChange={(e) => setPageNumber(Number(e.target.value))}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handlePageNumberSubmit();
                            }
                        }}
                        min={1}
                        max={numPages || 1}
                        className="h-8 w-12"
                    />
                    <p className="space-x-1 text-sm text-zinc-700">
                        <span>of</span>
                        <span>{numPages ?? "x"}</span>
                    </p>
                </div>
                <h1 className="hidden text-sm text-gray-800 lg:block">
                    {fileName}
                </h1>
                <div className="flex items-center">
                    <a href={fileURL} download={fileName}>
                        <Button variant="ghost" aria-label="download">
                            <Download className="h-4 w-4" />
                        </Button>
                    </a>

                    <Button
                        variant="ghost"
                        aria-label="print"
                        onClick={handlePrint}
                    >
                        <Printer className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger>
                            <Button variant="ghost" aria-label="delete-file">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Are you sure you want to delete this PDF?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete this file and remove it
                                    from our servers.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <FSViewer fileURL={fileURL} />
                </div>
            </div>
            <div className="max-h-screen w-full flex-1">
                <SimpleBar
                    autoHide={false}
                    className="max-h-[calc(100vh-10rem)]"
                >
                    <div ref={ref}>
                        <Document
                            className="max-h-full"
                            file={fileURL}
                            loading={
                                <div className="flex justify-center">
                                    <Loader2 className="my-24 h-6 w-6 animate-spin" />
                                </div>
                            }
                            onLoadSuccess={({ numPages }) =>
                                setNumPages(numPages)
                            }
                            onLoadError={() => {
                                toast.error("Error loading PDF");
                            }}
                        >
                            <Page
                                pageNumber={pageNumber}
                                scale={scale}
                                width={width ? width : 1}
                                rotate={rotation}
                                key={"@" + scale}
                                loading={
                                    <div className="flex justify-center">
                                        <Loader2 className="my-24 h-6 w-6 animate-spin" />
                                    </div>
                                }
                                onRenderSuccess={() => setRenderedScale(scale)}
                            />
                        </Document>
                    </div>
                </SimpleBar>
            </div>
        </div>
    );
}

interface FSViewerProps {
    fileURL: string;
}

function FSViewer({ fileURL }: FSViewerProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [numPages, setNumPages] = React.useState<number | null>();
    const { width, ref } = useResizeDetector();

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(v) => {
                if (!v) {
                    setIsOpen(v);
                }
            }}
        >
            <DialogTrigger onClick={() => setIsOpen(true)} asChild>
                <Button variant="ghost" aria-label="fullscreen">
                    <Maximize className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-7xl">
                <SimpleBar
                    autoHide={false}
                    className="mt-6 max-h-[calc(100vh-10rem)]"
                >
                    <div ref={ref} id="pdf-container">
                        <Document
                            className="max-h-full"
                            file={fileURL}
                            loading={
                                <div className="flex justify-center">
                                    <Loader2 className="my-24 h-6 w-6 animate-spin" />
                                </div>
                            }
                            onLoadSuccess={({ numPages }) =>
                                setNumPages(numPages)
                            }
                            onLoadError={() => {
                                toast.error("Error loading PDF");
                            }}
                        >
                            {Array.from(
                                { length: numPages || 0 },
                                (_, index) => index + 1
                            ).map((page) => (
                                <Page
                                    key={`page-${page}`}
                                    pageNumber={page}
                                    width={width ? width : 1}
                                />
                            ))}
                        </Document>
                    </div>
                </SimpleBar>
            </DialogContent>
        </Dialog>
    );
}
