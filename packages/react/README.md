# Windows Phone React

An independent React component library inspired by Windows Phone: typography, tiles, and purposeful transitions. Local alpha; not published to npm. Requires React 19 and an ESM-capable application toolchain. No Next.js or Tailwind dependency.

## Try it

From this repository:

```sh
npm ci
npm run build:library
npm pack ./packages/react
```

In another React 19 project, install the resulting tarball. Import styles once and wrap your components in a theme:

```tsx
import { Theme, TileGrid, TileLink, Tile } from "@windows-phone/react";
import "@windows-phone/react/styles.css";

export function Start() {
  return (
    <Theme mode="dark" accent="blue">
      <TileGrid>
        <TileLink href="/inbox" label="mail" size="large">
          3 new messages
        </TileLink>
        <Tile label="weather">24°</Tile>
      </TileGrid>
    </Theme>
  );
}
```

The CSS is explicit and scoped to component classes. It does not reset your application. JavaScript imports preserve client directives for React Server Components. Plain server rendering is supported; a visible Transition renders readable content immediately. Interactive components require hydration.

## Components

| Component      | Purpose                                            | Main props                                                                                                       |
| -------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `Theme`        | Independent theme subtree                          | `mode: dark/light/system`, `accent: blue/violet/magenta/orange/green`, native div props                          |
| `Tile`         | Noninteractive content surface                     | `label`, `size`, `accent`, children, native div props                                                            |
| `TileLink`     | Real anchor with press feedback                    | Tile appearance plus native anchor props                                                                         |
| `RevealTile`   | Two presentational faces, one native toggle button | `front`, `back`, `label`, `revealed`, `defaultRevealed`, `onRevealedChange`, native button props                 |
| `LiveTile`     | Quietly cycling content with manual controls       | `items`, `accessibleLabel`, `label`, `intervalMs`, `paused`, `defaultPaused`, `onPausedChange`, native div props |
| `TileGrid`     | Responsive tile layout                             | Children, native div props; size declared on direct layout children                                              |
| `Pressable`    | Native button with press feedback                  | Native button props, default `type="button"`                                                                     |
| `AppBar`       | Composable action strip                            | Children, native div props                                                                                       |
| `AppBarAction` | Circular icon action with visible text             | `icon`, `label`, native button props                                                                             |
| `Transition`   | Interruptible presence animation                   | `show`, `preset`, `direction`, `duration`, `onEntered`, `onExited`, native div props                             |
| `Stagger`      | Cascading entrance of direct children              | `show`, `interval`, native div props                                                                             |

All components forward their native element ref. Appearance props are `size="small|wide|large|hero"` and `accent="accent|subtle|strong"`. Theme accents name colors; tile accents name semantic surface treatments.

## Motion

```tsx
<Transition
  show={open}
  preset="turnstile"
  direction="forward"
  duration={420}
  onExited={() => console.log("exit completed")}
>
  <article>Content that has somewhere to go.</article>
</Transition>
```

Presets: `turnstile` rotates around the leading edge; `slide` moves horizontally; `continuum` combines translation and scale; `fade` changes opacity. These are web interpretations, not claims of frame-exact historical reproduction. Continuum does not perform shared-element morphing.

- Initial `show={true}` is readable without an entrance or callback. Change `show` to animate.
- Exiting content remains painted but becomes inert and hidden from assistive technology immediately. Children unmount after exit; the wrapper remains with `data-state="exited"`.
- Reversing a transition starts from the displayed frame. Obsolete completion callbacks are ignored.
- Changing the OS reduced-motion preference cancels an active run and settles it. Zero duration or missing Web Animations support settles immediately too.
- Callbacks signal completion of a run, not initial mounting. They are the right place to coordinate the next surface. You own route changes and focus restoration.
- Use `data-state` (`entering`, `entered`, `exiting`, `exited`) for inspection. Do not use fixed timeouts to coordinate components.
- `Stagger` caps the cumulative entrance delay at 240ms. Hiding is immediate and keeps children mounted under a native hidden/inert wrapper. It is not an exit coordinator.

## Tile interaction and accessibility

Links retain browser destinations, modified clicks, context menus, and native keyboard interaction. Buttons retain native disabled behavior and form ownership. Pass `type="submit"` explicitly if a press should submit a form.

