# Architecture

This project is a pragmatic modular monolith: one Next.js application, one PostgreSQL database, and feature modules that grow with the product.

## Current boundaries

- `src/app` — App Router pages, layouts, and HTTP route handlers
- `src/components` — shared UI
- `src/lib` — Prisma client and Argon2id password helpers
- `src/modules/auth` — custom authentication
- `src/modules/users` — public profiles and people search
- `src/modules/tweets` — tweet create, delete, and profile lists
- `src/modules/follows` — follow/unfollow, counts, and follower/following lists
- `src/modules/timeline` — authenticated home feed with cursor pagination
- `src/modules/likes` — like/unlike tweets and viewer like-state
- `prisma` — schema, migrations, and development seed

Replies, images, notifications, and realtime updates are not present yet.

## Principles

- Keep the stack small: Next.js, TypeScript, Prisma, PostgreSQL, and the existing test tools.
- Prefer functions over classes and skip Clean Architecture / CQRS ceremony.
- Authentication is custom application code, not Firebase Auth or Supabase Auth.

## Authentication

Custom cookie sessions are implemented.

### HTTP surface

| Method | Path | Behavior |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create user + session, set cookie, return safe user (`201`) |
| `POST` | `/api/auth/login` | Verify credentials, create session, set cookie (`200`) |
| `POST` | `/api/auth/logout` | Delete current session if present, clear cookie (`204`, idempotent) |
| `GET` | `/api/auth/me` | Return the authenticated safe user, or `401` |
| `POST` | `/api/tweets` | Create a tweet for the session user (`201`) |
| `DELETE` | `/api/tweets/[id]` | Delete own tweet (`204`); `403` if another user owns it |
| `POST` | `/api/users/[username]/follow` | Follow that user as the session user (`204`, idempotent) |
| `DELETE` | `/api/users/[username]/follow` | Unfollow that user (`204`, idempotent) |
| `GET` | `/api/timeline` | Authenticated home timeline page (`200`); `cursor` and `limit` query params |
| `POST` | `/api/tweets/[id]/like` | Like a tweet as the session user (`204`, idempotent) |
| `DELETE` | `/api/tweets/[id]/like` | Unlike a tweet (`204`, idempotent) |

Pages: `/` (guest landing or signed-in home timeline), `/login`, `/register`, `/search`, `/users/[username]`, `/users/[username]/followers`, `/users/[username]/following`.

## Public profiles and search

Profiles and people search are public reads. They return a `PublicProfile` only:

- `id`
- `username`
- `displayName`
- `bio`
- `avatarUrl`

Email, `passwordHash`, and session fields are not selected from the database for these surfaces.

### Profile

`GET /users/[username]` loads the user after lowercasing the username (same rule as registration). Missing users render a 404. Avatars are initials placeholders; there is no upload.

Profiles list that user's posts, newest first (`createdAt DESC`, `id DESC` tie-break), up to 30. Empty profiles show “No posts yet.”

Profiles also show follower and following counts (PostgreSQL `COUNT` on `follows`, not by loading the collections). Counts are public. A Follow/Unfollow control is shown only when the viewer is signed in and the profile is not their own. Guests and owners see counts without a button. Viewer follow-state is loaded with a single composite-key lookup when it is relevant.

Follower and following lists are public HTML routes. They return `PublicProfile` rows only (no email or password hash), newest relationship first (`createdAt DESC`, then the related user id DESC as a stable tie-break), limited to 50.

### Search

`GET /search?q=` (HTML) and `GET /api/users/search?q=` (JSON).

- Trim the query. Empty queries return no users (they do not list everyone).
- Queries over 64 characters are rejected.
- Match is case-insensitive `contains` on `username` OR `displayName` (Prisma `mode: "insensitive"`, no raw SQL, no trigram index).
- At most 20 results, from a fetch of up to 50 matches.
- Order: exact username, username prefix, exact display name, display-name prefix, then other contains matches, then username A–Z.

Search is public. Knowing that a username exists is intentional.

## Tweets

Authenticated users create posts with `POST /api/tweets`. The author is always the session user; a client-supplied `authorId` is ignored.

Content rules:

- Trim leading and trailing whitespace, then persist. Internal newlines are kept.
- Empty or whitespace-only content is rejected.
- Maximum 280 characters after trim. Database `VARCHAR(280)` is a backstop.

