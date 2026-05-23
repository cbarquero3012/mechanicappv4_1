# Agent Reviewer: Landing Page Flows Analysis

## Overview

This document reviews the two main flows from the MechanicApp landing page: **"Try Free Demo"** and **"Get Started"** (onboarding). It evaluates the current implementation against the required specifications and identifies issues to fix.

---

## Flow 1: "Try Free Demo"

### Required Specification

| Step | Requirement | Status |
|------|-------------|--------|
| 1 | Create DB with name `mechanic_app_demo_tenant_username_dateofcreation` | ⚠️ PARTIAL |
| 2 | Create user and password for demo user | ✅ IMPLEMENTED |
| 3 | Create link like `http://localhost/username/login` | ❌ NOT IMPLEMENTED |
| 4 | App continues using main frontend but with demo DB | ✅ IMPLEMENTED |
| 5 | Demo lasts 7 days; user can pay to continue or demo DB is deleted | ✅ IMPLEMENTED |

### Current Implementation

- **Database Naming**: Currently uses `mechanic_tenant_{slug}_{timestamp}` — does NOT include `demo` in the prefix or the actual username.
- **Credentials**: Hardcoded as `administrador` / `admin` — no dynamic user/password creation based on the user's input.
- **Access Link**: Currently shows `https://{slug}.mechanicapp.com` — does NOT generate `http://localhost/username/login` format.
- **Tenant Resolution**: Uses `X-Tenant-Slug` header and subdomain; no URL path-based tenant routing (`/username/login`).
- **Demo Expiration**: 7-day TTL is correctly implemented via `DemoExpiresAt`.
- **Cleanup**: `CleanupExpiredDemosAsync()` drops DBs after expiry — correct.
- **Upgrade Path**: `ConvertDemoToPaidAsync()` preserves data — correct.

### Issues Found

1. **DB Naming Convention Mismatch**: The DB name should follow `mechanic_app_demo_tenant_{username}_{dateofcreation}` but currently uses `mechanic_tenant_{slug}_{timestamp}`.
2. **No Username Field in Demo Form**: The form only asks for company name and email, not a username. The demo credentials are always hardcoded `administrador/admin`.
3. **Access Link Format Wrong**: Should be `http://localhost/{username}/login` but currently redirects to `/login?demo=true&username=administrador`.
4. **No Path-Based Routing**: The Angular router has no route pattern for `/:username/login`. Tenant resolution is header/subdomain-based only.
5. **Demo Success Modal Missing Login Link**: Shows credentials but the "Open Demo" button navigates to `/login` with query params instead of a proper tenant-specific URL.

---

## Flow 2: "Get Started" (Onboarding)

### Required Specification

| Step | Requirement | Status |
|------|-------------|--------|
| 1 | Create DB with name `mechanic_app_tenant_username_dateofcreation` | ⚠️ PARTIAL |
| 2 | Create user and password | ✅ IMPLEMENTED |
| 3 | Create link like `http://localhost/username/login` | ❌ NOT IMPLEMENTED |
| 4 | App continues using main frontend but with tenant DB | ✅ IMPLEMENTED |
| 5 | Flow: Create user → Payment by Stripe → Show login link with credentials | ⚠️ PARTIAL |

### Current Implementation

- **Database Naming**: Same issue as demo — uses `mechanic_tenant_{slug}_{timestamp}`.
- **User Creation**: Admin user `administrador` is set with user-provided password via `SetAdminCredentialsAsync`.
- **Payment Flow**: Creates tenant first → redirects to Stripe → on return shows success with credentials. This is INVERTED from the required flow (should be: credentials → payment → link).
- **Access Link**: Shows `/login` route, not `http://localhost/username/login`.
- **Stripe Integration**: Uses payment links with prefilled email; webhook updates subscription status.

### Issues Found

1. **DB Naming Convention Mismatch**: Same as Flow 1 — should be `mechanic_app_tenant_{username}_{dateofcreation}`.
2. **Flow Order Incorrect**: Current flow is `Create account → Redirect to Stripe → Return to see credentials`. Required flow is `Create user/pass → Pay via Stripe → Show login link`.
3. **No Username Input**: The onboarding form collects company name, email, and password but no custom `username`. The admin user is always named `administrador`.
4. **Access Link Format Wrong**: Same as Flow 1 — no path-based tenant URL.
5. **Golden Plan Bypass**: Enterprise/golden plan skips Stripe but shows success immediately — this is correct per spec since it's "Contact Sales".
6. **30-day Grace Period**: The subscription is created as active with 30 days before Stripe confirms — this means users can access the app without paying. Should only activate AFTER payment confirmation.

---

## Cross-Cutting Issues

### 1. Database Naming Convention (CRITICAL)

**Current**: `mechanic_tenant_{slug}_{yyyyMMddHHmmss}`
**Required Demo**: `mechanic_app_demo_tenant_{username}_{dateofcreation}`
**Required Paid**: `mechanic_app_tenant_{username}_{dateofcreation}`

