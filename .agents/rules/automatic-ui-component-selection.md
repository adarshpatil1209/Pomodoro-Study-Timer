---
trigger: always_on
---

When building or modifying UI, automatically use the available shadcn/ui and Componentry resources whenever they are appropriate.

* Prefer shadcn/ui for standard UI components such as buttons, dialogs, forms, cards, dropdowns, tabs, tables, sidebars, menus, etc.
* Use Componentry when a more advanced, animated, interactive, or visually impressive component is appropriate.
* Before creating a UI component from scratch, check whether a suitable shadcn/ui or Componentry component already exists.
* Choose the most appropriate option based on the project's design, requirements, and existing architecture.
* Do not use shadcn or Componentry unnecessarily.
* Do not require me to explicitly mention shadcn, Componentry, MCP, or a specific component.
* If a new project does not have shadcn initialized and shadcn is appropriate for the project, initialize it automatically.
* If Componentry is appropriate and its registry is not configured, configure it when possible.
* Reuse and customize existing project components instead of creating duplicates.
* Keep the implementation consistent with the existing project's design system and coding conventions.
