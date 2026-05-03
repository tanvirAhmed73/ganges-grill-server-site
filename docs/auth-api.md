# Authentication API — frontend integration guide

Base URL: `http://localhost:5000` (or your deployed origin).  
Interactive docs: `GET /docs` (Swagger UI).

All JSON responses use `Content-Type: application/json`. Unless noted, send JSON bodies with `Content-Type: application/json`.

---

## Error shape

Successful HTTP status codes follow REST norms (`200`, `201`, `401`, etc.). Error bodies share this shape:

```json
{
  "statusCode": 401,
  "code": "INVALID_CREDENTIALS",
  "message": "Human-readable explanation.",
  "details": {}
}
```

`code` is stable for conditional logic on the client (see table below). Validation errors may include `details` with field errors.

### Common `code` values

| `code` | Typical HTTP | Meaning |
|--------|----------------|--------|
| `VALIDATION_FAILED` | 400 | DTO / query validation |
| `EMAIL_ALREADY_REGISTERED` | 409 | Register with taken email |
| `INVALID_CREDENTIALS` | 401 | Wrong password, bad/missing JWT, bad refresh |
| `EMAIL_NOT_VERIFIED` | 403 | Login before email verification |
| `INVALID_OR_EXPIRED_OTP` | 400 | Wrong or expired email code |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token invalid or revoked |
| `USER_NOT_FOUND` | 404 | e.g. `/auth/me` user missing |
| `FORBIDDEN` | 403 | Admin guard or admin email check |
| `RATE_LIMITED` | 429 | Throttler (global or route) |
| `INTERNAL_ERROR` | 500 | Server / misconfiguration |

---

## Tokens

- **Access token** — JWT (`Bearer`). Short-lived (default **900 seconds** / 15 minutes via `JWT_ACCESS_EXPIRES_SEC`). Used for `Authorization: Bearer <accessToken>`.
- **Refresh token** — Opaque string. Long-lived (default **7 days** via `REFRESH_TOKEN_EXPIRES_DAYS`). Store securely (httpOnly cookie recommended for browsers; never commit to git).

After **verify-email**, **login**, or **refresh**, you receive:

```json
{
  "tokens": {
    "accessToken": "<jwt>",
    "refreshToken": "<opaque>",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

Or nested under `tokens` only on **refresh** (`{ "tokens": { ... } }`). **Login** returns `{ "user": {...}, "tokens": {...} }`. **verify-email** returns `{ "message": "...", "tokens": {...} }`.

---

## Endpoints

### `POST /auth/register`

Creates an account and **queues** a verification email (BullMQ → worker sends SMTP when configured).

**Body**

| Field | Type | Rules |
|-------|------|--------|
| `email` | string | Valid email |
| `name` | string | Display name |
| `password` | string | ≥8 chars, ≥1 upper, ≥1 lower, ≥1 digit |

**201 Response**

```json
{
  "message": "Registration successful. Check your email...",
  "user": {
    "id": "<uuid>",
    "email": "user@example.com",
    "name": "Pat Taylor",
    "role": "user",
    "emailVerified": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### `POST /auth/verify-email`

Completes signup using the **6-digit code** from email.

**Body**

| Field | Type | Rules |
|-------|------|--------|
| `email` | string | Same as registration |
| `code` | string | Exactly 6 digits |

**200 Response**

```json
{
  "message": "Email verified successfully.",
  "tokens": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

---

### `POST /auth/resend-verification`

Sends a new code if the account exists and is still unverified. **Same message is returned whether or not the email exists** (anti-enumeration).

**Body**

```json
{ "email": "user@example.com" }
```

**200 Response**

```json
{
  "message": "If an account exists for this email and is awaiting verification, a new code has been sent."
}
```

---

### `POST /auth/login`

**Body**

```json
{
  "email": "user@example.com",
  "password": "Str0ngPass"
}
```

**200 Response**

```json
{
  "user": {
    "id": "...",
    "email": "...",
    "name": "...",
    "role": "user",
    "emailVerified": true,
    "createdAt": "...",
    "updatedAt": "..."
  },
  "tokens": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

Requires `emailVerified: true`. Otherwise **403** with `EMAIL_NOT_VERIFIED`.

---

### `POST /auth/refresh`

Rotates the refresh token (old refresh is invalidated).

**Body**

```json
{ "refreshToken": "<opaque refresh token>" }
```

**200 Response**

```json
{
  "tokens": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

---

### `POST /auth/logout`

Revokes **one** session by refresh token.

**Body**

```json
{ "refreshToken": "<opaque>" }
```

**200 Response**

```json
{ "message": "Session ended." }
```

---

### `POST /auth/logout-all`

Revokes **all** refresh tokens for the user (all devices).

**Headers**

```
Authorization: Bearer <accessToken>
```

**200 Response**

```json
{ "message": "All sessions ended." }
```

---

### `GET /auth/me`

Current profile from access token.

**Headers**

```
Authorization: Bearer <accessToken>
```

**200 Response**

```json
{
  "user": {
    "id": "...",
    "email": "...",
    "name": "...",
    "role": "user",
    "emailVerified": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### `GET /auth/session`

Lightweight JWT claims (no DB hit).

**Headers**

```
Authorization: Bearer <accessToken>
```

**200 Response**

```json
{
  "sub": "<user uuid>",
  "email": "user@example.com",
  "role": "user"
}
```

---

### `GET /auth/admin/:email`

Returns whether `:email` has admin role. The `:email` path segment **must match** the email in the JWT (you cannot query someone else).

**Headers**

```
Authorization: Bearer <accessToken>
```

**200 Response**

```json
{ "isAdmin": false }
```

---

## Other routes using the access token

Protected routes expect:

```
Authorization: Bearer <accessToken>
```

Examples in this project:

- `POST /cart`, `DELETE /cart/:id` — JWT required; cart rows use the authenticated user’s id/email.
- `GET /user` (admin list), `DELETE /user/:id`, `PATCH /user/admin/:id` — JWT + admin role.
- `DELETE /menuItem/:id` — JWT + admin.

JWT payload uses:

- `sub` — user id  
- `email`  
- `role` — `user` | `admin`

---

## Local development checklist

1. **PostgreSQL** — run migrations: `npx prisma migrate dev`
2. **Redis** — BullMQ workers need Redis (e.g. `docker run -p 6379:6379 redis:7-alpine`)
3. **Env** — copy `.env.example` to `.env` and set secrets (see file comments)
4. **Email** — if `SMTP_USER` is unset, the worker logs the OTP to the server console instead of sending mail

---

## Removed legacy endpoints

These are **removed** (do not use on new clients):

- `POST /jwt`
- `POST /user` (old token mint)

Use **`POST /auth/login`**, **`POST /auth/register`**, and **`POST /auth/refresh`** instead.