Reveal faces must be presentational content, never nested links/buttons. The caption names the control; the active face describes it. `aria-pressed` expresses the revealed state. Space and Enter toggle it. Controlled mode changes only through the owner updating `revealed`.

Live items are presentational visuals. `accessibleLabel` must summarize their meaningful information independently of the current frame. Automatic changes are silent. Autoplay pauses while hovered, focused, backgrounded, manually paused, or under reduced motion. The explicit Next action remains usable without autoplay. Fewer than two items produces no cycling controls. The minimum interval is one second; the default is five seconds. `paused` is the controlled manual pause preference; environmental pauses are independent.

Use descriptive labels. Avoid making important information available only through motion or color. Arbitrary custom colors/content still need contrast and accessibility review in the consuming application.

## Styling

Override CSS variables on a Theme or a custom class: `--wp-background`, `--wp-foreground`, `--wp-muted`, `--wp-surface`, `--wp-border`, `--wp-accent`, `--wp-accent-text`, `--wp-on-accent`, `--wp-font`.

Scoped light/dark/system modes can coexist. The default font stack uses installed fonts; no Microsoft font assets are bundled. Component class names are prefixed `wp-`; consumers can supply className and style. Square corners, clear typography, generous hit targets, and restrained easing are the defaults.

## Alpha boundaries

The public API can change before 1.0. This alpha does not include a router, shared-element navigation, dialogs, custom popup controls, or form controls beyond Pressable. The original portfolio still owns its Next-specific navigation. Package identity, license, and a wider browser/assistive-technology support matrix must be finalized before public release. Nothing in this repository claims affiliation with Microsoft.

## Pivot: related views

```tsx
import {
  Pivot,
  PivotList,
  PivotTrigger,
  PivotPanel,
} from "@windows-phone/react";

<Pivot defaultValue="recent">
  <PivotList aria-label="Messages">
    <PivotTrigger value="recent">recent</PivotTrigger>
    <PivotTrigger value="saved">saved</PivotTrigger>
  </PivotList>
  <PivotPanel value="recent">Recent messages</PivotPanel>
  <PivotPanel value="saved">Saved messages</PivotPanel>
</Pivot>;
```

Pivot accepts `value`, `defaultValue`, `onValueChange`, `activationMode="automatic|manual"`, `orientation="horizontal|vertical"`, `dir="ltr|rtl"`, and native div props/ref. Triggers use native button props plus `value`; panels use div props plus `value`. Values must be unique per instance. Supply a label on PivotList. Specify `defaultValue` explicitly when triggers are wrapped in custom components so the server can render the intended selection.

Arrow keys move through enabled triggers, with Home/End for the endpoints. Manual activation waits for Enter/Space. A controlled owner decides whether to accept a requested selection. Inactive panels remain mounted but hidden/inert, preserving local state. Nested instances use separate identities and focus scopes.

## Panorama: a wider canvas

```tsx
<Panorama
  aria-label="Your day"
  defaultValue="today"
  items={[
    { id: "today", label: "today", children: <Today /> },
    { id: "people", label: "people", children: <People /> },
    { id: "places", label: "places", children: <Places /> },
  ]}
/>
```

Each item has a stable unique `id`, a text `label`, and React `children`. Root props include `value`, `defaultValue`, `onValueChange`, `duration` (420ms default), `dir`, and native div props/ref. The first item is the default when no valid selection is supplied. Empty and single-item lists remain usable.

Panorama coordinates large tab headings and the content plane using one continuous position. Horizontal intent begins after 8px and must exceed vertical movement by 1.2×. A drag commits at 22% of the viewport width, or a recent fling of at least 24px and 0.45px/ms. Boundaries are finite. Touch capture begins after intent; native vertical scrolling and pinch zoom remain available.

Only the selected panel is interactive and exposed to assistive technology. Other panels remain mounted, and participate visually only while moving. Resizing, cancellation, reduced motion, or backgrounding settles the current selection. The root exposes `data-motion-state="idle|dragging|settling"`. Use `onValueChange` to connect an application router; the package does not write history. Controlled owners can reject a gesture without the visual surface remaining on an unaccepted item.

## TileSequence: coordinated tile journeys

