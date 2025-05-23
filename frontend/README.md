## Naming Conventions for React + Next.js

**File Naming**

kebab-case
for example `my-component.tsx`

**Component Naming**

PascalCase
for example `MyComponent`

**Function and Variable Naming**

camelCase
for example `fetchUserData`

**Constants and Enum Naming**

UPPER_SNAKE_CASE
for example `MAX_PUSHUPS`
kebab-case also prevents naming conflicts on case-insensitive file systems, ensuring your codebase remains consistent across different environments.

Component Naming

When naming components in a React project, it's important to use PascalCase. This convention capitalizes the first letter of each word, making component names easy to distinguish from regular HTML elements.

For example, a component that displays a user profile might be named UserProfile.

Function and Variable Naming

camelCase is the preferred convention for naming functions and variables in a React project. This convention uses lowercase letters for the first word and capitalizes subsequent words, making names easy to read and understand.
Also Object Properties and Custom Hooks should be named in camelCase.

For example, a function that fetches user data might be named fetchUserData. This convention is widely used in JavaScript and React and helps maintain consistency across your codebase.


## Folder structure for React + Next.js

```
frontend/
├── app/                    # Next.js 13+ app directory (routing and pages)
│   ├── graph/             # Graph visualization page
│   ├── multi-graph/       # Multi-graph visualization page
│   ├── timeline/          # Timeline visualization page
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Home page
│   └── providers.tsx      # Global providers wrapper
│
├── components/            # Reusable React components
│   ├── ui/               # UI components (buttons, inputs, etc.)
│   ├── primitives.ts     # Basic UI primitives
│   ├── theme-switch.tsx  # Theme switching component
│   └── icons.tsx         # Icon components
│
├── features/             # Feature-specific components and logic
│
├── hooks/               # Custom React hooks
│
├── context/            # React context providers
│
├── types/              # TypeScript type definitions
│
├── styles/             # Global styles and CSS modules
│
├── public/             # Static assets
│
├── config/             # Configuration files
│
└── [config files]      # Various configuration files
    ├── next.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── .eslintrc.json
    └── .prettierrc
```

### Directory Purposes

- **app/**: Contains all the pages and routing logic using Next.js 13+ app directory structure
- **components/**: Reusable React components that can be used across different pages
- **features/**: Feature-specific components and logic that are more complex and specific to certain features. Each visualization gets its own folder here
- **hooks/**: Custom React hooks for shared logic
- **context/**: React context providers for global state management
- **types/**: TypeScript type definitions and interfaces
- **styles/**: Global styles, CSS modules, and styling utilities
- **public/**: Static assets like images, fonts, and other files
- **config/**: Configuration files for different tools and environments

