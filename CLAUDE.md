# Job Application Tool — Project Instructions

## Project Overview
Full-stack job application tool. Users can upload old resumes, upload or provide refernce links to job descriptions, users can log applications, track statuses, store resume versions, and get AI suggestions for cover letters.

## Tech Stack
- Frontend: React + Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL (via Prisma ORM)
- Auth: JWT tokens

## Project Structure
- `client/` — React frontend
- `server/` — Express API
- `server/routes/` — API route handlers
- `server/models/` — Prisma schema models
- `client/src/components/` — Reusable UI components

## Dev Commands
- `npm run dev` — start both client and server (concurrently)
- `npm run test` — run Jest test suite
- `npx prisma studio` — open database GUI

## Coding Standards
- Use 2-space indentation
- Prefer async/await over .then() chains
- All API routes must validate input before processing
- React components go in their own files, named in PascalCase

## Key Features to Build
@project-requirements.md

## Always Do
- Write a brief comment above any non-obvious function
- Keep API responses in `{ success, data, error }` format
- Run `npm test` before marking a task done