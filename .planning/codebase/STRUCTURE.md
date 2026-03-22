# Directory Structure

```
AB0-1-front/
├── app/
│   ├── companies/
│   │   └── [id]/        # Company detail views
│   ├── dashboard/       # Dashboard & control panel
│   └── (routes)         # Next.js App router elements
├── components/          # Reusable UI elements
│   ├── ui/              # shadcn/ui generic components
│   ├── home/            # Home page specific sections
│   ├── landing/         # Landing components
│   └── company/         # Reusable company blocks
├── lib/
│   ├── api.ts           # Central API calls & Types
│   ├── api-client.ts    # Fetch utilities
│   ├── analytics/       # Consolidated GTM/PostHog tools
│   └── quote-wizard.ts
├── contexts/            # React context providers
├── hooks/
│   └── useComparison.ts 
├── public/              # Images, Icons
└── squads/              # Project rules and squad context guides
```

## Naming Conventions
- React Components use `PascalCase` (`CompanyOverview.tsx`).
- Utility scripts typically use `kebab-case` (`api-client.ts`).
- Hooks use `camelCase` (`useComparison.ts`).
