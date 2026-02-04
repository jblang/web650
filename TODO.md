# TODO

## E2E Follow-ups

- Replace forced/programmatic button clicks in `e2e/front-panel.spec.ts` with user-realistic interactions where possible, and resolve underlying actionability/layout issues in the front panel.
- Add a dedicated test for yield-step persistence semantics (not just control usability), and confirm expected behavior across route navigation and reload.
- Add Playwright failure artifacts to CI (trace/screenshot/video) for easier triage when E2E failures occur.
- Review front-panel control selectors and add stable test hooks where interaction currently depends on fragile text/DOM patterns.
- Evaluate splitting long stateful E2E flows into smaller tests with shared setup fixtures to improve failure localization and maintainability.
