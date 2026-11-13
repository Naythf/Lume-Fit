# Lume Fit Studio · app only

Issue #72. The published site assets and server schema are unchanged. The app remains packaged offline, with the same origin and private document format.

## Composition

Home greets the person by their saved profile name and presents one workout decision, followed by the week, three inline metrics, a separated food journal row and two recent records. The header groups connection status, local weekday/date and morning/afternoon/night in a bordered surface. There is no duplicated planning shortcut or total-volume tile. History and full information remain in their existing destinations. The header preserves the original Lume mark and name; Manrope provides a consistent readable type scale.

The bottom navigation retains four destinations. The Lume Hub sheet has four quiet rows: Frequency, Friends, Knowledge and Settings. Dark translucent surfaces use blur, soft borders and visible focus. Checkboxes, radio buttons, selects and date/time controls follow this surface language. The custom date/time overlay preserves the original form value and callbacks, blocks background interaction and restores focus. Escape and Tab stay within the active surface. Month navigation retains focus.

Scroll reveals observe offscreen sections; content remains visible when JavaScript or IntersectionObserver is unavailable. LumeMotionPreference is the single motion policy; reduced motion shows content immediately. Controls and ordinary text do not animate repeatedly.

## Exercise artwork and licensing

Exercise data by [RepDB (repdb.co)](https://repdb.co). Official free-tier source: https://github.com/RepDB/exercise-dataset. Only the curated flat exercise illustrations needed inside this application are included. The exact terms and attribution are in assets/exercise-art/LICENSE-DATA.md and ATTRIBUTION.md. This is an application, not a standalone dataset/API. No paid previews or animations are included.

The user expressly authorized deterministic pixel background removal on 12 November 2026. prepare-exercise-art.mjs flood-fills the border-connected background, preserves enclosed artwork and ground shadows, and letterboxes to 384 × 384. No generative model processes these images. Incorrect generic body poses were replaced by explicit catalog/name mappings and optional manual movement selection. Unknown variations use a neutral equipment symbol. Start/end positions are still illustrations, not a claim of video or verified execution.

Custom exercise uploads preserve aspect ratio with padding in a transparent 128 px canvas. Contain fitting applies throughout the app; photos and original private records are not automatically rewritten. The supplied anatomical reference was not bundled because redistribution rights were not established.

Quaternius body meshes are CC0. The model is a schematic surface map: primary regions red, secondary pale red, both front/back. It does not measure activation or identify individual anatomical tissue. Three.js uses MIT; Manrope uses SIL OFL. Their license texts remain inside the offline package. Equipment framing fits width and height.

## Skills consulted

Workspace-local references in ../design-skills: Fitness and Gym (clawic/skills), Impeccable (pbakaus/impeccable), and the previously available frontend, visual design, motion and asset-rights guides. Fitness guides inform movement/equipment classification, not automatic changes to workouts or medical advice. Impeccable context loader was unavailable; its local craft/new-work references were read. No Figma or paid service is used.

## Validation

Automated coverage includes exact movement/equipment matching, unknown variants, local asset presence and credit, anterior/posterior muscle regions, bundled scripts, offline presentation, document preservation and existing workout behavior. Browser QA uses connect-src none, local-only test records and mobile/desktop widths. Physical Android installation, camera/gallery and airplane-mode behavior require device testing of the delivered APK.

## Header and photograph refinements · Issue #74

The avatar is a fixed 48 px frame with a centered 24 px SVG, or a full-frame photo, removing the prior padding/minimum-size mismatch. The routine return action uses a consistent chevron and label. Supporting type has a modest increase across home, forms, weekly notes and records.

The highlight uses the original weight photo and two real Pexels equipment photos, prepackaged locally. Only the decorative photo layer changes; workout text and controls stay still. Dots, previous/next, pause/resume, keyboard focus and touch swipes are available. Automatic rotation pauses when the hero is offscreen, inactive, hidden, hovered or focused. Explicit resume restarts rotation. Reduced motion disables automatic rotation and transitions while preserving manual controls. No remote photo request is made at runtime. Source/license records are in assets/hero/LICENSE.md.

RepDB attribution remains clearly visible in Settings → About and credits, as permitted by its free-tier license. The footer no longer repeats it.

The QA server accepts LUME_QA_PORT. A clean preview on port 8085 isolates its local storage from older test records on 8084 without deleting or rewriting those records. No record-name filtering, replacement or test data is included in the application.
