# CloudBox v1.0.0 - Release Notes and Local Demo Guide

First release of CloudBox: the original Express / Cloudinary / Multer / MongoDB / PostgreSQL / Prisma backend, now with a React frontend and the endpoints it needs.

## What is included

- React 19 + Vite + Tailwind CSS 4 frontend (responsive, modern, no extra UI framework)
- Upload one or many files with progress, drag and drop, and client-side validation
- Browse, search by name, preview (images, video, PDF, text), download, replace and delete
- File size and upload date on every file
- New API endpoints: list/search, details, download, preview, replace and delete by id, and a config endpoint
- Cloudinary, MongoDB and PostgreSQL/Prisma integrations preserved, with rollback if one of them fails
- Backend fixes (hanging requests, crashes, validation, startup checks) - see the "What was fixed" section in `README.md`
- `.env.example`, `docker-compose.yml` for local databases, `README.md` and this file

## Install

Requirements: Node.js 20.19+ (22 LTS recommended), npm, a free Cloudinary account, and Docker (or your own PostgreSQL and MongoDB).

```bash
npm run setup               # installs backend + frontend, generates the Prisma client
```

## Configure

```bash
docker compose up -d        # local PostgreSQL + MongoDB (skip if you use your own)
cp .env.example .env        # Windows PowerShell: copy .env.example .env
```

Edit `.env` and set the three Cloudinary values (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) from https://console.cloudinary.com (*Go to API Keys*). The database URLs already match the Docker setup.

Then create the tables:

```bash
npm run db:migrate
```

**One-time Cloudinary setting for PDFs:** in the Cloudinary console open *Settings > Security* and enable **Allow delivery of PDF and ZIP files**. New accounts block this by default, which would stop PDF preview and download.

## Run

```bash
npm run dev:all
```

Open http://localhost:5173. The API runs on http://localhost:5000 (`/health` should return `{"status":"ok"}`).

You should see `MongoDB connected successfully`, `Prisma (PostgreSQL) connected successfully` and `Server started at http://localhost:5000` in the terminal.

## Demo script (about 5 minutes)

Prepare a few sample files: a photo (png/jpg), a PDF, a CSV or text file, and one unsupported file (for example `.exe` or `.zip`).

1. **Empty state** - the page opens with "No files yet" and the upload box.
2. **Single upload** - drag the photo onto the upload box. A progress bar appears, then a success message and the file card with its thumbnail, size and date.
3. **Multiple upload** - select the PDF and the CSV/text file together. Both appear in the grid.
4. **Validation** - try to upload the unsupported file. The app skips it and explains why.
5. **Preview** - click the photo (image viewer), the PDF (browser PDF viewer) and the text/CSV file (text view). Press `Esc` to close.
6. **Download** - click the download icon on a card. The file is saved with its original name.
7. **Search** - type part of a file name. The list filters as you type; clear the box to see everything again.
8. **Replace** - click the replace icon on a card and choose another file. The card updates in place.
9. **Delete** - click the trash icon, confirm in the dialog. The file disappears.
10. **Prove the integrations** (optional, for the assessor):
    - Cloudinary console > Media Library: files are in `images_uploads/` and `documents_uploads/`, and deleted files are gone.
    - PostgreSQL: `npx prisma studio` shows the `file` table.
    - MongoDB: the `cloudinaries` collection in the `cloudbox` database has the same records (use MongoDB Compass or `mongosh`).

## Known limitations

- There is no user login: every visitor of the app sees the same files. Do not expose it publicly without adding authentication.
- File size is limited by `MAX_FILE_SIZE_MB` (10 MB by default) because uploads are buffered in memory.
- Office files (docx, xlsx, pptx) can be stored and downloaded but not previewed in the browser.
- The upload date does not change when a file is replaced.
- No automated test suite is included.

## Verification performed for this release

- Backend: upload (single, multiple, by field), list, search, download/preview streaming, replace, delete, the legacy `public_id` endpoints, rollback paths and error mapping were exercised against in-memory stand-ins for Cloudinary, MongoDB and Prisma.
- Frontend: upload, validation, search, preview, download link, replace, delete and error/retry were exercised in Chromium against a mocked API, and the layout was checked at desktop and phone widths.
- Not run in the build environment (no network): `npm install`, the real Cloudinary / PostgreSQL / MongoDB services, and `vite build`. Please follow the steps above on your machine; the troubleshooting table in `README.md` covers the common first-run problems.
