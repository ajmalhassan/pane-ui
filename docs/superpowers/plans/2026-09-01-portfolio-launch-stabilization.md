# Portfolio Launch Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the production-blocking runtime risk and repair URL/state behavior before the Phase 2 visual system is accepted for launch.

**Architecture:** Upgrade the existing App Router application to patched Next.js 15.5 and React 19, migrate request props to the asynchronous Next 15 contract, pin the tested Node runtime, and make the Contact fragment the canonical source of overlay state. Keep the upgrade isolated from visual redesign work.

**Tech Stack:** Next.js 15.5.24, React 19, TypeScript, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-09-01-lumia-ui-polish-design.md`

## Global Constraints

- Use Next.js `15.5.24`, the patched Maintenance LTS release identified in the August 2026 security release.
- Use the React and React DOM versions required by Next.js 15.5.24; align `@types/react`, `@types/react-dom`, and `eslint-config-next` to their compatible major versions.
- Pin Node `22.22.2` in both `package.json#engines` and `.nvmrc`; this satisfies the repository's current jsdom and Lighthouse floors.
- Preserve App Router, static project/blog routes, query-backed pivots, no-JavaScript links, modified clicks, and all approved content.
- Do not mix Phase 2 visual changes into this plan.

---

### Task 1: Upgrade the supported runtime

**Files:**
- Create: `.nvmrc`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `app/page.tsx`
- Modify: `app/projects/[slug]/page.tsx`
- Modify: `app/blog/[slug]/page.tsx`
- Modify only compatibility configuration identified by the upgrade gates

**Interfaces:**
- Consumes: Next.js 15 asynchronous `params` and `searchParams` page contracts.
- Produces: a buildable supported runtime under Node `22.22.2` with no synchronous request-prop warnings.

- [ ] **Step 1: Record the pre-upgrade compatibility baseline**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: all existing gates pass on the pre-upgrade commit. Save the command output in the task report so later failures can be attributed to the dependency change.

- [ ] **Step 2: Upgrade dependencies and pin Node**

Run:

```bash
npm install next@15.5.24 react@19 react-dom@19 eslint-config-next@15.5.24 @types/react@19 @types/react-dom@19
```

Add to `package.json`:

```json
"engines": {
  "node": ">=22.22.2 <23"
}
```

Create `.nvmrc` containing exactly:

```text
22.22.2
```

- [ ] **Step 3: Migrate asynchronous page props**

Use these contracts:

```tsx
type HomeProps = {
  searchParams: Promise<{ view?: string | string[] }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { view } = await searchParams;
  // existing render
}
```

```tsx
type SlugProps = {
  params: Promise<{ slug: string }>;
};
```

Make `generateMetadata` and each dynamic page async, await `params` once, and pass the resolved slug into the existing content functions. Do not change route output or content semantics.

- [ ] **Step 4: Repair only upgrade-caused lint/configuration failures**

Run `npm run lint`. If Next 15.5 still supports the existing `next lint` script, keep it. If the installed release rejects it, replace the script with the documented ESLint CLI command and a flat configuration that preserves `next/core-web-vitals` and Prettier compatibility. Do not relax rules to make failures disappear.

- [ ] **Step 5: Verify the full runtime upgrade**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
npm run test:a11y
```

Expected: all gates pass; the build produces no synchronous `params`/`searchParams` compatibility warnings.

- [ ] **Step 6: Commit**

```bash
git add .nvmrc package.json package-lock.json app
git commit -m "chore: upgrade portfolio runtime"
```

---

### Task 2: Make Contact history canonical

**Files:**
- Modify: `components/portfolio/PortfolioPanorama.tsx`
- Modify: `tests/unit/PortfolioPanorama.test.tsx`
- Modify: `tests/e2e/portfolio.spec.ts`

**Interfaces:**
- Produces: `contactOpen` synchronized with `location.hash === "#contact"`.
- Preserves: real `href="#contact"` fallback, ordinary-click enhancement, modified-click behavior, and focus restoration.

- [ ] **Step 1: Write failing real-browser history tests**

Add to `tests/e2e/portfolio.spec.ts`:

```ts
test("contact follows fragment history and close clears it", async ({ page }) => {
  await page.goto("/?view=me");
  await page.getByRole("link", { name: "Contact" }).click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.getByRole("button", { name: "Close contact" })).toBeVisible();

  await page.goBack();
  await expect(page).not.toHaveURL(/#contact$/);
  await expect(page.getByRole("button", { name: "Close contact" })).toBeHidden();

  await page.getByRole("link", { name: "Contact" }).click();
  await page.getByRole("button", { name: "Close contact" }).click();
  await expect(page).not.toHaveURL(/#contact$/);
  await expect(page.getByRole("link", { name: "Contact" })).toBeFocused();
});
```

- [ ] **Step 2: Run the focused test and verify the current failure**

Run:

```bash
npx playwright test tests/e2e/portfolio.spec.ts --grep "contact follows fragment history"
```

Expected: FAIL because Back removes the fragment while the overlay remains open.

- [ ] **Step 3: Implement fragment-owned state**

Use a single synchronizer:

```tsx
function contactIsOpen() {
  return window.location.hash === "#contact";
}
```

On mount, `hashchange`, and `popstate`, set state from `contactIsOpen()`. For an ordinary Contact click, prevent the anchor's default navigation, push `#contact` with a marker such as `{ portfolioContact: true }`, and synchronize state; modified clicks still retain browser ownership. On Close, call `history.back()` when the current entry carries that marker. For a direct load at `/#contact` without the marker, use `history.replaceState` to remove only the fragment, synchronize state, and restore focus. The real `href="#contact"` remains the no-JavaScript fallback.

- [ ] **Step 4: Run focused unit and E2E tests**

Run:

```bash
npm test -- tests/unit/PortfolioPanorama.test.tsx
npx playwright test tests/e2e/portfolio.spec.ts --grep "contact"
```

Expected: PASS.

- [ ] **Step 5: Run regression gates and commit**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Then:

```bash
git add components/portfolio/PortfolioPanorama.tsx tests/unit/PortfolioPanorama.test.tsx tests/e2e/portfolio.spec.ts
git commit -m "fix: synchronize contact with browser history"
```

---

### Task 3: Verify stabilization as a prerequisite

**Files:**
- Modify only files required by a failing verification audit

**Interfaces:**
- Produces: a clean base commit for the Phase 2 UI plan.

- [ ] **Step 1: Run the complete gate under the pinned Node version**

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
npm run test:a11y
git diff --check
git status --short
```

Expected: every command exits zero and the tracked worktree is clean.

- [ ] **Step 2: Record exact versions and results**

Run:

```bash
node --version
npm ls next react react-dom eslint-config-next
```

Expected: Node satisfies `22.22.2`, Next is `15.5.24`, and dependency resolution contains no invalid peer tree.

- [ ] **Step 3: Commit verification-only repairs if any**

If no repair was required, do not create an empty commit. If a gate exposed an upgrade regression, commit only its focused correction with a message naming that behavior.
