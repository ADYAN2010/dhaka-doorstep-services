# Service layer

The `src/services/*` modules are the **only** place the UI talks to data. They
return domain types from `src/domain/types.ts` so the UI never knows whether
the source is a mock array, the Supabase client, or a future REST API.

## Swapping mocks for real data

Each module has the same shape:

```ts
// 1. Pure domain mappers (rows-from-anywhere → domain types)
function mapRow(row): Booking { ... }

// 2. Public async API (UI calls these)
export const bookingsService = {
  list: async (...) => { ... },
  get:  async (id) => { ... },
  create: async (input) => { ... },
};
```

To migrate a module to a real backend:

1. Keep the function **signatures and return types** identical.
2. Replace the mock body with a call to `supabase.from('table').select(…)`.
3. Run the existing UI — no component change needed.

That's the whole contract. Nothing else in the app should ever import from
`src/data/*` directly — always go through `src/services/*`.