Delete is `DELETE /api/tweets/[id]`:

- Unauthenticated → `401` (checked before lookup)
- Missing tweet → `404` (no extra tweet payload)
- Owned by someone else → `403` (no tweet body)
- Owner → delete, `204`

UI hiding of the delete button is not authorization.

Public tweet JSON:

- `id`, `content`, `createdAt` (ISO)
- `author`: `id`, `username`, `displayName`, `avatarUrl`
- `likeCount` (public)
- `likedByViewer` (true only for the current session; always `false` for guests)

No email, password hash, session fields, or `Like[]` rows. Dates on the page use a UTC `YYYY-MM-DD HH:mm UTC` string from the ISO timestamp to avoid hydration mismatches.

The signed-in home composer posts to the API and refreshes. Home is the social timeline described below.

## Home timeline

`GET /api/timeline` is a read. It requires a session (`401` without one). There is no CSRF origin check because it does not mutate.

The feed is the tweets the viewer should see as “home”:

- authored by the viewer, or
- authored by a user the viewer follows (`Tweet.author.followers` some `followerId = viewerId`)

Unfollowed and unrelated authors are excluded. Prisma evaluates the follow filter as a relation `some` predicate (an `EXISTS` / semi-join), so the application does not load the follow list into memory and then query tweets per author. Author fields are selected in the same `findMany` (`TWEET_AUTHOR_SELECT`). Like data is selected in that same query (`_count.likes` plus `likes` filtered to the viewer with `take: 1`). There is no `COUNT(*)` for pagination, and likes are not part of the cursor.

### Ordering

`createdAt DESC`, then `id DESC`. The id tie-break makes equal timestamps deterministic.

### Cursor

The cursor is opaque **base64url JSON**: `{ "createdAt": "<ISO>", "id": "<uuid>" }`.

Page N+1 is a keyset, not `OFFSET`:

```
createdAt < cursor.createdAt
OR (createdAt = cursor.createdAt AND id < cursor.id)
```

A tweet inserted after page 1 was fetched, and newer than that page, does not appear on page 2 and does not skip the older rows the cursor already pointed past. Malformed cursors are `400`, not `500`. Empty/`null` cursor means the first page.

`take: limit + 1` decides whether another page exists. If there is a leftover row, `nextCursor` is encoded from the last returned tweet. Otherwise `nextCursor` is `null`.

### Page size

Default **20**. Maximum **50** (larger values are capped). Non-integer, zero, or negative limits are `400`.

### UI

Signed-in `/` server-renders page 1 (composer + timeline). The timeline client also refetches `GET /api/timeline` on mount (and on `pageshow` after back/forward cache) so a follow/unfollow is visible on the next home visit without depending on a stale client router cache. **Load more** appends `?cursor=`. Posting still `router.refresh()`es; the first page remounts so the new tweet is on top. No websocket or live splice.

### Trade-offs

Keyset pagination is stable for this sort key and cheap at challenge scale. The existing `tweets` indexes (`authorId, createdAt DESC` and `createdAt DESC`) are enough; no extra migration. Deep “jump to page 40” is not supported. The cursor is not a secret, only an opaque position.

## Follow graph

Authenticated users follow with `POST /api/users/[username]/follow` and unfollow with `DELETE /api/users/[username]/follow`. The follower is always the session user. A client-supplied `followerId` is ignored; these routes do not read a JSON body.

Rules:

- Unauthenticated → `401`
- Cross-origin mutation → `403`
- Target user missing → `404`
- Following or unfollowing yourself → `400` (`FollowSelfError` in application code, before the database `follows_no_self_follow` CHECK)
- New follow → insert, `204`
- Follow that already exists → `204`, no duplicate row (unique constraint is treated as success)
- Unfollow when a row exists → delete, `204`
- Unfollow when no row exists → `204` (`deleteMany` of zero rows)

Public profile JSON and HTML still omit email, `passwordHash`, and session fields. Social data on a profile is counts plus whether the current viewer follows that profile.

Following someone includes their tweets on the next home load. Unfollowing drops them. There is still no reply, image, notification, or realtime surface.

## Likes

Authenticated users like with `POST /api/tweets/[id]/like` and unlike with `DELETE /api/tweets/[id]/like`. The liker is always the session user. These routes do not read a JSON body, so a client-supplied `userId` is ignored.

Rules:

