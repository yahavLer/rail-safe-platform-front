# Rail Safe Platform – Frontend

Frontend repository for **Rail Safe Platform** — a web-based **risk and safety management system** designed to help organizations document, monitor, and manage operational risks in a structured way.

This application provides the user interface for creating, reviewing, filtering, and managing risks, alongside dashboards, mitigation workflows, organization-level configurations, and **AI-assisted hazard reporting from images**.

---

## Live Demo

- **Frontend:** https://rail-safe-platform-front.vercel.app
- **Backend repository:** https://github.com/yahavLer/rail-safe-platform

---

## Overview

The frontend is built with **React + TypeScript** and is located inside the `frontend/` directory.

It communicates with backend microservices through a typed API layer and supports real operational workflows such as:

- Dashboard monitoring and statistics
- Risk reporting and structured documentation
- Risk filtering, review, and status tracking
- Mitigation task management
- Organization-level configuration views
- AI-assisted hazard detection from uploaded images

---

## Tech Stack

- **React**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **shadcn/ui**
- **Radix UI**
- **Axios**
- **TanStack React Query**
- **React Router**
- **Supabase Client**
- **Recharts**
- **Sonner**

---

## Key Features

- ✅ Dashboard with summary cards and operational statistics  
- ✅ Interactive 4x4 risk matrix  
- ✅ Risk list with filters and detailed views  
- ✅ Multi-step risk creation flow  
- ✅ Task / mitigation tracking per risk  
- ✅ AI-assisted image upload and analysis  
- ✅ Direct camera capture support  
- ✅ Typed API layer for clean backend integration  
- ✅ RTL-friendly interface with Hebrew support  

---

## Project Structure

```text
rail-safe-platform-front/
└── frontend/
    ├── public/
    ├── src/
    │   ├── api/                    # API config, types, and services
    │   │   ├── config.ts
    │   │   ├── types.ts
    │   │   ├── services/
    │   │   │   ├── organizationService.ts
    │   │   │   ├── riskService.ts
    │   │   │   ├── taskService.ts
    │   │   │   └── userService.ts
    │   │   └── index.ts
    │   │
    │   ├── hooks/                  # React Query hooks and custom hooks
    │   │   ├── useRisks.ts
    │   │   ├── useTasks.ts
    │   │   └── useOrganization.ts
    │   │
    │   ├── contexts/               # React Contexts
    │   │   └── OrganizationContext.tsx
    │   │
    │   ├── components/             # UI and domain components
    │   │   ├── layout/
    │   │   ├── dashboard/
    │   │   ├── risks/
    │   │   └── ui/
    │   │
    │   ├── pages/                  # Application pages
    │   │   ├── Dashboard.tsx
    │   │   ├── RisksList.tsx
    │   │   ├── NewRisk.tsx
    │   │   └── RiskDetail.tsx
    │   │
    │   └── types/                  # Additional shared types
    │       └── risk.ts
    │
    ├── supabase/
    ├── package.json
    └── README.md
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
Main backend domains include:
- organizations
- users
- risks
- tasks / mitigations
- AI image analysis

The API layer is separated into dedicated service files to keep UI components clean and maintainable.

## Example API Domains
### Organizations
- POST /api/organizations/create – Create organization
- GET /api/organizations/{orgId} – Get organization details
- GET /api/organizations/{orgId}/risk-matrix – Get risk matrix
- GET /api/organizations/{orgId}/categories – Get categories
### Risks
- POST /api/risks – Create risk
- GET /api/risks/{riskId} – Get risk by ID
- GET /api/risks?orgId=...&filters... – List risks with filters
- PATCH /api/risks/{riskId} – Update risk
- PATCH /api/risks/{riskId}/status – Update risk status
- DELETE /api/risks/{riskId} – Delete risk
### Tasks
- POST /api/tasks – Create task
- GET /api/tasks?orgId=... – List tasks
- PATCH /api/tasks/{taskId}/status – Update task status
### Users
POST /api/users – Create user
- GET /api/users/{id} – Get user by ID
- GET /api/users?orgId=... – List organization users

## UI / UX Notes
The project focuses on building a practical business-oriented interface for operational users, with emphasis on:
- Clear dashboards
- Structured workflows
- Reusable UI components
- Responsive layout patterns
- Support for Hebrew / RTL interfaces
- Clean separation between UI, API, and business domains

## Why This Project Matters
This project demonstrates practical experience in:
- Building frontend architecture for a multi-service backend
- Typed REST API integrations
- Component-driven UI development
- Operational dashboards and workflow-based interfaces
- Complex business flows with clean user experience
- React, TypeScript, state management, and API consumption in a real-world system 

## Related Repository
Backend repository:
- https://github.com/yahavLer/rail-safe-platform

## Notes
- The actual app code lives under the `frontend/` folder.

