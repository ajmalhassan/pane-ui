# Lumia-Inspired Developer Portfolio Design

**Date:** 2026-08-31  
**Status:** Approved direction; awaiting written-spec review

## 1. Purpose

Rebuild Ajmal Hassan's portfolio as a memorable, evidence-led presentation of a hands-on technical leader working at the intersection of AI products, full-stack systems, frontend craft, and team enablement.

The site must primarily persuade hiring managers, followed by startup founders, freelance clients, and other developers. It should position Ajmal for technical-leadership roles rather than primarily people-management roles.

The experience will give the interaction spirit of Windows Phone 8 and the Lumia 520 Cyan a second life on the modern web. This is a personal design anchor, a demonstration of frontend ability, and the seed of a future open-source interaction system.

## 2. Positioning

### Primary position

Ajmal is an AI-native product engineering leader who remains close to implementation. His differentiators are:

- deep frontend experience with expanding full-stack ownership;
- direct leadership of a five-person frontend team;
- engineering ownership within five multidisciplinary learning squads without implying that every squad member directly reports to him;
- experience building applied-AI products and learning from their limits;
- platform thinking that joins product, learning, assessment, and business concerns;
- measurable commercial delivery, including a lead platform associated with more than ₹1 crore in revenue;
- deliberate use of agent workflows, repository standards, hooks, and skills to improve engineering throughput.

### Initial homepage language

The first active pivot is **Me**. Its opening language should establish the position without reading like a list of titles:

> technical leader / builder / systems thinker
>
> I build AI-native product systems that connect learning, assessment, and business outcomes—and help teams ship with clarity.

This copy is provisional editorial content and may be refined without changing the design.

### Claims discipline

Professional work will be described through approved facts, safe abstractions, and firsthand lessons. Company names, screenshots, architecture details, learner information, internal metrics, and product data remain excluded until Ajmal receives permission to disclose them. The site must distinguish direct management from cross-squad technical ownership.

## 3. Audience Priorities

1. **Hiring managers** should understand Ajmal's role, judgment, scope, and outcomes in under two minutes.
2. **Startup founders** should see end-to-end ownership, product sense, speed, and commercial awareness.
3. **Freelance clients** should see credible delivery and a clear path to contact Ajmal.
4. **Developers** should find useful technical writing, interaction craft, and eventually an open-source design system.

## 4. Experience Structure

### Primary pivots

The homepage behaves as one spatial panorama with these ordered pivots:

1. **Me** — active on first load;
2. **Projects**;
3. **Blog**;
4. **Photography**.

**Résumé** and **Contact** are persistent actions in the contextual app bar rather than content pivots.

Each pivot has a shareable query state: `/?view=me`, `/?view=projects`, `/?view=blog`, or `/?view=photography`. The bare `/` route and invalid values render Me. A valid query renders its selected pivot on the server, so shared links do not wait for a client-side correction. Switching pivots updates this query state and uses a horizontal spatial transition, but the browser must not trap native scrolling or require horizontal wheel gestures.

### Me

The Me pivot contains:

- a concise positioning statement;
- a short bio and current focus;
- direct and cross-functional leadership scope;
- a practical engineering philosophy;
- the type of technical-leadership work Ajmal wants next;
- a small personal layer referencing travel, photography, and the Lumia 520 Cyan.

The section should feel personal but not begin as a chronological résumé.

### Projects

The initial implementation uses typed dummy entries while layout and interaction are validated. It includes one authentic public-facing concept: the Lumia-inspired web interaction system being developed through this portfolio.

Future project entries may include:

- organization-level capability graph;
- real-time assessment using Gemini Live;
- lead collection, URL-shortening, and CRM integration platform;
- agent-ready engineering harness and repository practices;
- selected personal or open-source experiments.

Project cards do not separate “featured systems” from “evidence.” Evidence belongs inside each project story.

Every full case study follows the same narrative contract:

1. problem and users;
2. Ajmal's role and team context;
3. constraints and risks;
4. system or product approach;
5. important decisions and trade-offs;
6. outcome and evidence;
7. what failed or changed;
8. lessons and next questions.

