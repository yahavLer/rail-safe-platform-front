# Rail Safe Platform – Frontend

Frontend repository for **Rail Safe Platform**, a web-based risk and safety management system.

This frontend provides the user interface for creating, reviewing, filtering, and managing risks, along with dashboards, mitigation workflows, and AI-assisted image analysis features.

## Live Demo
- Frontend: https://rail-safe-platform-front.vercel.app
- Backend repository: https://github.com/yahavLer/rail-safe-platform

## Overview
The frontend is built with **React + TypeScript** and is organized inside the `frontend/` directory.

It communicates with backend microservices through typed REST integrations and is designed to support operational workflows such as:
- dashboard monitoring
- risk reporting
- risk filtering and status tracking
- mitigation task management
- organization-level configuration views
- AI-assisted hazard reporting from images

## Tech Stack
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Radix UI
- Axios
- TanStack React Query
- React Router
- Supabase client
- Recharts
- Sonner

## Key Features
- Dashboard with summary cards and operational statistics
- Interactive risk matrix view
- Risk list with filters and detailed views
- Multi-step risk creation flow
- Task / mitigation tracking per risk
- AI-assisted image upload and analysis flow
- RTL-friendly interface with Hebrew support
- Typed API layer for cleaner backend integration

## Repository Structure
```text
rail-safe-platform-front/
└── frontend/
    ├── public/
    ├── src/
    │   ├── api/           # API config, boundaries, and services
    │   ├── components/    # UI and domain components
    │   ├── contexts/      # React contexts
    │   ├── hooks/         # React Query and custom hooks
    │   ├── pages/         # App screens/pages
    │   └── types/         # Shared frontend types
    ├── supabase/
    ├── package.json
    └── FRONTEND_README.md
```

## Getting Started
### Prerequisites
- Node.js 18+
- npm

### Installation
```bash
git clone https://github.com/yahavLer/rail-safe-platform-front.git
cd rail-safe-platform-front/frontend
npm install
```

### Run Locally
```bash
npm run dev
```
Default Vite development URL:
```text
http://localhost:5173
```

### Production Build
```bash
npm run build
npm run preview
```

## Scripts
```bash
npm run dev        # Start Vite dev server
npm run build      # Production build
npm run build:dev  # Development-mode build
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## Environment Variables
Depending on your API configuration, the frontend can use service-specific base URLs.
A common setup is:

```env
VITE_USER_API=http://localhost:8081
VITE_RISK_API=http://localhost:8082
VITE_ORG_API=http://localhost:8083
VITE_TASK_API=http://localhost:8084
VITE_IMAGE_API=http://localhost:8090
```

If your current frontend still uses a shared base URL helper, adjust the variables to match `src/api/config.ts` and `src/api/http.ts`.

## Backend Integration
This frontend is designed to work with the Spring Boot microservices in the backend repository.
Typical domains include:
- organizations
- users
- risks
- tasks / mitigations
- AI image analysis

The API layer is separated into dedicated service files to keep UI components clean and maintainable.

## UI / UX Notes
The project focuses on a practical business interface for operational users, including:
- clear dashboards
- structured forms
- component-based design
- responsive layout patterns
- support for Hebrew / RTL flows

## Why This Project Matters
This project demonstrates:
- frontend architecture for a multi-service backend
- typed REST integration patterns
- reusable component-driven UI development
- complex business flows represented in a clean web interface
- practical experience in React, TypeScript, state/data fetching, and operational dashboards

## Related Repository
Backend repository:
- https://github.com/yahavLer/rail-safe-platform

## Notes
- The actual app code lives under the `frontend/` folder.
- There is also an existing `FRONTEND_README.md` in the project; this README can replace or consolidate it into a cleaner root-facing project description.
