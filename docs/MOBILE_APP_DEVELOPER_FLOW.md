# XTrim Mobile App — Developer Flow Guide (Full)

**Audience:** engineers and PMs wiring the Expo app to **Clerk**, **GraphQL**, and third parties.  
**Source of truth for routes:** `app/` (Expo Router). **Editable source for this guide:** this Markdown file; regenerate the Word export with `npm run docs:flow-docx`.

**Convention:** **Member (client)** flows are documented first, then **coach**. **Backend** means your GraphQL API unless stated otherwise.

---

## End-to-end journey — member (from app install to daily use)

1. User opens the app → **Redux rehydrates** → **Clerk** loads session from device.
2. **`/`** (`index`) — if **not** signed in → **`/(auth)/login`**.
3. User signs in with **Clerk** (email/OTP and/or OAuth per your dashboard).
4. **`/`** again — Redux has no user → **`Me`** query with Clerk bearer token.
5. If **`me`** is **null** → **`/(auth)/complete-registration`** → **`createUser`** → route by **`getPostRegistrationHref`** (almost always **`first`** for a brand-new member).
6. **Onboarding `first` → `second` → `third`**. If terms not done, **`fourth`** then back to **`third`**.
7. **`third`** finalize → **`hasEnteredDetails: true`** → **`/(member)/dashboard`**.
8. **Without active gym membership:** tab bar defaults to **Workouts**; **Dashboard / Schedule / Progress** tabs show **membership required** modal; **MemberWalkInBanner** may appear; **`MemberMeSyncAndWelcome`** can poll **`me`** until membership or biometric state updates.
9. **With active membership:** **Dashboard** becomes the default tab; full access to schedule, progress, coaches, attendance, session logs from tabs and header menu.

## End-to-end journey — coach

1. Sign in with **Clerk** as a user whose **`me.role`** is **`coach`**.
2. **`/`** hydrates **`me`** → immediate **`/(coach)/dashboard`** (no member onboarding).
3. Use **Schedule** for sessions/classes, **Clients** / **Requests** for roster and approvals, **Progress** for ratings, **Completed sessions** for history, etc.

---

## Document control

| Item | Location |
|------|----------|
| **Word export (regenerated)** | Default output file **`MOBILE_APP_DEVELOPER_FLOW_FULL.docx`** in this folder. Command **`npm run docs:flow-docx`**. If the shorter-named `.docx` is not open in another app, the script also overwrites that copy. |
| Root layout, providers | `app/_layout.tsx` |
| Route gate + `me` hydrate | `app/index.tsx` |
| Auth stack + auto-navigation | `app/(auth)/_layout.tsx` |
| Member tabs | `app/(member)/_layout.tsx` |
| Coach tabs | `app/(coach)/_layout.tsx` |
| Post-auth helpers | `lib/post-auth-navigation.ts` |
| Apollo client + API URL rules | `lib/apollo-client.ts` |
| Clerk → Apollo token | `components/ClerkTokenBridge.tsx`, `lib/clerk-token.ts` |
| Operations | `graphql/queries.ts`, `graphql/mutations.ts` |
| Generated hooks/types | `graphql/generated/types.ts` (run `npm run generate`) |

---

## Tech stack (what talks to what)

| Piece | Role |
|--------|------|
| **Clerk** | Sign-in / sign-up / SSO; session JWT; `@clerk/clerk-expo`. |
| **GraphQL API** (`expo.extra.apiUrl` → Apollo `HttpLink`) | Users, sessions, goals, memberships, coach requests, ratings, attendance, walk-in, group classes, etc. **Required** for production behavior. |
| **Redux + redux-persist** | Cached `user` slice; survives restarts until logout. |
| **ExerciseDB via RapidAPI** | Optional `expo.extra.exerciseDbApiKey`; host **`exercisedb.p.rapidapi.com`**, header **`X-RapidAPI-Host`**. Used in **member** workouts/schedule/progress imagery and **coach** schedule exercise picker. |
| **Cloudinary** | Client uploads (e.g. progress photos, IDs, session completion images); API stores returned URLs on user/session records. |
| **AsyncStorage** (`@/utils/storage`) | `auth_token`, auth-flow intent, onboarding welcome flag, notification “seen” ids, biometric reminder ack, walk-in cache keys, etc. |

---

## Repository layout (mobile client)

