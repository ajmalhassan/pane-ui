# Release hardening implementation plan

Objective: establish a repeatable alpha quality gate, using mature libraries' accessibility, interaction, SSR and internationalization contracts as benchmarks. Do not claim full parity or publish during this pass.

1. Preserve the component-library checkpoint in Git (496ff69).
2. Add opt-in Firefox/WebKit projects to Playwright. Run the complete workshop suite on production output; classify platform limitations, brittle assumptions and actual defects separately. Fix supported-browser defects and retain regression checks.
3. Add automated large-text/reflow, keyboard and high-contrast evidence where automation can establish behavior. Record VoiceOver/NVDA and physical-device checks as manual requirements, never inferred passes.
4. Independently audit public API/ref/event contracts. Fix demonstrated defects without speculative public API redesign.
5. Measure actual bundled consumer imports, including transitive dependencies with React externalized; establish reproducible budgets. Keep emitted-file measurements distinct.
6. Update CI to exercise production builds and browser projects, and document support, installation, API conventions, quality evidence and release blockers.
7. Run relevant full verification, review the changes, and commit the hardening results separately. Keep the preview running; do not push or publish.

Files: playwright.config.ts; tests/e2e/library*.spec.ts; package.json; .github/workflows/library.yml; scripts/measure-library.mjs; docs/library-support.md; docs/library-verification.md; packages/react/README.md; CONTRIBUTING.md. Source fixes are evidence-driven and will be recorded in the verification log.

Outcome: implemented and locally verified. 508 unit tests; 177 browser checks passed with 3 documented tooling skips; production build, TypeScript, library lint, packed consumer SSR/types and bundle budgets passed. See `docs/library-verification.md` and `docs/library-support.md`. Manual assistive-technology/device gates and remote CI execution remain pending.