### Blog

The navigation label is **Blog** because it is universally understood. The content may range from short field notes to longer essays.

The blog earns its place by publishing experience that generic AI-generated tutorials cannot replace. Suitable initial topics include:

- why AI assessment needs a narrower, evidence-grounded role;
- how capability graphs become organizational infrastructure;
- designing repositories for agent-assisted contributors;
- lessons from engineering ownership across multidisciplinary squads;
- frontend and product decisions tied to commercial or learner outcomes.

Posts are stored locally and rendered at build time. DEV may receive syndicated copies later, but the portfolio must never depend on the DEV API to render.

### Photography

Photography is a quiet personal counterpoint rather than a second portfolio. It may use a small curated set of optimized images with brief captions. The section should reuse the panorama and tile language without competing with engineering work.

## 5. Visual and Interaction Direction

### Chosen direction: Lumia Panorama

The approved direction is the most nostalgic of the explored concepts. It uses:

- ink-black primary surfaces;
- Lumia cyan as the signature active color;
- oversized, lightly weighted, deliberately cropped typography;
- pivot headers and adjacent off-canvas glimpses;
- square and rectangular live tiles;
- sparse, circular app-bar actions;
- sharp internal UI geometry;
- phone-scale compositions that recall the Lumia 520 without wrapping the entire website in a novelty phone shell.

Physical-device framing is appropriate in documentation, responsive comparisons, and selected easter eggs. The production portfolio itself remains a web experience.

### Typography

The type stack prefers `Segoe UI Variable` and `Segoe UI` when available, followed by an open web-safe sans such as Inter and then `system-ui`. The project will not redistribute proprietary Microsoft fonts.

Large panorama headings use light or regular weights, tight tracking, and cropped continuations. Supporting text stays comfortably readable and avoids applying Metro-era thin weights at small sizes.

### Color

Initial tokens:

- `--metro-cyan: #00a4ef`;
- `--metro-ink: #07090a`;
- `--metro-surface: #111416`;
- `--metro-text: #f2f4f5`;
- `--metro-muted: #91989e`;
- `--metro-line: #2a2e31`.

Additional accent themes are deferred to the open-source phase. The portfolio launches with cyan as its unmistakable identity.

## 6. Interaction Ethos

The component system must recreate a feeling, not merely a silhouette.

1. **Content is the interface.** Typography, imagery, and information provide structure; chrome is minimal.
2. **One continuous place.** Panoramas and pivots make destinations feel spatially related.
3. **Alive, not busy.** Tiles change only to reveal useful state, evidence, progress, or context.
4. **Motion explains causality.** Transitions show where content came from and where it went.
5. **Immediate tactility.** Press, pointer, touch, and focus states respond confidently.
6. **Boldly digital.** The interface avoids skeuomorphic materials and unnecessary glass effects.
7. **Delight with discipline.** Accessibility, performance, and user control are part of the aesthetic.

The guiding statement for the future public system is:

> Give the spirit of Windows Phone a second life on the modern web—not as a replica, but as a living interaction language.

## 7. Motion Language

Motion is a first-class system with shared tokens, not one-off component animation.

### Core behaviors

- **Panorama shift:** pivot changes translate the shared content plane horizontally while the oversized heading moves at a smaller rate.
- **Staggered entrance:** meaningful lists and tile groups enter in reading order over a short interval.
- **Press and tilt:** pointer-capable devices receive restrained perspective feedback; touch receives immediate scale or compression feedback.
- **Live-tile reveal:** tiles rotate or translate to a second useful state after deliberate interaction or a meaningful application event.
- **App-bar expansion:** labels and secondary context reveal from a stable bottom action area.
- **Case-study continuity:** a selected tile expands or hands off spatially into the project detail view where technically practical.

### Constraints

- No continuous decorative tile rotation.
- No looping hero animation.
- No transition may delay access to content.
- Transform and opacity are the preferred animated properties.
- Reduced-motion mode removes parallax, perspective, large translations, and stagger delays while preserving state clarity.
- Keyboard and programmatic activation produce the same state changes as pointer and touch input.

