# Start: Lumia-era details research

Research/proposal only · 19 September 2026 · No application code changed.

## Recommendation

Add three details: a Cinemagraph-inspired moment in Photos, the People Hub's alphabet jump inside People, and an optional reverse view of the cyan Lumia shell. Retain Lenka as the existing musical anchor, with a discreet, accurate Windows 8 campaign attribution. This gives the page a photograph that comes alive, a familiar touch interaction, a personal object, and a song people recognize. It does not need more Start tiles or another navigation bar.

The first two are **core app refinements**, not hidden Easter eggs. The reverse shell and campaign provenance are **optional discoveries**. Sounds and other campaign references belong in reserve, not in an immediate collection of references.

Rankings below express editorial fit, not a claim that historical popularity has been measured. Historical confidence and implementation caveats are separate.

## Existing surface

Reviewed `components/start/StartDesktop.tsx`, `components/start/StartAppViews.tsx`, and `components/phone/PhoneDemo.tsx`. Start already has the nine-face People mosaic, Kerala coast Photos, Lenka's black-and-white video artwork, and a cyan Lumia 520. The interiors leave room for purposeful interaction: People repeats the mosaic alongside implementation prose; Photos is a static image and a documentation link; Music has the official song-video link; the phone view already contains an interactive demo with theme controls. GitHub and Install are already in the header.

Keep technical documentation links secondary to the app experience. Preserve the user's personal origin story and cyan preference. Let the image, movement, and interaction carry recognition; avoid the rejected word in product copy. None of the proposals requires imported contacts, real messages, microphone access, or audio on page load.

## Ranked candidates

### 1. A still photo with one living detail

**Type:** Core Photos refinement. **Recognition cue:** A largely frozen scene with a tiny region moving—the particular magic of Nokia Cinemagraph.

**Historical grounding:** Nokia explicitly listed Cinemagraph among the Lumia 520's camera lenses at launch. Its imaging lead described subtle movement in only part of an image. [520 launch, 25 February 2013](https://blogs.windows.com/devices/2013/02/25/have-more-fun-with-the-nokia-lumia-520/); [Nokia imaging interview, 9 January 2013](https://blogs.windows.com/devices/2013/01/09/pureview-theres-more-still-to-come/).

**Exact fit:** The large coast image in the existing Photos app. Use matching coastal footage with only the water moving while the shore stays still. A small `animate` / `still` button gives the visitor control; keep the Start tile's existing behavior initially.

**Confidence/caveat:** High, including direct 520 support. This is an adaptation of the visual result, not an exact reconstruction of the original editing app. It needs suitable footage or an authored motion asset: translating or zooming the whole JPEG would miss the reference. Reduced-motion users get a still image and an explicit opt-in.

### 2. Tap the letter, jump to a person

**Type:** Core People refinement. **Recognition cue:** The accent-colored letter square opening a grid of the alphabet, then dropping into the selected contact section.

**Historical grounding:** Nokia's June 2013 Windows Phone 8 tips explicitly describe tapping a People section letter, opening the alphabet overlay, and jumping to that section. [Eight useful Windows Phone 8 features](https://blogs.windows.com/devices/2013/06/11/8-useful-nokia-lumia-windows-phone-8-features-you-might-not-know-about/).

**Exact fit:** Replace the implementation paragraph in People with a compact, alphabetized list corresponding to the existing portraits. Activating a letter opens the alphabet; selecting an available letter moves focus to its section. Selecting a person can show a modest demo contact card. Preserve the mosaic as the Start-facing identity. No extra global tabs are necessary.

