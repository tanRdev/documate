# DocuMate

An AI document assistant for chatting with PDFs. Upload a document, ask questions, and get answers grounded in the actual content — not hallucinated.

## Features

- Upload PDFs and ask questions in a split-pane interface
- Retrieval-augmented generation with per-document context
- Persistent message history per file
- Free tier with 5 messages per PDF, 10 PDFs total
- Pro plan with unlimited uploads and messages via Stripe
- Responsive UI with mobile support

## How It Works

```
┌──────────┐     ┌──────────┐     ┌───────────┐     ┌──────────┐
│  Upload  │────▶│   Parse  │────▶│  Embed &  │────▶│  Store   │
│  PDF →   │     │  Pages → │     │  Vectorize│     │ Pinecone │
│   S3     │     │  Chunks  │     │  OpenAI   │     │  Index   │
└──────────┘     └──────────┘     └───────────┘     └──────────┘
                                                              │
┌──────────┐     ┌──────────┐     ┌───────────┐              │
│  Stream  │◀────│  OpenAI  │◀────│  Retrieve │◀─────────────┘
│ Response │     │  Chat    │     │  Chunks   │
│  to UI   │     │  (GPT)   │     │  (Top-K)  │
└──────────┘     └──────────┘     └───────────┘
```

1. **Upload** — PDF is uploaded to S3 via a server-generated presigned POST with ownership proof via S3 metadata.
2. **Parse** — LangChain PDF loader extracts pages, then a recursive text splitter chunks them.
3. **Embed** — Each chunk is embedded with OpenAI's `text-embedding-ada-002` and stored in Pinecone with `fileId` metadata for per-document filtering.
4. **Chat** — User questions retrieve the top-5 matching chunks (score > 0.7), which are injected as context into a GPT-3.5-Turbo prompt. Responses stream back to the UI.
5. **Persist** — Message history is stored in PostgreSQL via Prisma and rehydrated on revisit.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 13 (App Router) |
| UI | React 18, Tailwind CSS, shadcn/ui |
| Auth | Clerk |
| Storage | AWS S3 (presigned POST uploads) |
| Vector DB | Pinecone |
| Embeddings | OpenAI `text-embedding-ada-002` |
| LLM | OpenAI `gpt-3.5-turbo` |
| PDF Parsing | LangChain + pdf-parse |
| Database | PostgreSQL + Prisma |
| Billing | Stripe |
| Streaming | Vercel AI SDK (`ai`) + `openai-edge` |

## Architecture

### Project Structure

```
src/
├── app/                          # Next.js 13 App Router
│   ├── api/                      # Server-side API routes
│   │   ├── files/                # File CRUD + signed upload prep
│   │   │   ├── upload/route.ts   # Generates presigned S3 POST
│   │   │   ├── route.ts          # Creates DB record, triggers indexing
│   │   │   └── content/route.ts  # Authenticated PDF read (redirects to signed S3 URL)
│   │   ├── message/route.ts      # Chat endpoint — retrieves context, streams OpenAI
│   │   ├── messages/route.ts     # Message history fetch
│   │   ├── clerk/route.ts        # Clerk webhook — syncs users to DB
│   │   └── stripe/route.ts       # Billing / subscription checkout
│   ├── dashboard/page.tsx        # Main app — file list + chat + PDF viewer
│   ├── pricing/page.tsx          # Pricing page
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── messaging/                # Chat UI (MessagePanel, MessageList)
│   ├── ui/                       # shadcn/ui primitives
│   ├── PDFUploader.tsx           # Dropzone → presigned upload flow
│   ├── PDFViewer.tsx             # react-pdf with pagination, zoom, print
│   ├── FileList.tsx              # Searchable file list with selection
│   └── UserDashboard.tsx         # Dashboard layout + state orchestration
└── lib/                          # Shared utilities
    ├── aws/                      # S3 client (browser) + server helpers
    ├── pinecone/                 # Vector indexing, retrieval, deletion
    ├── stripe/                   # Stripe client + subscription checks
    ├── embeddings.ts             # OpenAI embedding wrapper
    └── openai.ts                 # OpenAI client config
```

### Key Design Decisions

**Two-step upload with presigned POSTs**

Instead of proxying file bytes through the server, the client requests a presigned upload URL from `/api/files/upload`, then uploads directly to S3. The server generates the presigned POST with:
- A fixed `key` matching the expected `fileId`
- A `content-length-range` condition enforcing the 10MB cap at the storage layer
- An `x-amz-meta-user-id` field binding the upload to the authenticated user

After the browser upload completes, the client calls `POST /api/files` to create the DB record and trigger indexing. The server verifies ownership by reading the `x-amz-meta-user-id` from the uploaded S3 object — if it doesn't match the requesting user, the upload is rejected and the orphaned object is cleaned up.

**Per-file vector isolation**

Every chunk stored in Pinecone carries a `fileId` metadata field. Queries include a metadata filter (`fileId: { $eq: fileId }`) so retrieval is scoped to the currently selected document. Deletion uses `deleteMany` with the same filter to remove all chunks for a file in one call.

**Server-side chat history**

The chat endpoint (`/api/message`) doesn't trust the client's message array for context. Instead, it loads the full conversation history from the database, filters to `USER` and `ASSISTANT` roles, and appends the latest user message. This prevents a client from fabricating prior turns or inflating token spend. The free-tier limit (5 messages per PDF) is enforced against the persisted count, not the client-provided array.

**Streaming responses**

OpenAI responses are streamed using the Vercel AI SDK's `OpenAIStream`. Messages are persisted in two hooks: `onStart` saves the user message, `onCompletion` saves the assistant response. The client uses `useChat` with `initialMessages` seeded from the database query, and a hydration guard prevents the server response from overwriting in-flight local state.

### Tradeoffs and Constraints

- **Chunk metadata stores full page text** — the splitter creates 1024-character chunks but the metadata field stores the entire page content. This means retrieval context can be noisy, repeating full-page text across multiple matched chunks. The prompt truncates to 3000 characters as a safety valve.
- **Synchronous indexing** — `uploadToPinecone` runs in the same request as file creation. On large PDFs this blocks the response and risks timeout. Queuing this as a background job would be the next improvement.
- **No rate limiting** — the chat endpoint relies on the free-tier count check but has no per-minute or per-user rate limiting.
- **Temp file cleanup** — PDFs are downloaded to `/tmp` for parsing and cleaned up in a `finally` block, but a crash during indexing would leave orphaned files.

## Running Locally

```bash
npm install
npm run dev
```

You'll need a `.env` file with values for:

```
# Auth
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_WEBHOOK_SECRET=

# Storage
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET_NAME=
S3_REGION=

# Vector DB
PINECONE_API_KEY=
PINECONE_INDEX=

# AI
OPENAI_API_KEY=

# Database
DATABASE_URL=

# Billing
STRIPE_SECRET_KEY=
```