```tsx
<TileSequence
  show={showTiles}
  selectedId={selectedId}
  duration={280}
  interval={40}
  onExited={openDetail}
  items={[
    {
      id: "inbox",
      size: "wide",
      content: (
        <TileLink href="/inbox" label="mail">
          3 messages
        </TileLink>
      ),
    },
    {
      id: "calendar",
      size: "wide",
      content: <Tile label="calendar">Tuesday</Tile>,
    },
  ]}
/>
```

Each item needs a unique `id`, React `content`, and optional tile `size`. Root props include `show`, `selectedId`, `duration`, `interval`, `direction`, `onEntered`, `onExited`, and native div props/ref. The sequence owns the layout wrappers and their transforms; an inner tile keeps its independent press behavior.

The default `mode="layered"` combines a subtle group turn with individual tile turns: tiles exit in reverse item order and return in item order. Group motion spans the full tile wave, and completion waits for both layers. `mode="group"` turns only the grid. Use `mode="individual"` for per-tile turns; only individual mode uses `selectedId`; both individual and layered modes use `interval`. On an individual exit the selected tile starts last. Spacing compresses when needed so the last delay stays within 240ms. An interrupted sequence resumes from the animated surface’s displayed frame without restarting its stagger. Initial visible content skips entrance/callbacks; exiting content becomes inert immediately; final callbacks observe committed terminal DOM. Reduced motion and missing animation support settle immediately. Items may change during a run without stranding completion.

The workshop demonstrates sequence → detail → sequence. The owner waits for exit completion, reveals the detail, then restores source focus on return. Use real destinations where navigation crosses routes; these components do not replace anchor semantics or infer browser history.

## Everyday commands

```tsx
<Button variant="accent" type="submit" loading={saving}>Save collection</Button>
<IconButton label="Add item" icon={<PlusIcon />} onClick={addItem} />
<AppBar>
  <AppBarAction label="save" icon={<SaveIcon />} onClick={save} />
  <AppBarLink label="help" icon={<HelpIcon />} href="/help" />
  <AppBarOverflow>
    <Button onClick={archive}>Archive</Button>
  </AppBarOverflow>
</AppBar>
```

`Button` supports `outlined` (default), `accent`, and `subtle` variants, native button props and refs. The default type is `button`; opt into form submission with `type="submit"`. `loading` blocks click activation and submission while retaining focus, the visible label and dimensions; it exposes `aria-busy` and `aria-disabled`. Native `disabled` removes keyboard activation and focus as usual. The owner manages async work and status announcements.

`IconButton` uses the same behavior and requires `label`; decorative icon content is hidden from accessibility APIs. The label also supplies a native title. `AppBarLink` requires `href` and keeps ordinary anchor behavior, including modifier clicks, targets and browser history.

`AppBarOverflow` is an inline command disclosure with ordinary Tab order. It supports `open`, `defaultOpen`, `onOpenChange`, `label` (default “More commands”), native div props and a root ref. Escape closes it unless a consumer prevents the key event. Closing restores trigger focus only when focus was inside the expanded content. It does not trap focus or close on outside clicks. Use controlled state to close after selecting a command; rejected controlled updates leave focus intact.

## Streaming progress dots

```tsx
<ProgressDots label="Loading your collection" />
```

`ProgressDots` is a named, indeterminate progress indicator: staggered dots arrive quickly, slow through the middle and accelerate away. It does not expose a fictional completion percentage or announce every animation loop. Reduced motion displays five static dots; RTL reverses the stream. Native span props/ref and `hidden` are supported.

Loading buttons use the same animation in decorative mode, retaining their own accessible name and busy state. For other already-labelled busy surfaces, `<ProgressDots decorative />` avoids a duplicate progress announcement. The owner controls visibility and completion.

## Fields and text inputs

```tsx
<Field label="Email address" description="We keep it private."
  error={errors.email} required controlId="email">
  <TextField type="email" name="email" autoComplete="email" />
</Field>
<Field label="About you" description="Up to 240 characters.">
  <TextArea name="bio" maxLength={240} />
</Field>
```

`Field` wraps **one** control. It renders its label, optional description and optional error, with stable SSR IDs. `controlId` sets the control ID; otherwise one is generated. Inside a Field, this ID takes precedence over a child's `id` so the label cannot become disconnected. Native `id` on Field itself identifies the wrapper. Caller `aria-describedby` IDs are merged and deduplicated with the field descriptions.

