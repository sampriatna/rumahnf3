# ADR-002: Canonical User and Session Identity

## Context

Identity saat ini tersebar di:

- Supabase Auth user (`auth_user_id`)
- `auth_accounts` (role/outlet/capabilities aktif di app)
- `users` legacy (schema awal)
- session cookie HMAC (`lib/session.ts`, `lib/session-token.ts`)

## Current Condition

- Login owner/admin dan staf memakai jalur berbeda namun akhirnya disatukan ke session payload.
- Role masih single-string (`staff|leader|admin|owner`) + capabilities array.
- Belum ada canonical context object yang selalu menghasilkan:
  - `user_id`
  - `role`
  - `permission`
  - `allowed_outlet_ids`
  - `active_outlet_id`
  - `session_type`

## Decision

Tetapkan **Canonical Auth Context** di backend yang dibangun dari:

1. session token terverifikasi,
2. `auth_accounts`,
3. resolver permission + outlet access.

`auth_accounts` menjadi profile aktif transisi; `users` legacy tidak dijadikan writer baru.

## Alternatives Considered

1. Pertahankan model sekarang (ad hoc per action).  
   - Pro: tanpa perubahan awal.
   - Kontra: inconsistent authz, rawan miss guard.
2. Migrasi penuh langsung ke `users/user_roles` lama.  
   - Pro: desain normalized.
   - Kontra: high risk terhadap flow login aktif.

## Why This Decision

- Menjaga kestabilan login existing.
- Menurunkan risiko miss authorization karena context seragam.
- Memungkinkan evolusi granular permission tanpa rewrite auth total.

## Compatibility Impact

- Session payload bisa tetap kompatibel selama adapter context tersedia.
- Action lama dapat di-migrate satu per satu ke canonical context.

## Migration Strategy

1. Buat builder canonical auth context.
2. Introduce wrapper guard berbasis context.
3. Migrate action/route handler bertahap.
4. Tambah test untuk role/outlet/sensitive action matrix.

## Rollback Strategy

- Guard baru dibungkus feature flag.
- Fallback ke guard lama jika critical issue login/authorization.

## Risks

- Salah mapping account -> permission dapat memblokir operasional.
- Perbedaan role lama dan permission baru bisa membingungkan user.

## Acceptance Criteria

- Semua guard backend utama membaca Canonical Auth Context.
- Context selalu berisi user/outlet/session type secara deterministic.
- Akses lintas outlet bisa diverifikasi dengan test matrix.
