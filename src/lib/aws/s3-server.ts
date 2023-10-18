import AWS from "aws-sdk";
import fs from "fs";

function getS3Config() {
    const bucketName = process.env.S3_BUCKET_NAME;
    const region = process.env.S3_REGION;

    if (!bucketName || !region) {
        throw new Error("S3 configuration is incomplete.");
    }

    return {
        bucketName,
        region,
    };
}

function getS3Client() {
    const { bucketName, region } = getS3Config();

    AWS.config.update({
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
        region,
    });

    return new AWS.S3({
        params: {
            Bucket: bucketName,
        },
        region,
    });
}

export async function getSignedUploadUrl(
    fileId: string,
    contentType: string,
    maxFileSize: number,
    userId: string
) {
    const { bucketName } = getS3Config();
    const s3 = getS3Client();

    return s3.createPresignedPost({
        Bucket: bucketName,
        Fields: {
            key: fileId,
            "Content-Type": contentType,
            "x-amz-meta-user-id": userId,
        },
        Conditions: [
            ["eq", "$key", fileId],
            ["eq", "$Content-Type", contentType],
            ["eq", "$x-amz-meta-user-id", userId],
            ["content-length-range", 0, maxFileSize],
        ],
        Expires: 60,
    });
}

export async function getS3ObjectUserId(fileId: string) {
    const { bucketName } = getS3Config();
    const s3 = getS3Client();
    const object = await s3
        .headObject({
            Bucket: bucketName,
            Key: fileId,
        })
        .promise();

    return object.Metadata?.["user-id"] || null;
}

export function getS3Url(fileId: string) {
    return `/api/files/content?fileId=${encodeURIComponent(fileId)}`;
}

export async function getSignedReadUrl(fileId: string) {
    const { bucketName } = getS3Config();
    const s3 = getS3Client();

    return s3.getSignedUrlPromise("getObject", {
        Bucket: bucketName,
        Key: fileId,
        Expires: 60,
        ResponseContentType: "application/pdf",
    });
}

export async function deleteFromS3(fileId: string) {
    const { bucketName } = getS3Config();
    const s3 = getS3Client();

    await s3
        .deleteObject({
            Bucket: bucketName,
            Key: fileId,
        })
        .promise();
}

// Function to download PDF from our S3 bucket locally
export async function downloadFileFromS3(fileId: string) {
    try {
        const { bucketName } = getS3Config();
        const s3 = getS3Client();
        const object = await s3
            .getObject({
                Bucket: bucketName,
                Key: fileId,
            })
            .promise();

        const fileName = `/tmp/pdf-${Date.now()}.pdf`;
        fs.writeFileSync(fileName, object.Body as Buffer);

        return fileName;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export function removeLocalFile(filePath: string) {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}