A nonempty `error` marks the control invalid and associates the error text; no automatic live region interrupts every keystroke. Validation and submission stay with the owner. Error feedback uses text, border treatment and a theme-specific error color. Announce a submission summary and focus the first invalid control after errors commit.

Field's explicit `required` value takes precedence over the control; Field's `disabled` state cannot be undone by a child. Inputs preserve native `name`, form ownership, controlled/uncontrolled value behavior, reset, readOnly, autocomplete, events and refs. TextField supports text, email, password, search, tel, url and number types. TextArea supports native props and vertical resizing.

For custom composition, use standalone `Label`, `FieldDescription`, `FieldError`, TextField and TextArea with explicit `htmlFor`, `id` and ARIA associations. Use Field's `description` and `error` props rather than inserting a second description/error component inside the automatic wrapper. The workshop demonstrates client-side validation without sending or storing entered data externally.

## Checkboxes, switches and radio groups

```tsx
<Checkbox label="Product updates" name="updates" defaultChecked />
<Switch label="Sync across devices" name="sync" defaultChecked />
<RadioGroup label="Delivery frequency" name="delivery" defaultValue="weekly"
  options={[{value:"daily",label:"Daily"}, {value:"weekly",label:"Weekly"}]} />
```

Checkbox and Switch wrap native checkbox inputs with their own labels. Pass `checked`/`onChange` for controlled state, or `defaultChecked` for native state and reset. Native name/value/form, required/disabled, refs and events are forwarded to the input. Switch exposes switch semantics and uses a rectangular moving thumb. Description and error props establish their own accessible associations; these controls do not need an additional Field wrapper.

RadioGroup renders a fieldset/legend and native radio inputs sharing the required `name`. Options require unique stable values and presentational labels, with optional descriptions and disabled state. Use `value`/`onValueChange` or `defaultValue`. Native arrows, disabled skipping and form reset apply. Controlled forms should reset their owned state in the form's reset handler. A consumer fieldset `onChange` can prevent the value callback. `form` is forwarded to each input for external form ownership.

The library has **no validation-library dependency**. It exposes native form behavior, accessible errors and ordinary React props. The workshop uses application-owned React validation plus native validity checks; consumers choose their form-state or schema-validation tools.

## Select and Slider

```tsx
<Field label="Appearance">
  <Select name="appearance" defaultValue="system">
    <option value="system">Follow the system</option>
    <option value="dark">Dark</option>
  </Select>
</Field>
<Field label="Brightness" description="0 to 100 percent">
  <Slider name="brightness" min={0} max={100} step={5} defaultValue={60} />
</Field>
```

Select forwards native select props and its HTMLSelectElement ref, including option groups, disabled options and multiple selection. Slider is a native range input with a rectangular thumb and a 44px interaction area. It forwards min/max/step, form props, events and its HTMLInputElement ref. Both inherit Field labels, descriptions, errors and disabled state. Standalone controls need an explicit accessible label.

Use value/onChange for controlled state or defaultValue for native state and form reset. Controlled owners must reset their state in the form reset handler. Slider keeps native arrow, Home/End and touch behavior; use aria-valuetext when a number needs units. The workshop pairs it with a visible percentage without announcing every update twice. No form-validation dependency is added.

## Progress and persistent messages

```tsx
<Progress label="Downloading photos" value={30} max={100} />
<ProgressRing label="Finding photos" size="large" />
<MessageBanner tone="success" heading="Saved" announcement="polite">
  Your collection is up to date.
</MessageBanner>
```

Progress and ProgressRing share the same value contract: omit `value` for unknown progress; finite values clamp to 0…max; nonfinite values are indeterminate; missing, nonpositive or nonfinite `max` falls back to 100. `value={0}` is determinate. Visual geometry and ARIA values use the same normalized state. Both require a label unless `decorative` is true; decorative mode is useful for a second representation of the same task. Native span attributes/ref are forwarded; `aria-valuetext` can describe units. Progress is a read-only indicator, not a live region or focus target. The owner provides completion feedback and controls any region's `aria-busy` state.

