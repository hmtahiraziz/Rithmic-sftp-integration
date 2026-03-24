# Rithmic SFTP Integration MVP

Minimal Express + TypeScript backend for creating and uploading Rithmic operation files.

## What this includes

- `POST /jobs/upload` to build and upload an operation file.
- `GET /jobs/:jobId` to check job status.
- `POST /jobs/:jobId/poll-result` to check and parse result files from Rithmic.
- `POST /jobs/:jobId/retry` to retry an upload job using the same payload.
- Supported operation types:
  - `add_user`
  - `add_account`
  - `set_rms_account`
  - `set_rms_product`
- Remote folder routing:
  - `add_user` and `add_account` -> `Coperations`
  - `set_rms_account` and `set_rms_product` -> `in_flight`
- File-backed job store at `data/jobs/jobs.json` for persistence across restarts.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file:

```bash
cp .env.example .env
```

3. Fill credentials in `.env`.

4. Run dev server:

```bash
npm run dev
```

### SFTP remote folders

After login, Rithmic usually exposes `in_flight`, `Coperations`, etc. **under your SFTP home directory**, not at the server’s filesystem root. Use **relative** paths in `.env` (e.g. `in_flight`), not `/in_flight`. Leading slashes are stripped automatically, but relative values are clearest.

If upload still fails, the API error often includes **“Entries in your SFTP home: …”** — copy the exact folder name from that list into `RITHMIC_REMOTE_IN_FLIGHT` or `RITHMIC_REMOTE_COPERATIONS` (names can differ by environment or casing).

## API

### GET `/health`

Basic health check endpoint.

### GET `/healthz`

Extended health check endpoint with service identifier.

### GET `/readyz`

Readiness check endpoint.

### POST `/jobs/upload`

Request body:

```json
{
  "operationType": "set_rms_account",
  "values": ["IB", "Account", "1", "1", "500", "2", "0", "0", "0"],
  "filePrefix": "rithmic_ops"
}
```

Response:
- Job payload with status `uploaded` or `failed`.

### GET `/jobs/:jobId`

Response:
- Job payload with current status and metadata.

### POST `/jobs/:jobId/poll-result`

Attempts to find matching result file in `RITHMIC_REMOTE_RESULTS` and parses success/failure.

### POST `/jobs/:jobId/retry`

Creates a new upload job from the same operation payload.
