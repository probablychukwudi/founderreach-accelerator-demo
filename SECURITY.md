# Security Policy

## Supported Branch

The `main` branch is the supported public branch for this project.

## Secret Handling

This repository is public. Because of that:

- never commit `.env` files
- never hardcode API keys, passwords, tokens, or provider secrets in source files
- never treat browser-delivered values as secret
- use `.env.example` only for placeholders and variable names
- use Vercel project environment variables for production secrets

The app supports two credential paths:

### 1. Server-side environment variables

Use these for production and shared environments.

### 2. Browser-local personal API keys

Users can enter their own keys inside the app for personal testing. Those keys are stored in the browser session only and are not written back to the repository.

## Reporting a Security Issue

If you discover a vulnerability or accidental exposure:

1. Do not open a public GitHub issue with the secret or exploit details.
2. Rotate any exposed credentials immediately.
3. Share the issue privately with the maintainer.

## Hardening Notes

Current repo protections include:

- `.env` and local environment files ignored by git
- no committed provider secrets in the current source tree
- local Express development API with restricted default CORS origins
- production error responses that avoid returning detailed internal messages by default

## Public Demo Data

Seeded workspace contacts and provider examples use clearly fake or `.example` addresses so the public repo does not ship real personal contact data.