- **`app/`** — Screens and layouts (file-based routing). Groups: `(auth)`, `(member)`, `(coach)`.
- **`components/`** — Shared UI: `TabHeader`, `NotificationsDrawer`, `ProtectedRoute`, `MemberWalkInBanner`, `MemberMeSyncAndWelcome`, modals, etc.
- **`contexts/`** — `AuthContext`, `OnboardingContext`, `MemberMembershipModalContext`.
- **`graphql/`** — Hand-written operations + codegen output.
- **`lib/`** — Apollo client, Clerk helpers, navigation helpers.
- **`store/`** — Redux store, `user` slice, persistor.
- **`utils/`** — Membership helpers, time, storage, auth-flow persistence.

---

## Cold start — provider order (`app/_layout.tsx`)

1. **`GestureHandlerRootView`** → **`SafeAreaProvider`**.
2. **`Provider` (Redux)** → **`PersistGate`** — shows “Loading app…” until persisted state is rehydrated.
3. **`ClerkProvider`** — requires `clerkPublishableKey` from `expo.extra` or **`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`**. If missing, a blocking message tells the developer to set the key.
4. **`ClerkDevPairingLogger`** — logs API/Clerk pairing hints in dev (`lib/clerk-api-pairing-hint.ts`).
5. **`ApolloProvider`** — shared Apollo client (`lib/apollo-client.ts`).
6. **`ClerkTokenBridge`** — registers Clerk `getToken` with the Apollo auth link so each GraphQL request sends `Authorization: Bearer <jwt>`.
7. **`AuthProvider`** — exposes `user`, `onboardingStatus`, `logout`.
8. **`Stack`** screens: `index`, `sso-callback`, `(auth)`, `(coach)`, `(member)` — all **headerShown: false**.

`expo-web-browser` **`maybeCompleteAuthSession()`** runs at module load for OAuth completion.

---

## Configuration

### `app.config.js` → `expo.extra` (non-secret publishable values)

| Key | Purpose |
|-----|---------|
| **`apiUrl`** | GraphQL HTTP(S) endpoint used when present (see Apollo fallbacks below). |
| **`clerkPublishableKey`** | Clerk publishable key (safe in client; not the secret key). |
| **`exerciseDbApiKey`** | RapidAPI key for ExerciseDB (optional). |
| **`eas.projectId`** | EAS build metadata. |

Secrets must not be committed; use EAS secrets / env for production keys.

### GraphQL base URL resolution (`lib/apollo-client.ts`)

- **If `Constants.expoConfig?.extra?.apiUrl` is set** — used as the primary URL (typical for physical devices and production builds).
- **`__DEV__` fallbacks** when `extra.apiUrl` is absent vary by **platform** (Android emulator LAN, `10.0.2.2`, iOS simulator `localhost`, web `localhost`, etc.). Developers should set **`extra.apiUrl`** to `http://<LAN-IP>:<port>/graphql` for real devices on the same Wi‑Fi.

The Apollo client adds an **auth link** that reads the Clerk JWT (via `getClerkBearerToken`) and optional **`auth_token`** from storage for compatibility.

---

## Authentication and session

### Clerk

- **Login:** `app/(auth)/login.tsx` — sets **`auth_flow`** to **`login`** in storage (`utils/auth-flow.ts`) before/after sign-in; successful flows call **`replaceToAppRoot()`** (`lib/post-auth-navigation.ts`) so the root stack dismisses auth UI then **`router.replace('/')`** after interactions (avoids Android “Unmatched route” flashes).
- **Signup:** `app/(auth)/signup.tsx` — sets **`auth_flow`** to **`signup`**; after Clerk verification and **`createUser`**, navigates with **`getPostRegistrationHref`** or **`replaceToAppRoot`** depending on branch.
- **OAuth / SSO:** may complete via **`app/sso-callback.tsx`** and `expo-auth-session` / `expo-web-browser`.

Clerk does **not** require Gmail; any identity provider enabled in the Clerk dashboard is valid.

### `me` query (`graphql/queries.ts` — **`ME_QUERY`** / `useMeQuery`)

`app/index.tsx` runs **`Me`** when Clerk reports signed-in but Redux has **no** `user` yet. The selection includes **`membershipDetails.hasEnteredDetails`**, **`facilityBiometricEnrollmentComplete`**, **`coachDetails`**, and profile fields used across the app. Successful parse uses **`convertGraphQLUser`** into Redux **`setUser`**.

### When `data.me` is **null** (Clerk user exists, no backend row)

After `getAuthFlowIntent()` resolves (reads **`auth_flow`**), **`index`** redirects to **`/(auth)/complete-registration`**. There the user submits legal name fields and **`CREATE_USER_MUTATION`** runs; token may be written to **`auth_token`** in storage; then **`router.replace(getPostRegistrationHref(user))`**.

