

# Navis

**Understand your care. Act with confidence.**

*We help patients not just read their records — but actually know what to do.*

  


[Next.js](https://nextjs.org)
[React](https://react.dev)
[TypeScript](https://www.typescriptlang.org)
[Tailwind CSS](https://tailwindcss.com)

  




Navis is a patient-facing web app for making sense of discharge papers and visit summaries. Upload a PDF, talk with an AI assistant **grounded in your document**, watch the PDF **scroll and highlight** as the assistant responds, and export **critical next steps**, **medication lists** (PDF), **calendar reminders** (`.ics`), and **nearby pharmacies** (U.S. ZIP → Google Maps).

Your file stays in the **browser session** for this app—there is **no Navis server** that stores your PDF after you leave.

---

## Contents

- [At a glance](#at-a-glance)
- [What it does](#what-it-does)
- [Features](#features)
- [Tech stack & versions](#tech-stack--versions)
- [Architecture](#architecture)
- [Privacy & data](#privacy--data)
- [Requirements](#requirements)
- [Environment variables](#environment-variables)
- [Getting started](#getting-started)
- [Deploying (Vercel)](#deploying-vercel)
- [npm scripts](#npm-scripts)
- [Project structure](#project-structure)
- [Browser permissions](#browser-permissions)
- [API keys & security](#api-keys--security)
- [Medical disclaimer](#medical-disclaimer)
- [Roadmap](#roadmap)
- [License](#license)

---

## At a glance


| Topic           | Details                                                                      |
| --------------- | ---------------------------------------------------------------------------- |
| **Stack**       | Next.js (App Router) · React · TypeScript · Tailwind CSS                     |
| **PDF**         | PDF.js (`pdfjs-dist`), custom text extraction & transcript-driven highlights |
| **Live AI**     | Google Gemini Live (`gemini-3.1-flash-live-preview` via `@google/genai`)     |
| **Extractions** | Groq (`llama-3.3-70b-versatile`) and/or Gemini (`gemini-2.0-flash`)          |
| **Extras**      | jsPDF · MediaPipe (ASL) · Framer Motion                                      |


---

## What it does

1. **Landing** — Upload a PDF. First-time upload can show a **privacy brief**; the file is held in memory (blob URL) for the session.
2. **Document workspace** — Split layout: **PDF viewer** (left on large screens, top on small) and **tools** in the side column.
3. **Live voice (optional)** — With a Google API key, start **Talk about this document**: Gemini Live reads your document context, answers questions, and the UI **parses the assistant’s transcript** to **scroll** and **highlight** on the PDF.
4. **Extractions** — With Google and/or Groq keys, **Critical next steps** and **medication schedule** JSON extractions; downloads for **PDF** and **ICS** where applicable.
5. **Pharmacies** — Valid **5-digit U.S. ZIP** opens a **Google Maps** search URL (no Maps API key in-app).

---

## Features

### PDF upload & session-only storage

- `.pdf` from the file picker on the home page or **Re-upload** in the header on `/document`.
- No server-side document database in this repository—the PDF is a **blob URL** in the browser.

### PDF rendering & highlights

- **PDF.js** renders pages and a text layer.
- A **document index** captures page text, normalized search text, headings, medication-like terms, and short summaries for the live model.
- A **transcript parser** reacts to the assistant’s output: **jump to page** (digits or words), **highlight spans** (quotes, headings, med-style patterns).

### Talk about this document (Gemini Live)

- **Model:** `gemini-3.1-flash-live-preview` (`useGeminiLiveDocument.ts`).
- **Audio:** mic PCM at 16 kHz; playback via Web Audio (user gesture unlock).
- **Context:** up to **60,000 characters** of extracted text plus a **document map** in the system instruction; if extraction is weak, the **first page may be sent as a JPEG**. Raw PDF bytes are **not** uploaded wholesale.
- **PHI handling:** text sent to Gemini is processed through **PHI redaction** (`phiRedaction.ts`); the UI can show a count of redacted items before sending.
- **Controls:** mute/unmute, stop session, **ASL mode** (see below).

### Critical next steps

- Runs when document text is available; uses **Groq** or **Gemini** per env (`extractCriticalActions.ts`).
- **Gemini:** `gemini-2.0-flash` · **Groq:** `llama-3.3-70b-versatile`.

### Medications & calendar

- Uses document text plus **heard / reply** transcript when available (`extractMedicationSchedule.ts`).
- **PDF** via **jsPDF** + **jspdf-autotable** · **ICS** via a small builder.
- Provider: `NEXT_PUBLIC_MEDICATION_EXTRACT_PROVIDER` — `auto`  `groq`  `gemini` (`auto` prefers Groq when its key is set).

### Pharmacies

- ZIP validation, then opens Google Maps via `googleMapsPharmaciesNearZip` in `lib/maps/externalMapLinks.ts` (search query `pharmacies near {zip}`).

### ASL fingerspelling

- **MediaPipe** hand landmarks + letter classification; optional calibration under `public/asl/`.
- In ASL mode the mic is off; spelled text can be sent into the live session.

### Landing & UI

- Hero, **Upload PDF**, and a disabled **View demo** (coming soon).
- **Features** section: Framer Motion scroll narrative, or a static list when **reduced motion** is preferred.
- **Theme:** light/dark toggle, `localStorage`, and a `beforeInteractive` script to reduce theme flash.
- **Branding:** UI wordmark uses **DM Serif Display**; body UI uses **Geist** / **Geist Mono** (`layout.tsx`).

---

## Tech stack & versions

Pinned dependency versions (see `package.json`):


| Area         | Package                     | Version         |
| ------------ | --------------------------- | --------------- |
| Framework    | `next`                      | 16.2.2          |
| UI           | `react` / `react-dom`       | 19.2.4          |
| Language     | `typescript`                | ^5              |
| Styling      | `tailwindcss`               | ^4              |
| AI           | `@google/genai`             | ^1.48.0         |
| PDF          | `pdfjs-dist`                | ^5.6.205        |
| PDF export   | `jspdf` / `jspdf-autotable` | ^4.2.1 / ^5.0.7 |
| Motion       | `framer-motion`             | ^12.38.0        |
| Icons        | `lucide-react`              | ^1.7.0          |
| Vision / ASL | `@mediapipe/tasks-vision`   | ^0.10.34        |
| ML           | `@tensorflow/tfjs`          | ^4.22.0         |


---

## Architecture


| Piece                                                  | Role                                                     |
| ------------------------------------------------------ | -------------------------------------------------------- |
| `PdfDocumentProvider`                                  | Session `pdfUrl` + `fileName`                            |
| `GeminiLiveDocumentProvider`                           | Live session, audio, `documentExtractedText` for panels  |
| `TranscriptPdfViewer`                                  | PDF + transcript → `TranscriptParser` → scroll/highlight |
| `documentIndex.ts`                                     | Index + `buildLiveSystemInstruction`                     |
| `extractCriticalActions` / `extractMedicationSchedule` | Client calls to Groq or Gemini                           |


---

## Privacy & data

This describes **what the code does**, not legal advice.

### What stays local to Navis

- The **PDF** is loaded in the browser (blob URL). This project has **no server/database** that stores uploads.
- **Text extraction** and rendering use **PDF.js** on the client.
- Closing the tab clears the **in-memory** session for this app.

### PHI redaction before anything is sent (text)

For **text** that powers the AI features, Navis applies **client-side redaction first**, then sends the **redacted** content to Google and/or Groq. The pipeline is intentional:

1. **Extract** — Full document text is read locally from the PDF (`pdfExtract.ts`).
2. **Redact** — That string is passed through `redactPHI()` in `phiRedaction.ts`: pattern-based replacements run **in the browser** before any network call uses the document body.
3. **Use** — The **redacted** text becomes `documentExtractedText` for extractions (critical steps, medications) and for the Gemini Live session context (together with a document map whose summaries are also passed through redaction where applicable).

So for **structured text**, the default posture is: **strip identifiable and sensitive literals first, then transmit**—not the other way around.

**What the redactor targets (high level).** The implementation uses explicit regex categories such as patient and contact names, physician names, **MRN** / encounter IDs, **DOB**, **SSN** (including last-four style lines), **street addresses**, **phone numbers**, insurance / member / **NPI** / **DEA** style identifiers, encounter and signature timestamps, and patient-portal line references. Matches are replaced with neutral placeholders (e.g. `[PHONE REDACTED]`), and the UI can surface a **count** (and category breakdown) of redactions before content is sent to Gemini.

**Why this matters.** Third-party APIs should receive **clinical narrative** (medications, instructions, follow-up) with fewer direct identifiers attached. That reduces accidental exposure of names, numbers, and addresses in the payload **when the patterns match**.

**Limits you should treat seriously.**

- **Pattern-based, not perfect.** Redaction is **regex-driven**. Novel name spellings, uncommon formats, OCR quirks, or identifiers that do not match a pattern can **still appear** in outgoing text. This is **not** a guarantee of de-identification under HIPAA or other rules.
- **Vision fallback.** If extracted text is weak, a **first-page image** may be sent for Gemini Live. That image is **not** run through the same text redaction pipeline—anything visible on the page (including names in a header) could still appear. Prefer text-first PDFs for sensitive demos.
- **Voice and ASL.** **Speech audio** and **camera / spelled input** are not “redacted” like document text; they are processed as audio or text in the live session under Google’s terms.
- **Medication prompts** may include **heard/reply** transcript strings; those reflect what was said in session, not a full re-redaction of the PDF.

---

## Requirements

- **Node.js** (LTS) and **npm** (or compatible package manager).
- A modern browser with **Web Audio**, `**getUserMedia`** (mic), and optionally **camera** (ASL).

---

## Environment variables

Copy `.env.example` → `.env.local`. Keys are `**NEXT_PUBLIC_*`** (exposed to the client)—**restrict by HTTP referrer** in Google AI Studio / Groq.


| Variable                                  | Purpose                                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_GOOGLE_API_KEY`              | **Required** for Talk about this document (Gemini Live). Used for JSON extractions when Groq is not selected. |
| `NEXT_PUBLIC_GROQ_API_KEY`                | Optional; preferred for extractions when `auto` or `groq`.                                                    |
| `NEXT_PUBLIC_MEDICATION_EXTRACT_PROVIDER` | `auto` (default) · `groq` · `gemini`                                                                          |


The marketing shell works **without** keys; AI features need keys as above.

---

## Getting started

```bash
npm install
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_GOOGLE_API_KEY at minimum for voice chat
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), upload a PDF, and use the document workspace.

---

## Deploying (Vercel)

1. Push the repo to **GitHub**, **GitLab**, or **Bitbucket**.
2. Import the project at [vercel.com](https://vercel.com); use the **Next.js** preset and default install/build commands.
3. Add the same `**NEXT_PUBLIC_*`** variables under **Settings → Environment Variables**.
4. To limit API usage to production traffic only, attach keys to the **Production** environment and omit **Preview** (preview builds will not have working AI until you add keys there).

---

## npm scripts


| Script                  | Command         |
| ----------------------- | --------------- |
| Development             | `npm run dev`   |
| Production build        | `npm run build` |
| Start production server | `npm start`     |
| Lint                    | `npm run lint`  |


---

## Project structure

```
src/
  app/                 # App Router — routes, layout, global CSS
  components/          # UI: viewer, panels, header, providers, features
  hooks/               # useGeminiLiveDocument (Gemini Live)
  lib/
    asl/               # Hand landmarks, letter classification
    criticalActions/   # Critical steps extraction
    ics/               # .ics builder
    maps/              # Google Maps search URLs
    medications/       # Medication extract, PDF export
    geminiLiveAudio.ts
    documentIndex.ts
    pdfExtract.ts
    transcriptParser.ts
    phiRedaction.ts
public/
  asl/                 # Optional ASL calibration JSON
  logo.svg
```

---

## Browser permissions


| Permission     | When                          |
| -------------- | ----------------------------- |
| **Microphone** | Starting a live voice session |
| **Camera**     | ASL fingerspelling mode       |


---

## API keys & security

- Use **restricted** browser keys (referrer / HTTP restrictions).
- Never commit production keys; `NEXT_PUBLIC_`* is visible in the client bundle by design.

---

## Medical disclaimer

Navis is a **tool to organize and read information**. It does **not** provide medical advice, diagnosis, or treatment. Always follow your clinician and verify medications with a licensed professional or pharmacist.

---

## Roadmap

- **Browser extension** — Coming soon: work with documents from the web without leaving your workflow.
- **Multilingual UI** — Broader language controls aligned with product copy.

---

## License

Private project (`"private": true` in `package.json`). Adjust for your team as needed.

---



**Navis** · Built with [Next.js](https://nextjs.org)

*npm package name: `recast`*

