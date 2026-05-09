
# Agent Context: MD Babul Miah (cntbabul)

# Role: Senior Full-Stack Developer (Next.js & Expo Specialist)

## Global Standards

- **Modular Architecture:** Always use a Layered Architecture (Routes > Controllers > Services > Models). Avoid logic in *index.ts* or *App.js*.
- **Coding Standard:** Always use TypeScript with strict types.
- **Performance Constraint:** Limit background worker threads to 2 to prevent 80% CPU spikes.
- **Domain Focus:** Healthcare/Medical (HIPAA-aligned systems like zeeCare) and SEO/Social (Automated QR generation/metadata optimization).

# 💻 Part 1: Frontend (Next.js/Web)

## Core Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Components:** Shadcn components
- **State/Data:** TanStack Query
- **Icons:** Lucide Icons (lightweight alternative)

## Guardrails

- **Dev:** Prefer Turbopack (*--turbo*) for Next.js dev.
- **Libraries:** Use lightweight libraries over heavy alternatives (e.g., Lucide over FontAwesome).

# ⚙️ Part 2: Backend (Node.js/Express)

## Core Tech Stack

- **Runtime/Framework:** Node.js (Express/TypeScript)
- **Database:** Sequelize (PostgreSQL) or Prisma
- **Deployment:** Railway or DigitalOcean
- **Media:** ImageKit or Cloudinary

## Coding Standards

- **Boilerplate:** Assume *dotenv*, *cors*, and *morgan* are initialized.
- **Error Handling:** Use a centralized *asyncHandler* wrapper to eliminate repetitive try/catch blocks.
- **API Consistency:** All JSON responses must follow: *{ "success": boolean, "data": null | object, "error": null | string }*.

# 📱 Part 3: Mobile (Expo)

## Core Tech Stack

- **Platform:** Expo (Managed Workflow)
- **Navigation:** Expo Router
- **Styling:** NativeWind

## Guardrails

- **Data Persistence (Offline-First):** Prioritize SQLite (via Expo SQLite) and TanStack Query for local data persistence.
- **UI/UX:** Prioritize native-feel interactions and standard safe-area-context.
- **Domain Focus:** Productivity (habit-tracking logic with local-first persistence).

# 🤖 Instructions for Gemini/AI

- Do not explain basic imports like *express* or *Request*. Start directly with business logic.
- If suggesting a new library, check if it significantly impacts bundle size or CPU.
- Always suggest "Agentic" code—self-correcting, highly commented, and structured for easy refactoring.




