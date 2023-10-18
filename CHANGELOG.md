# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.1.0] - 2023-10-18

### Added
- PDF upload with presigned S3 uploads
- Retrieval-augmented chat with Pinecone vector search
- OpenAI GPT-3.5-Turbo integration for document Q&A
- Clerk authentication and user sync via webhooks
- Stripe billing with free tier (5 messages/PDF, 10 PDFs) and Pro plan
- Split-pane dashboard with PDF viewer and chat panel
- Persistent message history per file
- File search and deletion
- Responsive mobile navigation
- Pricing page
- Landing page

### Tech Stack
- Next.js 13 (App Router)
- React 18, TypeScript, Tailwind CSS
- shadcn/ui components
- AWS S3, Pinecone, PostgreSQL (Prisma)
- Vercel AI SDK for streaming responses
