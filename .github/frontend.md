# Frontend Standards

> The three most important files for UI work are:
>
> - `client/src/App.tsx` – top‑level layout and state
> - `client/src/components/chat/ChatWindow.tsx` – primary messaging UI
> - `client/src/index.css` – global styles and the only place where `@apply` is allowed.

## Framework & Setup

- **Framework:** React 18+ with Vite.
- **Components:** Functional components with Arrow Functions only.
- **Styling:** Use Tailwind CSS utility classes.

## 1. Framework & Syntax

- **Component Style:** Use **Arrow Functions only**.
  - ✅ `export const MyComponent = () => { ... }`
  - ❌ `function MyComponent() { ... }`
- **Exports:** Use **Named Exports** only. Never use `export default`.
- **TypeScript:** Define an `interface` for all Props directly above the component.

## 2. The "Clean JSX" Styling Rule (Mandatory)

Your primary goal is to keep `.tsx` files clean and readable by delegating visual complexity to `index.css`.

- **The 3-Class Limit:** Never write more than 3 Tailwind utility classes directly in a `className`.
- **Reference, Don't Author:** Inside `.tsx` files, you are ONLY permitted to write semantic class names (e.g., `className="card-container"`).
- **The "Index-Only" Rule:** All style definitions using `@apply` MUST be authored in `client/src/index.css`.
- **Naming:** Use **kebab-case**. Prefix with the component name for local styles (e.g., `.chat-input-field`).

## 3. Implementation Example

The real codebase ships with `App.tsx` and `ChatWindow.tsx` that already follow these rules. When you update or refactor those files, keep the patterns below in mind.

### ❌ WRONG (Do NOT generate this)

// Long Tailwind strings in JSX create "Utility Soup"
export const UserCard = ({ name }: Props) => (

  <div className="flex flex-col p-6 bg-slate-900 rounded-xl shadow-lg border border-slate-800 hover:bg-slate-800 transition-all cursor-pointer">
    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{name}</span>
  </div>
);

// For example, do not alter ChatWindow.tsx by injecting long class lists directly. Instead,
// define helper classes in `client/src/index.css` and reference them.

### ✅ CORRECT (Always generate this)

/_ Step 1: Define in client/src/index.css _/
.user-card-container {
@apply flex flex-col p-6 bg-slate-900 rounded-xl shadow-lg border border-slate-800;
@apply hover:bg-slate-800 transition-all cursor-pointer;
}

.user-card-label {
@apply text-xs font-bold uppercase tracking-wider text-slate-400;
}

/_ Step 2: Reference in client/src/components/UserCard.tsx _/
import type { UserProps } from './types';

export const UserCard = ({ name }: UserProps) => {
return (
<div className="user-card-container">
<span className="user-card-label">{name}</span>
</div>
);
};

## 4. Prohibited Patterns

- **No Inline Styles:** Do not use `style={{ ... }}` unless calculating dynamic values (e.g., progress bars).
- **No CSS-in-JS:** Do not use styled-components or write CSS blocks inside `.tsx` files.
- **One Component Per File:** Keep files focused and isolated.

## 5. Refactoring Instruction

If the user asks you to refactor or "fix" a component, your default priority is to move any Tailwind strings longer than 3 classes into `client/src/index.css` using the `@apply` directive.

> **Common targets for refactor/repair:** `client/src/App.tsx`, `client/src/components/chat/ChatWindow.tsx`, and `client/src/index.css`. These files already demonstrate the correct structure, so mirror their patterns when updating other UI code.