### Logout (`contexts/AuthContext.tsx`)

**`logout`** calls Clerk **`signOut`**, removes **`auth_token`**, **`user_walkin`**, clears **`auth_flow`** (`clearAuthFlowIntent`), and **`clearUser`** in Redux.

---

## Global routing reference

### Expo Router groups (URL groups, not path segments on device)

| Group | Purpose |
|-------|---------|
| **`(auth)`** | Login, signup, complete-registration, onboarding stack. |
| **`(member)`** | Member tabs + hidden screens; **`ProtectedRoute`** role **`member`**. |
| **`(coach)`** | Coach tabs + hidden screens; **`ProtectedRoute`** role **`coach`**. |

### `app/index.tsx` — decision summary

1. Clerk not loaded → loading UI.
2. Not signed in → **`Redirect`** to **`/(auth)/login`**; if Redux still had a user, it is cleared and **`auth_token`** removed.
3. Signed in, Redux user empty → run **`me`**:
   - Parse / network errors → retry UI with copy about cold API / network.
   - **`me` null** → after auth-flow intent loads → **`/(auth)/complete-registration`**.
   - **`me` present** → Redux hydrated; **`clearAuthFlowIntent`**.
4. Redux user present:
   - **`role === 'coach'`** → **`/(coach)/dashboard`**.
   - **`role === 'member'`** — if **`onboardingStatus !== 'completed'`** → **`/(auth)/(onboarding)/first`**; else **`/(member)/dashboard`**.
   - **`role === 'admin'`** (or any other) → **`Redirect`** to **`/(auth)/login`** via **`getPostRegistrationHref`** fallback pattern is not used here — **`index`** explicitly only branches coach/member; **other roles fall through to login redirect** (see end of `index.tsx`).

### `getPostRegistrationHref` (`lib/post-auth-navigation.ts`)

| `user.role` | Destination |
|-------------|----------------|
| **`coach`** | `/(coach)/dashboard` |
| **`member`** with **`hasEnteredDetails`** | `/(member)/dashboard` |
| **`member`** without **`hasEnteredDetails`** | `/(auth)/(onboarding)/first` |
| **`admin`** | `/` (root **index** will re-evaluate) |
| else | `/(auth)/login` |

### `app/(auth)/_layout.tsx` — authenticated redirect

When **`isAuthenticated`** and Redux **`user`** exist, a **150ms** delayed **`router.replace`**:

- **Coach** not under `(coach)` → **`/(coach)/dashboard`**.
- **Member** without **`hasEnteredDetails`** not in onboarding segments → **`/(auth)/(onboarding)/first`**.
- **Member** with **`hasEnteredDetails`** still in onboarding or not under `(member)` → **`/(member)/dashboard`**.

### `ProtectedRoute` (`components/ProtectedRoute.tsx`)

- Not authenticated → login.
- **Member** with **`onboardingStatus !== 'completed'`** and not in onboarding route segments → **`/(auth)/(onboarding)/first`**.
- Wrong role for the layout → redirect to the other role’s dashboard or login.

Onboarding segment detection includes **`fifth`** for forward compatibility even though the current onboarding stack defines **`first`–`fourth`** only.

---

## Auth screens (detail)

| Screen | Route | Behavior |
|--------|-------|----------|
| **Login** | `/(auth)/login` | Clerk sign-in; **`setAuthFlowIntent('login')`**; **`replaceToAppRoot()`** on success. |
| **Signup** | `/(auth)/signup` | Clerk sign-up + verification UI; **`createUser`** as **member**; **`getPostRegistrationHref`** or root replace. |
| **Complete registration** | `/(auth)/complete-registration` | Collects names when **`me`** is null; **`createUser`**; navigates via **`getPostRegistrationHref`**. |

---

## Member onboarding (until `hasEnteredDetails` is true)

### Provider

**`OnboardingProvider`** wraps **`app/(auth)/(onboarding)/_layout.tsx`** so **`first` → `fourth`** share **`OnboardingContext`** state.

### `OnboardingData` fields (`contexts/OnboardingContext.tsx`)

| Field | Typical screen |
|-------|----------------|
| **`phoneNumber`**, **`dateOfBirth`**, **`gender`** | `first` |
| **`fitnessGoal`**, **`physiqueGoalType`**, **`workOutTime`** | `second` |
| **`membershipIntent`**, **`requestedMembershipId`**, **`termsWaiverCompletedPreMembership`** | `third` / flows |
| **`agreedToTermsAndConditions`** | `fourth` (and merged into finalize) |

