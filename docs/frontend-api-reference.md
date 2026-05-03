# Frontend API reference

Base URL is your deployed origin (e.g. `https://api.example.com`). There is **no global `/api` prefix** unless your proxy adds one.

**Interactive docs:** Open **`GET /docs`** (Swagger UI) when the server is running.

**Authentication:** Endpoints marked **Bearer** expect header:

```http
Authorization: Bearer <access_token>
```

Tokens come from `POST /auth/login`, `POST /auth/verify-email`, or `POST /auth/refresh`. Store **`refreshToken`** securely; send **`accessToken`** on each API call until it expires (`expiresIn` is seconds).

---

## Shared types

### User object (`user`)

Returned inside wrappers like `{ user }`.

| Field | Type | Notes |
| ----- | ---- | ----- |
| `id` | string (UUID) | |
| `email` | string | Lowercased by server |
| `name` | string | |
| `role` | string enum | See **UserRole** |
| `emailVerified` | boolean | |
| `createdAt` | string (ISO 8601) | JSON serialization |
| `updatedAt` | string (ISO 8601) | |

### UserRole

`user` | `admin` | `restaurant_owner`

### Token pair (`tokens`)

| Field | Type |
| ----- | ---- |
| `accessToken` | string (JWT) |
| `refreshToken` | string (opaque, long-lived) |
| `expiresIn` | number (seconds, access token TTL) |
| `tokenType` | `"Bearer"` |

### Error response

Validation / business errors use a consistent JSON body:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_FAILED",
  "message": "Human-readable message",
  "details": {}
}
```

`details` may be omitted. Common `code` values include `VALIDATION_FAILED`, `FORBIDDEN`, `EMAIL_ALREADY_REGISTERED`, `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`, etc.

---

## Auth (`/auth`)

### POST `/auth/register`

**Description:** Creates a **customer** account (`role`: `user`). Sends a **6-digit OTP** email (queued via BullMQ). User must call **`verify-email`** before **`login`**.

**Request body:**

```json
{
  "email": "user@example.com",
  "name": "Pat Taylor",
  "password": "Str0ngPass"
}
```

**Password rules:** min 8 chars, at least one uppercase, one lowercase, one digit.

**Response:** `201 Created`

```json
{
  "message": "Registration successful. Check your email for a verification code to activate your account.",
  "user": { "id": "...", "email": "...", "name": "...", "role": "user", "emailVerified": false, "createdAt": "...", "updatedAt": "..." }
}
```

---

### POST `/auth/register-restaurant-owner`

**Description:** Same OTP flow as register, but creates **`restaurant_owner`** and **one linked restaurant** (`pending_review`, placeholder image, generated **slug**). One restaurant per owner.

**Request body:**

```json
{
  "email": "chef@example.com",
  "name": "Jamil Ahmed",
  "password": "Str0ngPass",
  "restaurantName": "Ma Biryani — Banani",
  "primaryCategory": "Biryani, Bangladeshi",
  "phone": "+880 1XXX-XXXXXX"
}
```

| Field | Required | Notes |
| ----- | -------- | ----- |
| `email` | yes | |
| `name` | yes | Owner’s display name |
| `password` | yes | Same rules as register |
| `restaurantName` | yes | Max 200 chars |
| `primaryCategory` | no | Defaults to `"Restaurant"` |
| `phone` | no | Max 40 chars |

**Response:** `201 Created`

```json
{
  "message": "Restaurant account created. Check your email for a verification code to activate your account.",
  "user": { "id": "...", "email": "...", "name": "...", "role": "restaurant_owner", "emailVerified": false, "createdAt": "...", "updatedAt": "..." }
}
```

---

### POST `/auth/verify-email`

**Description:** Completes signup with the OTP from email. Returns **tokens** on success.

**Request body:**

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:** `200 OK`

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

### POST `/auth/resend-verification`

**Description:** Sends a new OTP if the account exists and is still unverified. Response is **generic** (does not reveal whether the email exists).

**Request body:**

```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`

```json
{
  "message": "If an account exists for this email and is awaiting verification, a new code has been sent."
}
```

---

### POST `/auth/login`

**Description:** Email + password. **Requires verified email.**

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "Str0ngPass"
}
```

**Response:** `200 OK`

