import { Pinecone } from "@pinecone-database/pinecone";

export const getPineconeClient = () => {
    return new Pinecone({
        environment: process.env.PINECONE_ENVIRONMENT_KEY!,
        apiKey: process.env.PINECONE_API_KEY!,
    });
};
