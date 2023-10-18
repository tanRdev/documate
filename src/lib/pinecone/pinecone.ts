import { db } from "@/db";
import { PineconeRecord } from "@pinecone-database/pinecone";
import {
    Document,
    RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import md5 from "md5";
import { downloadFileFromS3, removeLocalFile } from "../aws/s3-server";
import { getEmbeddings } from "../embeddings";
import { getPineconeClient } from "./client";

type PDFPage = {
    pageContent: string;
    metadata: {
        loc: { pageNumber: number };
    };
};

async function prepareFile(page: PDFPage) {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1024,
        chunkOverlap: 20,
        separators: ["\n", " ", ".", ",", "!", "?", ";", ":"],
    });

    return splitter.splitDocuments([
        new Document({
            pageContent: page.pageContent,
            metadata: {
                pageNumber: page.metadata.loc.pageNumber,
            },
        }),
    ]);
}

async function embedDocument(doc: Document, fileId: string) {
    try {
        const embeddings = await getEmbeddings(doc.pageContent);
        const hash = md5(`${fileId}:${doc.pageContent}`);

        return {
            id: hash,
            values: embeddings,
            metadata: {
                text: doc.pageContent,
                pageNumber: doc.metadata.pageNumber,
                fileId,
            },
        } as PineconeRecord;
    } catch (error) {
        console.error("Error embedding document", error);
        throw error;
    }
}

export async function uploadToPinecone(fileId: string) {
    const fileName = await downloadFileFromS3(fileId);

    if (!fileName) {
        throw new Error("Could not download from s3.");
    }

    try {
        const loader = new PDFLoader(fileName);
        const pages = (await loader.load()) as PDFPage[];
        const documents = await Promise.all(pages.map(prepareFile));
        const vectors = await Promise.all(
            documents.flat().map((doc) => embedDocument(doc, fileId))
        );

        const pinecone = getPineconeClient();
        const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX!);

        await pineconeIndex.upsert(vectors);

        await db.file.update({
            data: {
                uploadStatus: "SUCCESS",
            },
            where: {
                id: fileId,
            },
        });

        return documents[0];
    } finally {
        removeLocalFile(fileName);
    }
}

export async function getMatches(embeddings: number[], fileId: string) {
    try {
        const pinecone = getPineconeClient();
        const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX!);

        const queryResult = await pineconeIndex.query({
            topK: 5,
            vector: embeddings,
            includeMetadata: true,
            filter: {
                fileId: { $eq: fileId },
            },
        });

        return queryResult.matches || [];
    } catch (error) {
        console.error("Error querying embeddings", error);
        throw error;
    }
}

export async function getContext(query: string, fileId: string) {
    const queryEmbeddings = await getEmbeddings(query);
    const matches = await getMatches(queryEmbeddings, fileId);

    const qualifyingDocs = matches.filter(
        (match) => match.score && match.score > 0.7
    );

    type Metadata = {
        text: string;
    };

    return qualifyingDocs
        .map((match) => (match.metadata as Metadata).text)
        .join("\n")
        .substring(0, 3000);
}

export const deleteFromPinecone = async (fileId: string) => {
    try {
        const pinecone = getPineconeClient();
        const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX!);

        await pineconeIndex.deleteMany({
            fileId: { $eq: fileId },
        });
    } catch (error) {
        console.error("Error deleting records from Pinecone", error);
        throw error;
    }
};
