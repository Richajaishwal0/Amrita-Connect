---
name: Authorization and privacy boundaries
description: Durable rules for Amrita Connect identity, role, account-status, and public-profile handling.
---

The server owns authorization truth: reload the current account from PostgreSQL for protected requests, derive the active role and status there, and never authorize from stale frontend state or JWT role claims.

**Why:** Role changes and account suspension must take effect immediately without waiting for token refresh, while public directory responses must not disclose private identity fields.

**How to apply:** Keep authenticated self responses separate from public member responses, serialize public users without email or password-related fields, and update the OpenAPI contract and generated clients together whenever those boundaries change.