### Screen sequence

1. **`first.tsx`** — collects phone, DOB, gender; **`updateData`**.
2. **`second.tsx`** — goals, physique, workout times → **`router.push('/(auth)/(onboarding)/third')`**.
3. **`third.tsx`** — membership UI, **`getMemberships`**, **`getMySubscriptionRequests`**, **`UPDATE_USER_MUTATION`** on finalize, **`CREATE_SUBSCRIPTION_REQUEST_MUTATION`** when requesting a plan, **`finalizeOnboarding`** path sets **`membershipDetails.hasEnteredDetails: true`**. If **`termsWaiverCompletedPreMembership`** is false, a **`useEffect`** **`router.replace('/(auth)/(onboarding)/fourth')`** so terms happen before finalizing.
4. **`fourth.tsx`** — terms / waiver / signatures as designed; pre-membership completion **`router.replace` back to `third`**; end-of-onboarding can **`clearData`** and set **`onboarding_welcome`** in storage for the dashboard modal.

After successful finalize from **`third`**, **`router.replace('/(member)/dashboard')`** and optional **`SYNC_MY_WALK_IN_PROFILE_MUTATION`** for walk-in sync when the member has no active gym membership.

### `AuthContext.onboardingStatus` (members)

**`completed`** iff **`user.membershipDetails?.hasEnteredDetails`** is true. **Coaches** always get **`completed`** for this field so they never see member onboarding gates.

---

# Part 1 — Member (client) app

## Member layout (`app/(member)/_layout.tsx`)

- **`ProtectedRoute`** with **`allowedRoles={['member']}`**.
- **`MemberMembershipModalProvider`** — global “Membership required” modal; confirm navigates to **`/(member)/subscription`**.
- **`MemberMeSyncAndWelcome`** — polls **`me`** when membership inactive or facility biometric incomplete; shows **`PostOnboardingWelcomeModal`** when transitioning to “ready”; optional biometric reminder stored per user id.
- **Tabs:** **`initialRouteName`** is **`dashboard`** if **`memberHasActiveGymMembership(user)`**, else **`workouts`**.
- **Tab blockers:** **`dashboard`**, **`schedule`**, **`progress`** use **`tabPress`** **`preventDefault`** when there is **no** active gym membership and open **`openMembershipRequired()`**.

## Member walk-in (`MemberWalkInBanner`)

Shown when the member has **no** active membership: **`MY_MEMBER_WALK_IN_STATUS_QUERY`** on an interval, **`SYNC_MY_WALK_IN_PROFILE_MUTATION`** on focus / first mount; displays walk-in desk registration / last time-in when the API reports **`registered`**.

## Member dashboard (`app/(member)/dashboard.tsx`)

- Queries: **upcoming sessions**, **goals**, **client sessions**, **current membership** (see imports from **`graphql/queries.ts`**).
- **No membership:** on focus, **`openMembershipRequired()`** and **`router.replace('/(member)/workouts')`**.
- **Post-onboarding welcome:** route param **`onboardingWelcome`** or AsyncStorage **`onboarding_welcome`** (`limited` | `counter` | `active`) triggers **`PostOnboardingWelcomeModal`**; cleared after use.

## Other member routes (feature summary)

| Route | File | Features |
|-------|------|----------|
| **Workouts** | `workouts.tsx` | Exercise list by body part, RapidAPI fetch, rest/timer UX; degrades without API key. |
| **Schedule** | `schedule.tsx` | Calendar, complete session (images/weight), coach rating, joinable classes, **`REQUEST_JOIN_CLASS_MUTATION`**, **`RESPOND_CLASS_INVITE_MUTATION`**, **`LEAVE_CLASS_SESSION_MUTATION`**, **`GET_JOINABLE_GROUP_CLASSES_QUERY`**. |
| **Progress** | `progress.tsx` | Goals CRUD, weight history, progress ratings, coach ratings; may show ExerciseDB thumbnails when key exists. |
| **Session logs** | `session-logs.tsx` | Completed session history and ratings. |
| **Coaches** | `coaches.tsx` | Directory, request/cancel coach. |
| **Subscription** | `subscription.tsx` | Plans, membership requests, status. |
| **Profile** | `profile.tsx` | Profile edits, guardian/minor flows, ID upload via Cloudinary pipeline. |
| **Attendance** | `attendance.tsx` | Read-only facility attendance (membership-gated from menu/tabs). |
| **Equipment** | `equipment.tsx` | **`EquipmentBrowse`** catalog. |
| **Help** | `help.tsx` | Static help copy. |