```json
{
  "user": { "id": "...", "email": "...", "name": "...", "role": "user | admin | restaurant_owner", "emailVerified": true, "createdAt": "...", "updatedAt": "..." },
  "tokens": {
    "accessToken": "...",
    "refreshToken": "...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

---

### POST `/auth/refresh`

**Description:** Rotates the refresh token; returns a **new** access + refresh pair.

**Request body:**

```json
{
  "refreshToken": "<opaque refresh token>"
}
```

**Response:** `200 OK`

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

### POST `/auth/logout`

**Description:** Revokes the given refresh token (current session).

**Request body:**

```json
{
  "refreshToken": "<opaque refresh token>"
}
```

(`refreshToken` may be optional in schema but typically send it.)

**Response:** `200 OK`

```json
{
  "message": "Session ended."
}
```

---

### POST `/auth/logout-all` — **Bearer**

**Description:** Revokes **all** refresh tokens for the authenticated user.

**Response:** `200 OK`

```json
{
  "message": "All sessions ended."
}
```

---

### GET `/auth/me` — **Bearer**

**Description:** Loads profile by access token.

**Response:** `200 OK`

```json
{
  "user": { "id": "...", "email": "...", "name": "...", "role": "...", "emailVerified": true, "createdAt": "...", "updatedAt": "..." }
}
```

---

### GET `/auth/session` — **Bearer**

**Description:** Lightweight JWT claims for UI routing.

**Response:** `200 OK`

```json
{
  "sub": "<user uuid>",
  "email": "user@example.com",
  "role": "restaurant_owner"
}
```

---

### GET `/auth/admin/:email` — **Bearer**

**Description:** Legacy check: whether `:email` is admin. **`email` path must match the token’s email.**

**Response:** `200 OK`

```json
{
  "isAdmin": false
}
```

---

## Discovery (`/discovery`)

### GET `/discovery/home`

**Description:** Public homepage bundle (cuisines, deals, restaurant cards by section, maps, deduped `allRestaurants`). Discovery placements only include restaurants with **`status`: `active`**.

**Auth:** none

**Response:** `200 OK`

```json
{
  "cuisines": [{ "name": "Pizza", "image": "https://..." }],
  "dailyDeals": [
    {
      "title": "Flat 60% off",
      "subtitle": "With selected partners",
      "image": "https://...",
      "bgClass": "from-fuchsia-500 to-pink-500"
    }
  ],
  "featuredRestaurants": [
    { "name": "...", "category": "...", "eta": "25 min", "rating": 4.3, "image": "https://..." }
  ],
  "dealNaoRestaurants": [],
  "fastDeliveryRestaurants": [],
  "topBrands": [{ "name": "Kacchi Bhai", "colorClass": "bg-red-500" }],
  "cuisineMap": { "Pizza": ["pizza"] },
  "dealMap": { "Flat 60% off": ["burger", "pizza", "fast food"] },
  "allRestaurants": []
}
```

---

## Restaurant owner (`/restaurant-owner`)

All routes require **Bearer** access token and **`role`: `restaurant_owner`**. Otherwise **`403`** with `FORBIDDEN`.

---

### GET `/restaurant-owner/me/restaurant`

**Description:** The logged-in vendor’s single restaurant profile.

**Response:** `200 OK`

```json
{
  "restaurant": {
    "id": "<uuid>",
    "slug": "ma-biryani-banani",
    "name": "Ma Biryani — Banani",
    "description": "",
    "phone": "+880...",
    "addressLine1": null,
    "city": null,
    "postalCode": null,
    "category": "Biryani, Bangladeshi",
    "eta": "30 min",
    "rating": 0,
    "image": "https://...",
    "status": "pending_review | draft | active | suspended",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### PATCH `/restaurant-owner/me/restaurant`

**Description:** Partial update of listing fields. **`slug`** is normalized server-side (lowercase, hyphenated); must stay globally unique.

**Request body (all optional):**

```json
{
  "name": "Updated name",
  "description": "About us...",
  "phone": "+880...",
  "addressLine1": "Road 12",
  "city": "Dhaka",
  "postalCode": "1212",
  "category": "Biryani, Rice",
  "eta": "25 min",
  "image": "https://...",
  "slug": "my-store-name"
}
```

**Response:** `200 OK` — same shape as GET (`{ restaurant: { ... } }`).

---

### GET `/restaurant-owner/me/products`

**Description:** All menu items for this restaurant, sorted by `sortOrder` then newest.

**Response:** `200 OK`

```json
{
  "products": [
    {
      "id": "<uuid>",
      "restaurantId": "<uuid>",
      "name": "Chicken Biryani",
      "description": "",
      "image": "https://...",
      "category": "Mains",
      "price": 12.99,
      "isAvailable": true,
      "sortOrder": 0,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

### POST `/restaurant-owner/me/products`

**Description:** Create a product.

**Request body:**

```json
{
  "name": "Chicken Biryani",
  "description": "Optional long text",
  "image": "https://...",
  "category": "Mains",
  "price": 12.99,
  "isAvailable": true,
  "sortOrder": 0
}
```

| Field | Required |
| ----- | -------- |
| `name`, `image`, `category`, `price` | yes |
| `description` | no (default `""`) |
| `isAvailable` | no (default `true`) |
| `sortOrder` | no (default `0`) |

**Response:** `201` (Nest default for POST may still be 200 depending on version; controller does not set `@HttpCode` — treat as success body):

```json
{
  "product": { "id": "...", "restaurantId": "...", "name": "...", "description": "...", "image": "...", "category": "...", "price": 12.99, "isAvailable": true, "sortOrder": 0, "createdAt": "...", "updatedAt": "..." }
}
```

---

### PATCH `/restaurant-owner/me/products/:id`

**Description:** Partial update. `:id` is product **UUID**.

**Request body (all optional):** same fields as create (`name`, `description`, `image`, `category`, `price`, `isAvailable`, `sortOrder`).

**Response:** `200 OK` — `{ "product": { ... } }`.

**Errors:** `404`-style if product not found / not owned (`VALIDATION_FAILED` message).

---

### DELETE `/restaurant-owner/me/products/:id`

**Description:** Deletes product. **Fails** if line items in past orders reference it (DB RESTRICT).

**Response:** `200 OK`

```json
{
  "deleted": true
}
```

---

### GET `/restaurant-owner/me/orders`

**Description:** Orders placed at this restaurant (customer checkout populates these later).

**Query:** optional `status` — one of **OrderStatus** (see below).

Example: `/restaurant-owner/me/orders?status=pending_acceptance`

**Response:** `200 OK`

```json
{
  "orders": [
    {
      "id": "<uuid>",
      "orderNumber": "GG-20260503-A1B2C3",
      "status": "pending_acceptance",
      "subtotal": 25.5,
      "deliveryFee": 2.0,
      "tax": 0,
      "total": 27.5,
      "deliveryAddressLine1": "House 1",
      "deliveryCity": "Dhaka",
      "deliveryPhone": "+880...",
      "customerNotes": null,
      "customer": {
        "id": "<uuid>",
        "name": "Customer Name",
        "email": "c@example.com"
      },
      "items": [
        {
          "id": "<line uuid>",
          "productId": "<product uuid>",
          "productName": "Chicken Biryani",
          "unitPrice": 12.99,
          "quantity": 2,
          "lineTotal": 25.98
        }
      ],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

### GET `/restaurant-owner/me/orders/:id`

**Description:** Single order (must belong to this restaurant). `:id` is order **UUID**.

**Response:** `200 OK`

```json
{
  "order": {
    "id": "...",
    "orderNumber": "...",
    "status": "...",
    "subtotal": 0,
    "deliveryFee": 0,
    "tax": 0,
    "total": 0,
    "deliveryAddressLine1": null,
    "deliveryCity": null,
    "deliveryPhone": null,
    "customerNotes": null,
    "customer": { "id": "...", "name": "...", "email": "..." },
    "items": [],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### PATCH `/restaurant-owner/me/orders/:id/status`

**Description:** Vendor advances order state. Only **allowed transitions** are permitted (e.g. `pending_acceptance` → `accepted` or `rejected`). Same status is idempotent (returns current order).

**Request body:**

```json
{
  "status": "accepted"
}
```

**OrderStatus** (exact strings):

- `pending_acceptance`
- `accepted`
- `preparing`
- `ready_for_pickup`
- `out_for_delivery`
- `delivered`
- `cancelled_by_customer`
- `cancelled_by_restaurant`
- `rejected`

**Vendor-allowed transitions (typical):**

- `pending_acceptance` → `accepted` | `rejected`
- `accepted` → `preparing` | `cancelled_by_restaurant`
- `preparing` → `ready_for_pickup` | `cancelled_by_restaurant`
- `ready_for_pickup` → `out_for_delivery` | `delivered`
- `out_for_delivery` → `delivered`

**Response:** `200 OK` — same shape as **GET** `/restaurant-owner/me/orders/:id` (`{ order: { ... } }`).

---

## Legacy global routes (menu / cart)

These use **no `/api` prefix** (controller path is empty).

### GET `/menuItem`

**Auth:** none — returns global legacy menu items (not per-restaurant vendor products).

**Response:** `200 OK` — array of:

```json
{
  "_id": "<uuid>",
  "name": "...",
  "recipe": "...",
  "image": "...",
  "category": "...",
  "price": 9.99,
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

### GET `/cart?email=`

**Auth:** none — legacy query by email string.

---

### POST `/cart` — **Bearer**

**Description:** Add cart line for authenticated user; server uses JWT email.

**Request body:**

```json
{
  "foodId": "<string>",
  "email": "optional@example.com",
  "name": "Item display name",
  "image": "https://...",
  "price": 9.99
}
```

---

### DELETE `/cart/:id` — **Bearer**

**Description:** Remove cart row by id.

---

## Notes for customer checkout (not implemented yet)

Peers implementing checkout should create **`Order`** + **`OrderItem`** rows with monetary snapshots. Order numbers can follow server helper pattern **`GG-YYYYMMDD-HEX`** (see `src/common/utils/order-number.ts`). Restaurant owners will then see those orders under **`GET /restaurant-owner/me/orders`**.

---

## Rate limits

Throttling is enabled globally (default **100 req/min** per IP unless configured). Auth endpoints have stricter per-route limits (see `@Throttle` on controller).
