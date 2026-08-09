# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation lookups

Use the context7 MCP server to fetch up-to-date documentation whenever working with a library, framework, or API in this repo (React, Express, Prisma, Vite, etc.) — setup, config, or API usage should come from context7, not memory, since training data may be stale. Resolve the library ID first, then query the docs for the specific concept needed.

## Project

This is an AI-powered ticket management system. See `project-scope.md` for the product problem/solution/features, `tech-stack.md` for the chosen stack, and `implementation-plan.md` for the phased build-out (most of the app is still unimplemented — currently only a health-check round trip exists).

## Repository structure

Two independent npm projects, not a workspace/monorepo — install and run each separately.

- `client/` — React 19 + TypeScript, built with Vite.
- `server/` — Express + TypeScript, run with `tsx`, ESM (`"type": "module"`, `NodeNext` module resolution).

The client calls the server directly over HTTP using a hardcoded base URL (`http://localhost:3001`, see `client/src/App.tsx`) — there is no Vite dev proxy. The server enables `cors()` to allow this cross-origin access.

## Commands

Run from `client/`:
- `npm run dev` — start the Vite dev server (http://localhost:5173)
- `npm run build` — type-check (`tsc -b`) and build for production
- `npm run lint` — lint with oxlint

Run from `server/`:
- `npm run dev` — start the Express server with `tsx watch` (http://localhost:3001)
- `npm run build` — compile TypeScript to `dist/`
- `npm run start` — run the compiled server from `dist/`

No test suite exists yet in either project.