Unknown linear progress reuses ProgressDots. Unknown rings orbit five dots. Reduced motion stops the orbit/stream and removes value transitions; determinate progress remains readable. Ring sizes are small (32px), medium (48px, default), and large (72px).

MessageBanner is persistent feedback, with `info`, `success`, `warning`, or `error` tone, optional `heading`, and `actions`. Tone does not determine urgency. `announcement` defaults to `off`; `polite` provides a status region and `assertive` an alert. Keep an announcing banner mounted and update its content for reliable change announcements. Initial server-rendered content is readable but is not guaranteed to be announced. Actions and dismissal are outside the live region; prefer prose in heading/content and put interactive controls in `actions`.

To dismiss, supply both `onDismiss` and a descriptive `dismissLabel`. The callback requests dismissal: the owner removes the banner and restores focus to a sensible surviving control if the removed message contained focus. No auto-dismiss timers, network requests, or internal visibility state are added. An error remains available until the application changes it. See the workshop for retry and focus restoration.

## Dialog and AlertDialog

```tsx
const [open, setOpen] = useState(false);
const nameInput = useRef<HTMLInputElement>(null);

<Button onClick={() => setOpen(true)}>Edit collection</Button>
<Dialog open={open} onOpenChange={setOpen} title="edit collection"
  description="Give these moments a name." initialFocusRef={nameInput}>
  <Field label="Name"><TextField ref={nameInput} /></Field>
  <Button onClick={() => setOpen(false)}>Cancel</Button>
</Dialog>
```

Both are controlled native modal dialogs. `open` is application state; `onOpenChange(false, reason)` requests dismissal for `escape`, `backdrop`, or `native` closure. Application buttons close by setting state. A title is required; AlertDialog also requires a concise description. Stable heading/description IDs provide accessible associations. Always include a visible close/cancel control. AlertDialog blocks backdrop dismissal; ordinary Dialog allows it unless `dismissOnBackdrop={false}`. Escape is enabled by default, configurable with `dismissOnEscape`; consumer `onCancel` may prevent the request. Backdrop dismissal requires a pointer gesture that both starts and finishes outside the dialog.

Native `showModal()` owns top-layer placement and background inertness. The dialog stays in its theme subtree, so nested theme variables inherit normally without a portal. Native props/events and the HTMLDialogElement ref are forwarded, except the managed role/name/open attributes. Do not drive the DOM `open` attribute directly or style an open dialog as hidden. Native close methods and `method="dialog"` request a state update; for animated exits, set controlled state instead.

`initialFocusRef` chooses the first focused element; otherwise native focus behavior and the first tabbable control apply. For destructive actions, focus the least destructive choice, as the workshop does. Tab boundaries wrap inside the modal. The current boundary helper supports ordinary light-DOM controls, disabled/hidden elements and radio groups; custom shadow-root controls require a future focus adapter and are not yet part of the supported contract.

Continuum entrance/exit reuses Transition's cancellation and reduced-motion handling. The modal and document scroll lock remain until exit completes. Reopening interrupts exit without closing the native modal and renews initial focus. `duration` defaults to 220ms; zero removes motion. Closed server markup stays non-modal until hydration. Native dialog support is required; no legacy polyfill is bundled.

Closing restores the opener; `finalFocusRef` supplies an explicit surviving destination when the opener will disappear. Restoration also applies to native closure and unmount, without moving focus away from another active control/modal. Keep the component mounted while changing `open` to animate exit; conditional unmount closes immediately. Document scroll ownership is reference-counted across instances and restores the previous inline overflow value after the last modal closes. Long content scrolls inside the panel.

## Menu and Popover

```tsx
<Menu label="Collection actions" items={[
  { id: "rename", label: "Rename", onSelect: () => setEditing(true) },
  { id: "archive", label: "Archive", disabled: true, onSelect: archive },
]} />
<Popover label="Filter collection" title="your view">
  {({ close }) => <><Field label="Sort"><Select defaultValue="newest">
    <option value="newest">Newest first</option>
  </Select></Field><Button onClick={close}>Done</Button></>}
</Popover>
```

Both support uncontrolled `defaultOpen` or controlled `open` with required `onOpenChange`. The forwarded ref points to their native Button trigger. Use `triggerProps` for disabled/loading state, styling, HTML attributes and events. Consumer trigger handlers run before internal interaction handlers; `preventDefault()` cancels the matching interaction. Disabled/loading triggers block opening interactions. `placement` accepts Floating UI placements and defaults to `bottom-start`; start/end follow RTL layout.

