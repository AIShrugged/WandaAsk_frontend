Create a domain entity: $ARGUMENTS

Entities represent core domain objects used across features. Create in `entities/<name>/`.

## Structure
```
entities/
  <name>/
    model/          # TypeScript interfaces, Zod schemas, transformations
      types.ts      # Entity interfaces and types
      schemas.ts    # Zod v4 validation schemas
    ui/             # Entity-specific UI components (cards, badges, avatars)
    lib/            # Entity-specific utilities (formatters, helpers)
    index.ts        # Public API barrel export
```

## Rules
- Entities are shared domain objects — used by multiple features
- Entity defines the "shape" of data: types, schemas, display components
- No feature-specific business logic in entities
- Zod v4 syntax: `z.email()`, `z.literal(value, { error })`
- TypeScript strict mode, no `any`
- UI components in entities are presentational only (no data fetching)
- Keep entity lean — if logic is feature-specific, it belongs in `features/`

## Examples
- `entities/user` — User type, avatar component, name formatter
- `entities/meeting` — Meeting type, meeting card, duration formatter
- `entities/organization` — Organization type, org badge

Look at existing entities in `entities/` directory first.
