# CloudBox - Cloud File Storage

A simple, modern cloud file storage app. Upload files, browse them, preview, download, replace and delete them, and search by name.

- **Frontend:** React 19, Vite, Tailwind CSS 4
- **Backend:** Express 5, Multer (uploads), Cloudinary (file storage)
- **Databases:** PostgreSQL through Prisma 7 (primary, used for listing) and MongoDB through Mongoose (mirrored copy of every record)

## Features

| Feature | How it works |
| --- | --- |
| Upload one or many files | Click or drag and drop. One file goes to `POST /cloud/single`, several to `POST /cloud/array`, with a live progress bar |
| View uploaded files | Responsive card grid, newest first, with thumbnails for images and videos |
| Preview | Images and videos inline, PDFs in the browser viewer, text/CSV/Markdown/JSON as text. Other types show a download prompt |
| Download | Streamed through the API, so the file keeps its original name and type |
| Replace | The refresh icon on a card swaps in a new file (old one is removed from Cloudinary) |
| Delete | Confirmation dialog, then removed from Cloudinary, PostgreSQL and MongoDB |
| Search | Case-insensitive search by file name (debounced) |
| File info | Size and upload date on every card and in the preview header |

Supported types: png, jpg/jpeg/jfif, gif, webp, mp4, webm, pdf, txt, csv, md, json, doc/docx, xls/xlsx, ppt/pptx. Maximum size per file defaults to 10 MB (`MAX_FILE_SIZE_MB`).

## How it fits together

```
React (Vite, :5173) --/cloud proxy--> Express API (:5000) --> Cloudinary   (the file bytes)
                                                          --> PostgreSQL  (records, via Prisma)  <- used for listing/search
                                                          --> MongoDB     (mirrored records, via Mongoose)
```

Every write goes to all three places. If a database write fails, the API rolls back what it already created, so Cloudinary and the databases do not drift apart.

## Prerequisites

- **Node.js 20.19+** (22 LTS recommended) and npm
- A free **Cloudinary** account - https://cloudinary.com
- **PostgreSQL** and **MongoDB**. Either use Docker (a `docker-compose.yml` is included) or your own / cloud instances (MongoDB Atlas, Neon, Supabase, ...)

## Setup

### 1. Install dependencies

```bash
npm run setup
```

This installs the backend and the frontend (`frontend/`). It also runs `prisma generate` automatically. If that step ever fails, run `npm run db:generate`.

### 2. Start the databases (optional, needs Docker)

```bash
docker compose up -d
```

This starts PostgreSQL on port 5432 and MongoDB on port 27017 with the credentials used in `.env.example`.

### 3. Configure the environment

```bash
cp .env.example .env        # Windows PowerShell: copy .env.example .env
```

Open `.env` and fill in your Cloudinary credentials (Cloudinary dashboard > *Go to API Keys*). The database defaults already match the Docker setup.

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | API port | `5000` |
| `CLIENT_ORIGIN` | Allowed browser origin(s) for CORS, comma separated | `http://localhost:5173` |
| `MAX_FILE_SIZE_MB` | Max size per file | `10` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | - |
| `CLOUDINARY_API_KEY` | Cloudinary API key | - |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | - |
| `MONGODB_URL` | MongoDB connection string | - |
| `DATABASE_URL` | PostgreSQL connection string for Prisma | - |

> The original variable names (`cloud_name`, `api_key`, `api_secret`, `MongoDB_URL`) are still accepted, so an existing `.env` keeps working.

The frontend needs no configuration locally. See `frontend/.env.example` if you want to change the proxy target or call a remote API.

### 4. Create the database tables

```bash
npm run db:migrate
```

### 5. Run the app

```bash
npm run dev:all
```

- Frontend: http://localhost:5173
- API: http://localhost:5000 (health check: http://localhost:5000/health)

Or run them separately in two terminals: `npm run dev` (API) and `npm run client` (frontend).

If something is wrong with the configuration (missing variable, database not reachable), the API prints a clear message and exits instead of failing later.

## API reference

All routes are prefixed with `/cloud`. Errors are always JSON: `{ "message": "..." }`.

**Used by the React app**

| Method | Route | Description |
| --- | --- | --- |
| GET | `/config` | Allowed extensions and max file size |
| GET | `/files?search=term` | List files (newest first), optionally filtered by name |
| GET | `/files/:id` | One file's details |
| GET | `/files/:id/download` | Download (attachment) |
| GET | `/files/:id/preview` | Same file, displayed inline |
| POST | `/single` | Upload one file (multipart field `single`) |
| POST | `/array` | Upload up to 20 files (multipart field `array`) |
| PUT | `/files/:id` | Replace a file (multipart field `single`) |
| DELETE | `/files/:id` | Delete a file |

