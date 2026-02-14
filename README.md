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

## Default Credentials

### Test Team
- Team Name: `alpha`
- Access Code: `mission2026`

### Admin Panel
- URL: `http://localhost:3000/admin`
- Username: `enigma_admin`
- Password: `enigma2026!`

## Game Flow

1. **Landing Page** → Team login
2. **Dashboard** → Mission briefing & round selection
3. **Round 1** → System flow analysis, 4 evidence puzzles
4. **Round 2** → Data leak investigation, 3 phases
5. **Round 3** → Morse code signal decoding
6. **Finale** → Case resolution & summary

## Puzzle Answers (for testing)

### Round 1
- Evidence 1 (System Flow): sensors → server → monitoring → logs
- Evidence 2 (Failure Point): monitoring-node
- Evidence 3 (Log Sequence): 3, 1, 4, 2
- Evidence 4 (Root Cause): manual-override
- Escape Code: DELTA-7X-OVERRIDE

### Round 2
- Phase 1: IP `192.168.1.147` OR Timestamp `03:47:22`
- Phase 2: File `config_backup_modified.sys`
- Phase 3: Decode `LQVLGHU-DFFHVV-JUDQWHG` → `INSIDER-ACCESS-GRANTED`

### Round 3
- Morse Pattern: `- .-. ..- - .... / .-. . ...- . .- .-.. . -..`
- Decoded Message: `TRUTH REVEALED`
- Final Code: `ENIGMA-SOLVED`

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Express.js, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT tokens

## Features

- ✅ Team-based authentication
- ✅ 60-minute server-authoritative timer
- ✅ Progress persistence (refresh-safe)
- ✅ Drag-and-drop puzzles
- ✅ Cipher decoding
- ✅ Morse code audio/visual
- ✅ Admin monitoring panel
- ✅ CSV export
- ✅ Dark cyber-thriller theme
- ✅ Glitch & scanline effects