- Unauthenticated → `401`
- Cross-origin mutation → `403`
- Tweet missing or not a UUID → `404`
- New like → insert, `204`
- Like that already exists → `204` (unique constraint treated as success)
- Unlike when a row exists → delete, `204`
- Unlike when no row exists → `204` (`deleteMany` of zero rows)

Self-likes are allowed. The product does not treat liking your own post as invalid.

### Query strategy

Timeline and profile tweet lists use one `findMany` per page:

- `_count.likes` for the public count (SQL `COUNT`, not loading `Like` rows)
- when a viewer is signed in, `likes: { where: { userId: viewerId }, take: 1 }` for `likedByViewer`

That is not N+1: there is no per-tweet follow-up query. Guests omit the viewer `likes` filter; `likedByViewer` is `false`. The `(createdAt, id)` timeline cursor is unchanged by like mutations.

### UI

`TweetCard` shows the count for everyone. Signed-in viewers get Like/Unlike (`aria-pressed`). Guests see the count only. Successful mutations update count/state locally without a full reload.

### Normalization and validation

- Email: trim, lowercase, basic `user@host.tld` shape, max 255.
- Username: trim, lowercase, 3–32 chars, `[a-z0-9_]+`. Stored lowercase so the unique index is case-insensitive without `citext`.
- Display name: trim, 1–50 characters.
- Password: 8–128 characters, hashed with Argon2id (`src/lib/password.ts`). Never logged or returned.

Duplicate email/username become `409` application errors, not raw Prisma payloads. Login failures use one generic `401` (`Invalid email or password`) whether the email is missing or the password is wrong.

### Sessions

- Token: 32 cryptographically random bytes, base64url.
- Storage: SHA-256 hex of the token in `sessions.token_hash`. The raw token is only in the cookie.
- Lifetime: 7 days. No rolling refresh.
- Expired sessions are treated as logged out. The expired row is deleted opportunistically. There is no background cleanup job.

### Cookie

Name: `flock_session`

- `HttpOnly`
- `SameSite=Lax`
- `Path=/`
- `Max-Age` 7 days
- `Secure` when `NODE_ENV=production`

### Route protection

`requireAuthenticatedUser()` (and `getCurrentUser()`) read the cookie on the server, hash the token, and load an unexpired session. UI hiding is not authorization. There is no Edge middleware: Prisma stays on the Node server.

`requireAuthenticatedUserFromToken()` is the same check without Next.js cookies, for tests and route handlers.

### CSRF

State changes are POST or DELETE, never GET. The session cookie is `SameSite=Lax`. Mutations also reject a present `Origin` that does not match the request URL. Missing `Origin` is allowed so non-browser clients and tests still work. This is not a full CSRF token scheme.

### Safe user

API responses use `toSafeUser` / `SAFE_USER_SELECT`: `id`, `email`, `username`, `displayName`, `bio`, `avatarUrl`. `passwordHash` and session hashes are never returned.

## Data model

| Table | Role |
| --- | --- |
| `users` | Accounts. Unique `email` and `username`. |
| `sessions` | Opaque hashed session tokens, 7-day expiry, cascade on user delete. |
| `tweets` | Posts. Create/delete API and profile lists are implemented. |
| `follows` | Follow graph. Follow/unfollow API, counts, and public lists are implemented. Database CHECK still rejects self-follow as a backstop. |
| `likes` | Tweet likes. Like/unlike API, public counts, and viewer liked-state are implemented. Composite PK prevents duplicates. |

IDs are UUID v4 stored as PostgreSQL `uuid`.

## Testing

- Unit tests cover validation, token hashing, cookie options, and safe-user mapping.
- Integration tests hit the route handlers against PostgreSQL.
- Playwright covers register → authenticated home → logout → login, plus search, tweets, follow/unfollow, home timeline, and like/unlike.

Database tests use `TEST_DATABASE_URL` if set, otherwise `DATABASE_URL`. Both must look local/test (`localhost`, `127.0.0.1`, `twitter_clone`, or `_test`). Tests create isolated rows and delete them; they do not run `db:reset`.

```bash
pnpm test
pnpm test:coverage
pnpm test:e2e
```

## Trade-offs

- Expired session rows can linger until they are seen again.
- `SameSite=Lax` plus Origin checking is the CSRF baseline; no synchronizer tokens.
- `pnpm db:reset` is a local wipe. Do not run it against a shared database.