**Confidence/caveat:** High. Use a small plausible demo roster, not a sprawling synthetic address book. The operation should work with keyboard and touch. Groups are another grounded option—Microsoft described pinned personal Groups in March 2013—but pinning additional Start tiles would undermine the current composition. [People Hub tour](https://blogs.windows.com/windowsexperience/2013/03/18/rediscovering-the-people-hub/).

### 3. The cyan shell, seen from the other side

**Type:** Optional discovery. **Recognition cue:** That unmistakable colored back, small camera, and Nokia wordmark, rather than another rectangular screen.

**Historical grounding:** The 520 launched in cyan, yellow, red, white, and black with exchangeable shells. [Official launch](https://blogs.windows.com/devices/2013/02/25/have-more-fun-with-the-nokia-lumia-520/).

**Exact fit:** A quiet `turn it over` control beside the caption in `my first phone` reveals a back illustration, then `back to the screen` returns to the current demo. Cyan remains the only default; a color picker is unnecessary because this is the user's particular phone. Keep the Start tile unchanged.

**Confidence/caveat:** High on shell history; the interaction is an editorial invention. Verify camera, speaker, wordmark, and button geometry against official 520 photos before drawing the back. Do not borrow a 920/1020 camera module or add a decorative flash. An immediate front/back change is a valid reduced-motion equivalent.

### 4. Keep “Everything at Once,” identify the actual campaign

**Type:** Existing anchor with optional provenance. **Recognition cue:** Lenka's black-and-white patterned video against the colored tiles.

**Historical grounding:** Microsoft's October 2012 Windows 8 campaign announcement names Lenka. Contemporary reporting identifies “Everything at Once” and the black-and-white music-video footage in the Windows 8 commercial. [Microsoft campaign announcement](https://blogs.windows.com/windowsexperience/2012/10/23/windows-8-advertising-campaign-goes-global/); [contemporary song/ad identification](https://diffuser.fm/windows-8-u-k-2012-commercial-whats-the-song/).

**Exact fit:** Retain the current artwork and official YouTube song link in Music. A restrained `2012 / Windows 8` caption, or an optional `where you heard it` disclosure linking the campaign source, adds context without another player.

**Confidence/caveat:** High that this is a Windows 8 campaign association. It is adjacent to Windows Phone, not evidence of a Lumia 520 advertisement. Do not describe it as “the Lumia song.” The primary campaign article names the artist; the exact song/video identification is corroborated by contemporary secondary reporting. No lyrics, autoplay, or unrelated retro playlist needed.

### 5. A small map that still works without a signal

**Type:** Optional Photos extension, later. **Recognition cue:** A saved place, a simple route, and the reassurance of offline maps.

**Historical grounding:** HERE Maps, Drive, and Transit were part of the 520 launch offering. Microsoft's February 2013 overview confirms offline mapping and offline voice guidance. [520 launch](https://blogs.windows.com/devices/2013/02/25/have-more-fun-with-the-nokia-lumia-520/); [HERE overview](https://blogs.windows.com/windowsexperience/2013/02/25/nokias-free-map-and-navigation-apps-now-available-for-more-windows-phones/).

**Exact fit:** `see the way home` beneath the Photos caption could reveal a small, bundled illustrated coastal route inside that view. A demo airplane-mode toggle can leave this particular map intact. Use a fictional/local sample route unless the user supplies an actual place.

**Confidence/caveat:** High historical fit; medium product fit because it competes with Cinemagraph. A locally bundled map proves only that sample works offline, not that the whole site does. Do not imply HERE service integration. Crucially, **HERE LiveSight did not work on the 520**, so avoid a camera-overlay/AR version. [Nokia's explicit exclusion](https://blogs.windows.com/devices/2013/05/24/our-5-favourite-new-windows-phone-apps-of-the-week-3/).

### 6. Nokia Music / MixRadio's effortless mix

**Type:** Optional Music extension, later. **Recognition cue:** A mix chosen from a few artists, or the simple `Play Me` idea and like/dislike controls.

**Historical grounding:** The 520 launched with Nokia Music, curated streaming, and offline playlists. Nokia MixRadio's revamped `Play Me` arrived on **21 November 2013**, including India. [520 launch](https://blogs.windows.com/devices/2013/02/25/have-more-fun-with-the-nokia-lumia-520/); [MixRadio launch](https://blogs.windows.com/devices/2013/11/21/nokia-mixradio/).

**Exact fit:** Only if Music later expands: a small `make a mix` interaction can reveal a curated selection of real official listening links while leaving Lenka prominent. It should produce an actual useful selection, not nonfunctional playback controls.

**Confidence/caveat:** High era grounding, medium fit. `Play Me` is a late-2013 memory, not the phone's February launch branding. Do not pretend the historical service is operating or that personalization exists if it does not. Additional songs need a personal or campaign connection; random period hits weaken the idea.

### 7. One ringtone preview, deliberately requested

**Type:** Optional audio discovery. **Recognition cue:** Nokia Tune, or a specifically remembered orchestral Lumia tone.

**Historical grounding:** Nokia's head of sound design describes the Lumia 920-era evolution of Nokia Tune and its continuation across devices. Separately, Nokia documented 25 orchestral ringtone miniatures recorded by the Bratislava Symphony Orchestra, initially including the 920 and 820. [Nokia Tune history](https://blogs.windows.com/devices/2014/04/25/nokia-tune-just-ringtone/); [orchestral tones, November 2012](https://blogs.windows.com/devices/2012/11/09/new-string-tones-for-the-new-lumia/).

**Exact fit:** A small `hear the ringtone` action in the phone view, or a preview beside the existing sound controls. It must have a visible stop state and respect quiet settings. The conservative first version can link to the original sound-design article instead of shipping audio.

**Confidence/caveat:** High for Nokia/Lumia association; insufficient evidence here for which orchestral track shipped on the user's 520. Do not substitute the 1990s buzzer and call it the exact Lumia ringtone. Confirm the specific recording and reuse permission before bundling it. Page navigation, hover, unmuting, and moving a volume slider must not unexpectedly start playback.

### 8. “This is Lumia”: the deadmau5 street show

**Type:** Optional cultural discovery. **Recognition cue:** A London street turning into light and music, tied to a documented launch moment.

**Historical grounding:** Nokia's event report dates the show to **28 November 2012**, celebrating the Lumia **920 and 820**. It explicitly distinguishes it from the previous year's Millbank Tower projection. [Official event report](https://blogs.windows.com/devices/2012/11/30/this-is-lumia-london-secret-deadmau5-gig-video/).

**Exact fit:** If one additional Music discovery is wanted later, an understated `London / 28.11.2012` link after the main song can reveal the event's archival context and a user-initiated watch link. No concert lighting over the Start grid.

**Confidence/caveat:** High event specificity. This is not a 520 launch, and not the 2011 show. The report credits some photography to Getty for Nokia; verify asset permissions instead of treating the article as an image pack. Keep it lower priority than the personal Lenka cue.

### 9. The wedding commercial

**Type:** Optional cultural discovery. **Recognition cue:** The wedding guests' smartphone rivalry in Microsoft's 2013 spot.

**Historical grounding:** Microsoft published its “Three smartphones and a wedding” announcement on **29 April 2013** and associated the campaign with Windows Phone 8 and Lumia 920. [Official announcement](https://blogs.windows.com/windowsexperience/2013/04/29/three-smartphones-and-a-wedding/).

**Exact fit:** A single optional `a very familiar wedding` archive link could live in a later Photos collection. Opening it gives the campaign context and an external watch/source link. It should not displace the Kerala coast or become a fake personal wedding photo.

**Confidence/caveat:** High provenance, modest current fit. The existing app contains no wedding album, so adding an album solely to accommodate this reference would be unnecessary scope. The original embedded video may not remain playable; validate a working official destination before implementation. Do not turn old competitor jokes into current product claims.

### 10. “Smoked by Windows Phone” after a real quick task

**Type:** Optional campaign Easter egg, lowest priority. **Recognition cue:** Ben Rudolph's everyday-task challenges.

**Historical grounding:** Microsoft's 2012 campaign articles describe challenges such as sharing photos, finding places, and connecting with people. [March campaign announcement](https://blogs.windows.com/windowsexperience/2012/03/21/new-smoked-by-windows-phone-ads-on-the-way/); [June street challenges](https://blogs.windows.com/windowsexperience/2012/06/26/new-smoked-by-windows-phone-ads-start-today/).

**Exact fit:** Only after an actual lightweight People task exists, an optional success-detail link could disclose the original campaign. The ordinary success message should remain useful. Avoid a persistent slogan, timer, fake score, or claim that Pane UI beat another library.

**Confidence/caveat:** High campaign grounding, low fit today. It predates the Lumia 520. A citation to a remembered challenge is reasonable; inheriting its performance assertions is not. The joke should be omitted unless the real interaction earns it.

## Accuracy boundaries for implementation

- **No Glance on the 520.** Nokia explicitly excluded it in Amber and Black documentation. A black clock screen presented as Glance would be wrong for this device. [Amber rollout](https://blogs.windows.com/devices/2013/08/15/green-light-for-lumia-amber/); [Black FAQ](https://blogs.windows.com/devices/2014/01/29/nokia-black-update-questions-answered/).
- **Avoid silently mixing release generations.** Cortana, transparent Start backgrounds, and separate media/ringer volume controls were Windows Phone 8.1 additions announced in April 2014. They may belong to an updated 520 experience, but not its 2013 launch state. [Microsoft's 8.1 announcement](https://blogs.windows.com/windowsexperience/2014/04/02/cortana-yes-and-many-many-other-great-features-coming-in-windows-phone-8-1/).
- **Camera lenses were real 520 features; flagship camera claims are different.** Cinemagraph and Smart Shoot are directly verified on the 520. Do not label its camera PureView or borrow 1020 visual hardware. A Smart Shoot face-selection demo is possible later but needs matching image frames and is less economical than the coast Cinemagraph.
- **Do not create fictional user memories.** Kerala, the cyan 520, and Lenka are supplied context. A new route, contact roster, or wedding should be clearly a demo or confirmed by the user before being described as personal history.
- **Keep recognition accessible.** Optional discoveries should have real focusable controls and small visible cues; no hover-only, secret long-press-only, or audio-only information. Keep the current Back journey and keyboard focus behavior.

## Concrete first scope

1. **Photos:** One suitable coast motion asset, one localized moving region, one explicit play/still control. Preserve the existing documentation link.
2. **People:** One small contact list with an alphabet jump overlay; preserve the nine-face Start tile and use consistent portraits.
3. **My first phone:** One accurately illustrated cyan back and a reversible front/back action. Preserve the working phone demo.
4. **Retain Music:** Existing Lenka image and official listening link; at most a quiet Windows 8 campaign provenance detail.

Do not implement all ten candidates. The remaining references are a researched reserve, not a request for another menu, gallery, reference cabinet, or set of Start tiles.