## `TabHeader` / `ProfileDropdown` (member)

- **Notifications** open **`NotificationsDrawer`** (GraphQL + polling).
- **Profile menu:** Profile, Attendance, **Coaches row** (members → **`/(member)/coaches`**; coaches → **`/(coach)/clients`** — same menu label, different route), Subscription, Session logs (coaches → **`/(coach)/sessions`** hub), Equipment, Help, Logout. Members **without** membership hit **`openMembershipRequired`** for attendance, coaches, and session logs; subscription and equipment remain reachable per current implementation.

---

# Part 2 — Coach app

## Coach layout (`app/(coach)/_layout.tsx`)

- **`ProtectedRoute`** **`allowedRoles={['coach']}`**.
- **No** membership tab gate; all four primary tabs are always pressable.

## Coach routes (feature summary)

| Route | File | Features |
|-------|------|----------|
| **Dashboard** | `dashboard.tsx` | Aggregated session/client/request metrics. |
| **Progress** | `progress.tsx` | Client picker, goals, progress rating CRUD / review. |
| **Clients** | `clients.tsx` | Roster, detail modal, remove client. |
| **Schedule** | `schedule.tsx` | Session CRUD, templates, group classes, invites, **`COACH_RESPOND_JOIN_REQUEST_MUTATION`**, roster removal, ExerciseDB picker. |
| **Sessions** | `sessions.tsx` | Navigation hub to schedule + completed sessions. |
| **Completed sessions** | `completed-sessions.tsx` | Nested browsing of logs and images. |
| **Requests** | `requests.tsx` | Approve/deny member coach requests. |
| **Subscription** | `subscription.tsx` | Coach membership view. |
| **Profile** | `profile.tsx` | Coach profile + ratings UI. |
| **Attendance** | `attendance.tsx` | Read attendance; may refetch **`me`**. |
| **Equipment** | `equipment.tsx` | Same equipment catalog as member. |
| **Help** | `help.tsx` | Help content. |

---

## Notifications (`components/NotificationsDrawer.tsx`)

- **Members:** upcoming sessions, coach-request lifecycle, class join pending, coach removed, subscription-related items (wired to the app’s GraphQL queries and local “seen” state).
- **Coaches:** pending coach assignments / class join decisions.

**`TabHeader`** polls different queries for **badge counts** (e.g. **`GET_PENDING_COACH_REQUESTS_QUERY`**, **`GET_CLIENT_REQUESTS_QUERY`**, **`GET_COACH_SESSIONS_QUERY`**, member upcoming session query) depending on **`user.role`**.

---

## Local persistence keys (non-exhaustive)

| Key / pattern | Purpose |
|---------------|---------|
| **`auth_flow`** | `login` vs `signup` for post–Clerk routing when **`me`** is null (`utils/auth-flow.ts`). |
| **`onboarding_welcome`** | Which welcome modal variant to show once (`limited` / `counter` / `active`). |
| **`auth_token`** | Optional legacy/auxiliary token storage when completing registration. |
| **`facilityBiometricReminderAck:v1:<userId>`** | Dismissed biometric reminder (`MemberMeSyncAndWelcome`). |
| **Member seen notification ids** | `utils/memberSeenNotifications.ts` — reduces duplicate highlight in the drawer. |

Redux-persist stores the **`user`** slice (and other slices as configured in `store/`).

---

## Scripts and codegen

| Command | Purpose |
|---------|---------|
| **`npm run generate`** | GraphQL Code Generator → `graphql/generated/`. |
| **`npm run docs:flow-docx`** | Regenerate **`docs/MOBILE_APP_DEVELOPER_FLOW.docx`** from this Markdown. |

---

## Summary

- **Production:** **Clerk** + **GraphQL** + correct **`expo.extra.apiUrl`**.  
- **Optional:** **ExerciseDB** key, **Cloudinary** configuration on the API for uploads.  
- **Every cold open:** Persist → Clerk → Apollo token bridge → **`/`** → **`me`** → role + **`hasEnteredDetails`** → correct stack.  
- **Members** without gym membership still use **Workouts** and **Equipment** (and **Subscription** from menus) but are nudged away from **Dashboard** / **Schedule** / **Progress** tab destinations until they subscribe or use walk-in flows as implemented.

For **exact** resolver arguments, open the screen file and jump to **`graphql/mutations.ts`** / **`graphql/queries.ts`** or generated hooks in **`graphql/generated/types.ts`**.