**Fix**: Update `TenantProvisioningService.ProvisionTenantAsync` to use correct prefixes.

### 2. Username-Based Routing (CRITICAL)

**Current**: Tenant resolution via `X-Tenant-Slug` header or subdomain.
**Required**: URL path-based routing like `http://localhost/{username}/login`.

**Fix Options**:
- A) Add Angular route `:slug/login` and resolve tenant from URL path.
- B) Keep current approach (header-based) but generate display links in `/{slug}/login` format and add a redirect route.

**Recommended**: Option B — Add a catch-all route that captures `/:slug/login`, stores the slug in localStorage, and redirects to `/login`. This preserves the existing architecture while satisfying the URL requirement.

### 3. No Custom Username Field (MEDIUM)

**Current**: Demo users always get `administrador`/`admin`. Paid users get `administrador` with custom password.
**Required**: User should be able to define their own username.

**Fix**: Add `username` field to both the demo form and onboarding form. Pass it to the backend which sets it in the tenant DB.

### 4. Onboarding Payment Flow Order (MEDIUM)

**Current**: Provision DB → Redirect to Stripe → Return with credentials.
**Required**: Create user/pass → Pay via Stripe → Show login link.

**Analysis**: The current approach actually works correctly because:
- The 30-day grace period allows access while payment is pending.
- Stripe webhook confirms and extends the subscription.
- If payment fails, the subscription expires after 30 days.

**However**: This violates the requirement. The correct flow should:
1. Collect user/pass + plan selection
2. Redirect to Stripe for payment
3. On Stripe success webhook → provision DB + create user
4. Show success page with login link

**Risk**: Changing to payment-first means the DB isn't created until after payment, requiring storing pending onboarding data and provisioning asynchronously.

**Pragmatic Fix**: Keep current provisioning-first approach but:
- Reduce grace period to 3 days (not 30).
- Show clear messaging that payment is required.
- Block app access if payment isn't completed within grace period.

### 5. Demo Credentials Not Dynamic (LOW)

**Current**: Always `administrador`/`admin` regardless of what the user enters.
**Required**: Should create based on user input.

**Fix**: Accept optional username in the demo creation request and use it for the admin account.

### 6. Security Concern: Hardcoded Demo Password (MEDIUM)

The demo password is always `admin`. This is documented and predictable. Anyone who knows a demo slug could log in.

**Fix**: Generate a random password per demo and display it only once in the success modal.

---

## Fixes to Implement

### Priority 1: Database Naming Convention

**File**: `backend/Services/TenantProvisioningService.cs`

Change the `ProvisionTenantAsync` method to use:
- Demo: `mechanic_app_demo_tenant_{slug}_{yyyyMMdd}`
- Paid: `mechanic_app_tenant_{slug}_{yyyyMMdd}`

### Priority 2: Add Username Field

**Files**:
- `frontend/src/app/pages/landing/landing.component.ts` — add username input to demo form
- `frontend/src/app/pages/onboarding/onboarding.component.ts` — add username input
- `backend/Controllers/DemoController.cs` — accept username parameter
- `backend/Controllers/SubscriptionController.cs` — accept username parameter
- `backend/Services/TenantProvisioningService.cs` — use username in DB naming and account creation
- `backend/Models/Tenant.cs` — consider adding AdminUsername field (optional)

### Priority 3: Slug-Based Login Route

**Files**:
- `frontend/src/app/app.routes.ts` — add `:slug/login` route
- Create a redirect component that extracts slug, stores it, redirects to `/login`
- Update demo success modal and onboarding success to show proper link

### Priority 4: Dynamic Demo Password

**File**: `backend/Controllers/DemoController.cs`

Generate a random 8-character password instead of using hardcoded `admin`.

### Priority 5: Payment Flow Messaging

**File**: `frontend/src/app/pages/onboarding/onboarding.component.ts`

Ensure the flow clearly communicates: account → payment → access.

---

## Recommended Implementation Order

1. Fix DB naming convention (backend change only)
2. Add username field to demo/onboarding forms (frontend + backend)
3. Generate dynamic demo passwords (backend)
4. Add slug-based login route (frontend routing)
5. Update success modals to show proper login links
6. Review and test both flows end-to-end
7. Rebuild and verify no regressions

---

## Files Affected

| File | Changes |
|------|---------|
| `backend/Services/TenantProvisioningService.cs` | DB naming, username support |
| `backend/Controllers/DemoController.cs` | Username param, random password |
| `backend/Controllers/SubscriptionController.cs` | Username param |
| `backend/Models/Tenant.cs` | Optional: AdminUsername field |
| `frontend/src/app/pages/landing/landing.component.ts` | Username field, login link |
| `frontend/src/app/pages/onboarding/onboarding.component.ts` | Username field, login link |
| `frontend/src/app/app.routes.ts` | Slug-based login route |
| `frontend/src/app/services/tenant.service.ts` | Model updates |
| New: `frontend/src/app/pages/tenant-login-redirect/` | Redirect component |