## 8. Repo-Local Design System

Phase 1 builds the interaction primitives inside this portfolio. Suggested boundaries:

```text
components/
  metro/
    AppBar/
    LiveTile/
    Panorama/
    PivotList/
    Pressable/
    StatusBar/
    TileGrid/
  portfolio/
    BioPanel/
    ProjectCard/
    ProjectCaseStudy/
    BlogIndex/
    PhotoGrid/
```

The `metro` layer contains reusable interaction behavior and styling contracts. It must not import portfolio content. The `portfolio` layer composes those primitives around Ajmal's content.

### Initial primitive contracts

- **Panorama:** owns the content plane, active pivot, spatial offset, and reduced-motion behavior.
- **PivotList:** exposes semantic tabs, keyboard navigation, selection state, and off-canvas continuation.
- **TileGrid:** supplies responsive Metro-like tile geometry without assuming project-specific content.
- **LiveTile:** supports a stable default face and an explicitly triggered secondary face.
- **Pressable:** centralizes pointer tilt, touch compression, focus-visible treatment, and input capability detection.
- **AppBar:** supplies persistent primary actions and an expandable labeled state.
- **StatusBar:** provides optional Lumia atmosphere but never contains essential browser or system information.

Core visual values are CSS custom properties. Interaction logic uses focused React hooks and native browser APIs. A general animation dependency is added only if native CSS and the Web Animations API cannot provide clear, testable choreography.

## 9. Phase 2: Open-Source System

The public design system is a separate subproject and release phase. Phase 1 proves the APIs in a real portfolio before extraction.

Phase 2 will focus on:

- richer, composable motion choreography;
- reactive live-tile data adapters;
- panorama, pivot, page-stack, and app-bar patterns;
- gesture and input-capability handling;
- theme creation without diluting the core Lumia character;
- accessibility contracts and reduced-motion equivalents;
- interactive documentation and examples;
- a framework-facing API shaped by the proven portfolio implementation.

Package naming, repository location, licensing, supported frameworks, and release automation will be decided when Phase 2 begins. Phase 1 must avoid choices that unnecessarily prevent extraction, but it will not build speculative framework abstractions.

## 10. Application Architecture

The existing Next.js App Router and TypeScript foundation remains. The redesign does not require a new backend.

### Routes

- `/` — panoramic portfolio with Me active initially;
- `/projects/[slug]` — full project case study;
- `/blog` — blog index with a canonical shareable URL;
- `/blog/[slug]` — local article;
- `/resume` or a static resume asset — recruiter-friendly résumé access.

The Blog pivot on `/` may preview recent posts and link to `/blog`. Projects behave similarly. This keeps the homepage spatial and concise while allowing long content to use conventional reading pages.

### Content model

Projects use typed local data during the dummy-content stage. Blog posts use local Markdown with frontmatter. Both are validated during the build for required fields such as title, slug, summary, date, status, and accessibility text.

The main content flow is:

```text
local project data / local Markdown
                 ↓
       build-time validation
                 ↓
       server-rendered indexes
                 ↓
  interactive Metro presentation layer
                 ↓
 shareable project and article routes
```

No external request is required to render the homepage. Optional syndication or external-profile links fail independently of the portfolio.

### Client state

Only interaction state—active pivot, live-tile face, app-bar expansion, and input feedback—belongs on the client. Content remains server-rendered. The `view` query parameter is the canonical active-pivot state; pivot changes create navigable history entries so back and forward restore prior selections.

## 11. Responsive Behavior

The design has two deliberate compositions rather than a desktop layout squeezed onto mobile.

### Mobile

- one- and two-column tiles;
- visible horizontal continuation in pivot labels and panorama headings;
- a bottom app bar sized for touch;
- no hover-only content;
- short spatial transitions;
- native vertical page scrolling.

### Wide screens

- a denser tile field with stronger asymmetric rhythm;
- more panoramic off-canvas context;
- restrained pointer tilt;
- persistent positioning and action context without fixed elements obscuring content.

