# Global Core Standards

## Module System
- **ES Modules:** Always use `import/export`. Never use `require` in TypeScript/TSX files.
- **Imports:** Use destructured imports: `import { foo } from 'bar'` instead of `import * as bar`.
- **TypeScript:** Strict mode enabled. Never use `any` type. Use `unknown` if type is truly unknown.

## Code Style
- **Functions:** Use Arrow Functions for components and callbacks.
- **Syntax:** Use Optional Chaining (`?.`) and Nullish Coalescing (`??`).

## Architecture Principles
- **Separation:** Keep business logic separate from UI components.
- **Verification:** Always run typecheck (`tsc --noEmit`) after code changes.
- **Immutability:** Prefer immutable patterns. Use `const` by default, `let` only when necessary.
