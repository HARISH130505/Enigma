# Mission Enigma

A full-stack, gamified cyber-thriller investigation platform.

## Project Structure

```
mission-enigma/
├── frontend/          # Next.js 14 + Tailwind CSS
├── backend/           # Express.js API Server
└── supabase/          # Database migrations
```

## Quick Start

### 1. Set Up Database

Run the SQL migration in your Supabase SQL Editor:
```
supabase/migrations/001_initial_schema.sql
```

### 2. Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:3001`

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Express.js, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT tokens

## Features

- ✅ Team-based authentication
- ✅ 120-minutes server-authoritative timer
- ✅ Progress persistence (refresh-safe)
- ✅ Drag-and-drop puzzles
- ✅ Cipher decoding
- ✅ Morse code visual
- ✅ Admin monitoring panel
- ✅ CSV export
- ✅ Dark cyber-thriller theme
- ✅ Glitch & scanline effects