**Original endpoints (kept, now fixed)**

| Method | Route | Description |
| --- | --- | --- |
| POST | `/field` | Upload by field: `images`, `csv`, `documents`, `videos` |
| PUT | `/update` | Replace by `public_id` (multipart: `single` + `public_id`) |
| DELETE | `/delete` | Delete by `public_id` (JSON or form body) |

A file object looks like:

```json
{
  "id": 12,
  "filename": "report.pdf",
  "size": 245760,
  "url": "https://res.cloudinary.com/...",
  "publicId": "documents_uploads/abc123",
  "mimeType": "application/pdf",
  "kind": "pdf",
  "createdAt": "2026-11-23T10:15:00.000Z"
}
```

Upload responses look like `{ "message": "...", "files": [ ... ], "errors": [] }`. Quick test without the UI:

```bash
curl -F "single=@./photo.png" http://localhost:5000/cloud/single
curl "http://localhost:5000/cloud/files?search=photo"
```

## Project structure

```
index.js                  Express app: CORS, routes, error handling, startup checks
src/
  config/                 env.js (variables) and fileTypes.js (allowed types)
  routes/routes.js        All routes
  controllers/            Upload, update, delete and read endpoints
  services/fileService.js Cloudinary + PostgreSQL + MongoDB operations with rollback
  cloudinary/             Cloudinary client and helpers
  multer/                 Upload middleware (memory storage, type + size filters)
  models/model.js         Mongoose model
  Mongodb/mongodb.js      MongoDB connection
  lib/prisma.ts           Prisma client (PostgreSQL adapter)
  middleware/             Central JSON error handler
prisma/                   Schema and migrations
frontend/                 React + Vite + Tailwind app
docker-compose.yml        Optional local PostgreSQL + MongoDB
```

## What was fixed in the backend

- Controllers whose `catch` block never answered, which left requests hanging. All errors now return JSON with a proper status code.
- `req.body.public_id` crashed on body-less requests (Express 5 leaves `req.body` undefined).
- The multi-upload loop used separate `if` statements, and one filter checked `req.invalidfiles` (lowercase), so invalid files were not always reported.
- The Mongoose option was spelled `timeStamps`, so timestamps were never created.
- MongoDB and Prisma printed "connected" without connecting. Both are now awaited at startup.
- Missing CORS headers, hard-coded port, and credentials read from oddly named variables.
- Raw Cloudinary files (PDF, CSV, ...) have no extension, so downloads had no name. Downloads now go through the API with the right filename and content type.
- A CSV chosen on Windows is often reported by the browser as `application/vnd.ms-excel` and was rejected. The type is now decided by the file extension.
- Replacing or deleting now always uses the asset's real Cloudinary resource type.
- Added missing endpoints: list/search, details, download, preview, replace and delete by id.

`src/.txt/` still holds your original scratch notes and is not used by the app.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `Missing environment variables: ...` | Create `.env` from `.env.example` and fill in the values |
| `MongoDB connection failed` | Check `MONGODB_URL`, and that MongoDB is running (`docker compose up -d`) |
| Prisma error on startup or `Cannot find module '../../generated/prisma/client'` | Run `npm run db:generate` and `npm run db:migrate`, and check `DATABASE_URL` |
| Frontend shows "Cannot reach the server" | The API is not running on port 5000. Start it with `npm run dev` |
| Downloading or previewing a **PDF** fails with "Cloudinary refused to deliver this file" | New Cloudinary accounts block PDF/ZIP delivery by default. In the Cloudinary console go to *Settings > Security* and enable **Allow delivery of PDF and ZIP files** |
| Upload says the file is too large | Raise `MAX_FILE_SIZE_MB` (Cloudinary's free plan caps images and raw files at 10 MB and videos at 100 MB) |
| Port 5000 is busy (macOS AirPlay uses it) | Set `PORT=5001` in `.env` and `VITE_PROXY_TARGET=http://localhost:5001` in `frontend/.env` |

## Production build

```bash
npm run build:client      # outputs frontend/dist
```

Serve `frontend/dist` with any static host, set `VITE_API_URL` at build time to your API URL, and list the site's origin in `CLIENT_ORIGIN`.