Menu items require unique stable IDs, plain-text labels and `onSelect`; disabled and destructive styles are available. Arrow keys, Home/End, typeahead and roving focus belong to the menu. Native button activation invokes `onSelect`, then closes unless the event was prevented. Item removal and disabled-state changes reconcile navigation. Use Dialog or AlertDialog for actions needing input or confirmation. Submenus, selectable menu items and custom item renderers are not included in this slice.

Popover is a non-modal named dialog for regular controls, not an ARIA menu. It focuses its first control, permits ordinary Tab traversal, and closes when focus leaves. The render function's `close()` supports Apply/Cancel actions. Escape returns focus to the trigger; clicking an outside control preserves that control's focus. Application state owns draft/apply behavior. Menu selection can hand focus to a new modal without returning it prematurely; pass the menu trigger ref as that modal's `finalFocusRef` when appropriate.

The shared foundation uses **@floating-ui/react** for positioning, dismissal, focus and list interactions. Auto-update tracks scrolling, resize and layout shifts; flip/shift/size middleware keeps panels within the viewport and makes long content scrollable. Native **Popover API** support (`showPopover`) is required: manual popovers occupy the browser top layer, escaping ancestor clipping/transforms while retaining theme inheritance in their original DOM position. No body portal or copied theme tokens are used. Only Chromium desktop/mobile emulation is currently verified; do not infer a broader support matrix.

Panels have a brief 140ms entrance, disabled under reduced motion, and immediate dismissal so focus and availability change together. Conditional rendering cleans up positioning observers and top-layer elements. Closed SSR renders just the trigger; even default-open panels are not promoted to the top layer until hydration. Nested floating menus/popovers and legacy-browser fallbacks remain future work. Package size reports count this package's emitted files, not the full transitive dependency bundle.

## Lists, headings and empty states

```tsx
<SectionHeader level={3} id="recent" meta="2 collections">recently added</SectionHeader>
<List aria-labelledby="recent" animate>
  <ListItem title="A quieter coast" description="24 photos"
    leading={<img src="/coast.jpg" alt="" />}
    action={{ type: "link", href: "/collections/coast" }}
    actions={<Button aria-label="Actions for A quieter coast">Actions</Button>} />
</List>
<EmptyState title="No collections match" description="Try another name."
  actions={<Button onClick={clearSearch}>Clear search</Button>} />
```

List renders a native `ul`, with an explicit list role to preserve semantics when bullets are removed. Place ListItem directly inside it; SectionHeader belongs outside the list, associated through `aria-labelledby` if needed. ListItem always renders a native `li`. Its primary region is static by default; `action={{type:'link',href,props}}` creates a native anchor, while `action={{type:'button',props}}` creates a native button (default type button). Link navigation, modified clicks, native disabled behavior and supplied events remain browser-owned. Ref/ordinary attributes target the ul/li; action props target the primary link/button.

Title, description, meta and leading slots compose row content. Keep these slots noninteractive when the primary region is a link/button; put menus and other controls in `actions`, which renders as a separate sibling region. This avoids nested buttons and accidental row activation. Thumbnail images should have empty alt text when decorative/redundant or meaningful alt text if they convey additional information. Supply a concise action aria-label through action props when the entire row's text would be too verbose. Leading slots default to 64px, reducing to 48px on narrow screens; text wraps rather than truncating.

`animate` is opt-in and reuses the shared stagger keyframes on direct list items, with 30ms spacing capped at 240ms. It runs when rows mount, not on every data update; stable React keys preserve identity. Reduced motion removes the animation. No virtualization, selection model, sorting, filtering or live announcement policy is built into these structural components.

SectionHeader supports heading levels 2–4 and optional metadata. EmptyState is a named section with a required title, optional description, decorative icon and recovery actions. It has no automatic live-region behavior; the application should announce meaningful results appropriately. Its heading level defaults to 3 and can be 2–4. Distinguish a first-use empty library from a filter with no matches, as the workshop demonstrates. When mutations remove a focused row, choose a surviving focus destination such as the search input.
