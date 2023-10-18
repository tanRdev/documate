const MAX_FILE_SIZE = 10 * 1024 * 1024;

type SignedUploadResponse = {
    fileId: string;
    fileName: string;
    uploadUrl: string;
    fields: Record<string, string>;
};

export async function uploadToS3(file: File) {
    if (file.size > MAX_FILE_SIZE) {
        throw new Error("File too large.");
    }

    const response = await fetch("/api/files/upload", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            fileName: file.name,
            contentType: file.type || "application/pdf",
            fileSize: file.size,
        }),
    });

    if (!response.ok) {
        throw new Error("Could not prepare file upload.");
    }

    const data = (await response.json()) as SignedUploadResponse;

    const formData = new FormData();

    Object.entries(data.fields).forEach(([key, value]) => {
        formData.append(key, value);
    });
    formData.append("file", file);

    const uploadResponse = await fetch(data.uploadUrl, {
        method: "POST",
        body: formData,
    });

    if (!uploadResponse.ok) {
        throw new Error("Could not upload file to storage.");
    }

    return {
        fileId: data.fileId,
        fileName: data.fileName,
    };
}