Breakpoints respond to content fit rather than emulating a specific phone resolution. The Lumia 520 frame remains a design-review reference, not the only mobile target.

## 12. Accessibility

- Pivots use tab semantics with arrow-key support, visible focus, and correct selected state.
- Live tiles are operable buttons or links with stable accessible names; changing visual faces must not create confusing announcements.
- The app bar exposes labels accessibly even while visual labels are collapsed.
- Every essential action is available without hover, tilt, drag, or swipe.
- Touch targets are at least 44 by 44 CSS pixels.
- Text and focus indicators meet WCAG AA contrast.
- `prefers-reduced-motion` receives a purpose-built low-motion experience.
- Semantic headings and landmarks preserve a sensible document outline independently of the panorama layout.
- Photography and diagrams receive useful alternative text; decorative Lumia chrome is hidden from assistive technology.

## 13. Failure Handling

- Missing or malformed local content fails the build with a clear content-path error.
- Missing optional project imagery falls back to a typographic tile rather than a broken image.
- External social, résumé, or syndication links are never required for initial render.
- If client JavaScript fails, the Me content remains readable and conventional links expose Projects, Blog, Résumé, and Contact.
- Unsupported pointer capabilities simply omit perspective tilt.
- Motion errors cannot hide content; final states exist in normal document layout.

## 14. Performance

- The initial page must remain useful before hydration.
- No video background, canvas effect, or large animation library is part of the initial release.
- Interaction motion primarily uses compositor-friendly transforms and opacity.
- Photography and case-study media use responsive optimized images and lazy loading below the fold.
- Font loading must not block the first meaningful content; system Segoe is preferred where installed and an optimized fallback is used elsewhere.
- Target Lighthouse scores on representative mobile hardware: at least 95 for accessibility and best practices, and at least 90 for performance.
- The portfolio should avoid layout shift in tiles, headings, and the app bar.

## 15. Verification Strategy

### Component tests

- pivot selection and arrow-key behavior;
- URL synchronization;
- live-tile state changes;
- app-bar expansion and labels;
- reduced-motion state;
- Pressable behavior across pointer-capability states.

### Integration tests

- first load renders Me as the active pivot;
- direct links restore the intended pivot;
- back and forward navigation restore state;
- Projects and Blog lead to conventional detail routes;
- the no-JavaScript path retains core information and navigation.

### Visual and interaction checks

- phone, tablet, laptop, and wide-desktop screenshots;
- Lumia 520-sized reference frame;
- long project titles and summaries;
- keyboard-only journey;
- touch journey without hover assumptions;
- reduced-motion visual comparison;
- dark-surface contrast and focus visibility.

### Build gates

- type checking;
- linting;
- production build;
- automated accessibility scan on core routes;
- performance check against the defined budgets.

## 16. Initial Scope

### Included

- new panoramic homepage shell;
- Me, Projects, Blog, and Photography pivots;
- persistent Résumé and Contact app-bar actions;
- repo-local Metro primitives required by the portfolio;
- typed dummy project content;
- local blog rendering with sample content;
- responsive mobile and wide-screen compositions;
- accessibility, reduced motion, and core verification;
- one authentic design-system project entry.

### Excluded from Phase 1

- publishing the standalone open-source package;
- framework-independent adapters;
- a public theme builder;
- CMS or database-backed content;
- authentication, comments, newsletter infrastructure, or analytics dashboards;
- an AI portfolio chatbot;
- automatic runtime aggregation from DEV or other social platforms;
- disclosure-dependent professional screenshots or internal data.

## 17. Success Criteria

The redesign succeeds when:

- a hiring manager can identify Ajmal's intended role, leadership scope, and strongest proof quickly;
- the site feels unmistakably inspired by Lumia and Windows Phone 8 without becoming a replica or usability exercise;
- interaction delight remains purposeful, accessible, and performant;
- Me appears first, while Projects and Blog remain prominent and independently shareable;
- dummy content can be replaced by approved case studies without structural redesign;
- the Metro primitives are isolated enough to inform a future OSS extraction;
- the site itself demonstrates the frontend judgment and engineering quality it claims.
