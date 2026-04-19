# FounderReach Accelerator Demo

FounderReach is a desktop-first founder and creator operating system built for the Tiny Fish Accelerator. It combines a multi-agent command center with CRM, Calendar, Vault, demo-safe onboarding, and integration-ready backend routes for live provider workflows.

The public deployment is live at [founderreach-accelerator-demo.vercel.app](https://founderreach-accelerator-demo.vercel.app).

## What This Repo Includes

- A React 19 + Vite frontend optimized for desktop use
- A white top-nav shell with `Chat`, `CRM`, `Calendar`, and `Vault`
- A 24-agent operating rail with status glow states and per-agent instructions
- First-visit onboarding with `Demo Mode` and a guided walkthrough overlay
- Demo-safe CRM, Calendar, and Vault population for first-time visitors
- Browser-local API key entry for personal testing
- Local Express routes for development and Vercel serverless routes for production
- Integration-ready hooks for Anthropic, TinyFish, OpenAI Images, HeyGen, SendGrid, AgentMail, Runway, and Stability

## Demo Mode vs Live Mode

`Demo Mode` is intentionally fabricated. It is the safest way to show the product story to new visitors, judges, and teammates without requiring any real provider accounts.

When live credentials are added:

- orchestration can use Anthropic
- browser automation can use TinyFish
- image generation can use OpenAI
- video generation can use HeyGen
- email delivery can move toward SendGrid or AgentMail

Even with live keys present, some outbound actions remain intentionally demo-safe until the relevant provider-specific workflow is fully wired.

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Create a local environment file

```bash
cp .env.example .env
```

Fill in only the providers you want to test. Blank values are expected for demo-safe development.

### 3. Start the app

```bash
npm run dev
```

This starts:

- the Vite frontend on `http://localhost:3000`
- the local Express API on `http://localhost:3001`

### 4. Open the app

Visit:

```text
http://localhost:3000
```

## Environment Variables

Use `.env.example` as the source of truth for local setup.

### Runtime

- `PORT`
- `FOUNDERREACH_ALLOWED_ORIGINS`

### Optional provider credentials

- `ANTHROPIC_API_KEY`
- `TINYFISH_API_KEY`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `HEYGEN_API_KEY`
- `SENDGRID_API_KEY`
- `AGENTMAIL_API_KEY`
- `RUNWAY_API_KEY`
- `STABILITY_API_KEY`

## Security Model

This repo is public and is intentionally structured so secrets do not belong in source control.

- Real secrets must live in environment variables, not in committed code.
- `.env` files are ignored by git.
- `.env.example` is safe to commit and contains placeholders only.
- Browser-entered API keys are stored in local browser storage for that browser session and are never written back into the repo.
- Any value shipped to the browser should be treated as public.
- If a credential is ever exposed outside your environment, rotate it immediately.

More detail is in [SECURITY.md](SECURITY.md).

## Project Structure

```text
api/                  Vercel serverless routes
lib/                  Shared backend logic for local and Vercel execution
public/               Static brand assets
server/               Local Express development API
src/                  Frontend app, tabs, shell, onboarding, and shared state
```

Key files:

- `src/App.jsx`
- `src/components/Shell.jsx`
- `src/components/SettingsPanel.jsx`
- `src/components/GuidedTour.jsx`
- `src/tabs/ChatTab.jsx`
- `src/lib/session.js`
- `src/lib/workspace.js`
- `lib/founderReachBackend.js`

## Deployment

This repo is set up for Vercel.

### Recommended path

1. Import the GitHub repo into Vercel
2. Add the environment variables you actually want enabled
3. Deploy to production

The repo already includes:

- `vercel.json`
- file-based API routes under `api/`
- a frontend that calls relative `/api/*` paths

## Quality Checks

Run the production build locally:

```bash
npm run build
```

## Public Repo Notes

- The npm package is intentionally marked `private` to prevent accidental npm publication.
- Demo contacts and provider payloads use placeholder or `.example` addresses.
- No real API keys are committed in the current tree.

## Next Improvements

- Complete provider-specific live send and publish actions
- Add Supabase auth and cloud persistence
- Add automated browser smoke tests to CI
- Replace remaining demo-safe stubs with production integrations where appropriate
