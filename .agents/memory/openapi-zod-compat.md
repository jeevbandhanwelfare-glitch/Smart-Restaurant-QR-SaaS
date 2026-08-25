---
name: OpenAPI integer compatibility
description: OpenAPI integer schemas currently generate zod.int(), which is incompatible with this workspace's installed Zod version.
---

Use numeric schemas for generated API contracts when targeting the current workspace Zod package, or upgrade the workspace Zod dependency deliberately before reintroducing OpenAPI integer types.

**Why:** The code generator emits `zod.int()` for OpenAPI integer fields, while the installed Zod version exposes number validation without that top-level helper.

**How to apply:** If codegen typechecking fails on `zod.int`, normalize the affected API fields to number schemas or coordinate a version upgrade across the workspace.