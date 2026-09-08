# Portfolio content approval checklist

Complete these checks before replacing the clearly marked draft examples or publishing professional-work details.

- [ ] VP Engineering disclosure approval
- [ ] Final current-role and employment chronology
- [ ] Approved project names and screenshots
- [ ] Verified project metrics and dates
- [ ] Final résumé file or content
- [ ] Preferred public email address
- [ ] Final photography selection and alt text
- [ ] Final case-study copy
- [ ] Final blog editorial pass
- [ ] Social-link verification

## Added by the Phase 2 tile system

Phase 2 gave tile copy explicit length budgets and gave photographs a typed
shape. Both are enforced at import, so replacement copy that misses them fails
the build rather than overflowing a tile in production.

- [ ] Tile copy fits its size's character budget. Every caption, headline,
      supporting claim, and numeral is measured against
      `lib/content/tileBudget.ts` by the validators in `lib/content/projects.ts`
      and `lib/content/photography.ts`. A longer approved sentence needs either
      a shorter edit or a larger tile size, decided together.
- [ ] Each approved photograph carries the fields `PhotoItem` requires: a rooted
      `src`, alt text, and the source's real pixel width and height (the last
      two are what stop the layout shifting while the image loads). A frame with
      no approved selection stays `kind: "pending"` and says so on its face.
- [ ] Draft markers agree. A draft case study is marked in both its title
      (`Draft example —`) and its tile caption (`· draft`); the validator
      rejects one without the other. Removing draft status means removing both.
