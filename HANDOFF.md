# Kate's Portfolio — Handoff Brief

Concise context so a fresh chat can continue. Read this first, then `app/page.tsx` and `lib/`.

## What it is
Personal portfolio for **Kate Kazachkova, Product Designer** at **uxuikazachkova.xyz**.
Concept: "designer as a collectible product" — a **vintage red suitcase** (open wardrobe) is the hero on Home; inside a lit arched niche stands/sits a **BJD doll of Kate** that changes by **time of day**. Whole-site ambient background also shifts with time. Tone: self-ironic, editorial, documentation/archive aesthetic. **Content = British English** (CV not Resume, colour, organise).

## Stack & infra
- Next.js + TypeScript + Tailwind v4. Repo: `github.com/KateKazachkova/portfolio`.
- Hosting **Vercel**, auto-deploy on push. Domain via gen.xyz.
- **Prod** `uxuikazachkova.xyz` = branch `main`. **Staging** `staging.uxuikazachkova.xyz` = branch **`staging`** (Vercel Preview).
- **Workflow: always work on `staging`.** Before every push: `npm run build` (must compile), then commit + `git push origin staging`. Kate reviews on the staging URL (local dev server can't run in this env — EPERM).
- CMS: **Notion** (integration `portfolio-site`), client **v2**. Env vars in `.env.local` AND Vercel: `NOTION_TOKEN`, `NOTION_PROJECTS_DB`, `NOTION_CERTIFICATES_DB`, `NOTION_AWARDS_DB`, plus `STRAVA_*` (client id/secret/refresh/athlete) and `MAPBOX_TOKEN` (not set yet).

## Information architecture
Nav: **Work · About · Recognition · Contact** + separate **Download CV** button (links to Kate's Google-Doc PDF export) + theme toggle (26px).
- `/` Home — suitcase hero + analog 12h clock (drag hand / presets Morning·Day·Street·Evening·Night · Now) driving doll + ambient.
- `/work` (+ `/work/[slug]`) — case studies (Notion). `/about` (+ `/about/map`) — bio, experience, teaching, education, skills, Strava cycling (stats + top-3 longest ride route maps), Travels preview, and a Reference Library (Series = disc rack, Films = VHS stack, Books = shelf — all read from `content/about/films-and-series/*.md`).
- `/recognition` — "QUALITY CHECK" inspection-report page (data in `lib/awards.ts`). `/contact`.
- Global `components/Nav.tsx`, `components/Footer.tsx` (packaging small-print), `components/TimeProvider.tsx` (sets `data-daytime` on <html>).

## Design tokens (globals.css)
Warm-paper palette via CSS vars: `--bg --fg --panel --inner --border --hairline --muted --accent (#f2df3f) --accent-red (#d8352a) --accent-blue --accent-green`. Paper-grain overlay + time-of-day ambient wash. Dark theme via `[data-theme="dark"]`. Mono = Geist Mono for metadata/labels.

## The doll system (Home) — animated niche videos
5 editions in `lib/time.ts` (keys: `morning` 7–9, `office`/Day 9–17, `street` 17–19, `evening` 19–23, `night` 23–7). Clock presets Morning·Day·Street·Evening·Night drive `data-daytime` + the niche.
- **Suitcase base = `public/suitcase/open2.png`** (the decorated box: drawer stickers, "I WANT TO BELIEVE" poster, baked-in wardrobe clothes + blanket). Same niche geometry as the old `open.png`. z-index: suitcase img = 1; items + niche = 2/3.
- **Central niche = a doll VIDEO per edition**, rendered by `components/NicheDoll.tsx` (edition-parameterised). ALL 5 editions done (2026-07-31): each plays a seamless `loop` + an `accent` every ~2 min; evening also has a one-off sit-down `intro`. Editions not in `NicheDoll`'s `CLIPS` map fall back to the static cutout (`page.tsx` guards with `hasNicheClip`).
  - Vibes: morning = drowsy doze + coffee sip; office = laptop work + tired stretch; street = flashlight look-around + cold shiver; evening = sit→read + tea sip; night = sleeping + yawn.
  - Clips live in `public/dolls/video/<edition>_loop.mp4`, `_accent.mp4` (+ `evening_intro.mp4`) and `<edition>_poster.jpg`. All are **opaque 648×1664**, dropped onto the niche 1:1 (no masking).
  - **Overlay rect (fixed): `left 40.62% · top 11.43% · width 18.16%`, `max-width:none`.** How the clips are made + all doll-outfit canon: see memory `project-portfolio-niche-pipeline.md` (READ IT before touching niche work).
- Static cutouts still in `public/dolls/cut/{morning,office,street,evening,night}.png` — these are the **doll canon references** (correct per-edition outfit + BJD proportions). Used as the character ref when generating niche frames.
- Trophy on left cubby shelf: `left 28% · top 13.6% · width 10%`. Shelf items (DVDs `tv2.png`, cassettes `tv show.png`, right-door books `books_.png`) + two brass gallery rails (`top boarder.png`) — positions dialled in `app/page.tsx`.

## Higgsfield (AI gen) — how we make assets
Connected via MCP (user-scope). **Credit spend is PRE-APPROVED by Kate** — don't ask per generation, just keep a running tally; flag only if unexpectedly expensive. Balance ~2640 (ultra plan) as of 2026-07-31. Image (nano_banana_pro) ≈4 cr/2, video (kling3_0 pro) ≈10 cr. Failed jobs auto-refunded. Upload path: `media_upload` (files[]) → curl PUT to the presigned url → `media_confirm`.
- **Niche pipeline (the important one):** memory `project-portfolio-niche-pipeline.md`. Reusable IDs: padded-niche canvas media `0ca9d6e1-842f-4430-9021-6d6d4e2e058a`; per-edition frames were made from the `/dolls/cut/*` cutouts as the doll ref. Key: nano_banana_pro forces 3:4, so we generate on a padded 3:4 canvas and crop the central niche column back (`x 0.2388→0.7593`). kling3_0 `mode:pro`, `start=end` frame for seamless loops, `declined_preset_id:"24bae836-2c4a-48e0-89b6-49fcc0b21612"`. Always demand "keep EXACT ball-jointed-doll proportions, NOT a realistic girl" or it drifts chunky.
- **Animation prompts:** feet planted, NEVER twisting legs; locked-off tripod (no zoom/pan); background perfectly static; props in place in the start frame. Accents with a gesture (sip/yawn) → duration 8 so Kling performs it.
- **Kate cuts final dolls herself** (manual, clean); the `/dolls/cut/*` files are canon. Don't auto-remove backgrounds for final assets.

## WHERE WE LEFT OFF (open items)
DONE (2026-07-31): new box `open2`; **all 5 niche editions animated** (loop + accent) via `NicheDoll.tsx`; suitcase items + rails placed; header/footer flat `var(--bg)`; `/recognition` — section 05 removed, its award tables folded into the section-03 project cards (`app/recognition/page.tsx`, Agora kept as an archive card).
DONE (2026-07-31, later): **opening sequence** (`components/IntroOverlay.tsx`) — opens the case IN PLACE (inside the hero container, not a full-screen overlay): `close.png` upscaled 4K→1200px (Higgsfield, alpha restored from the original cutout) and split down its centre seam into two leather doors (`public/suitcase/door_left.png` / `door_right.png`); closed case fades in over a warm-paper fill that hides the live open case, a brass-key SVG turns 90° with a click+glint, then the two doors swing open in 3D (perspective rotateY ±118°) and the fill fades to reveal the open suitcase + doll in the niche behind. One-time, localStorage-gated (`introSeenV2`), skippable (click/any key), reduced-motion aware. **Night niche doll rescaled** to match the other editions (was oversized, then too small — landed at a medium scale matching morning); new `night_loop/accent.mp4` + `night_poster.jpg`.

1. **Opening sequence — DONE (see above).** Possible follow-ups Kate may want: the closed case is portrait (`close.png`) while the open case is landscape, so the closed footprint is narrower than the revealed interior — if she wants a perfect footprint match, generate a landscape closed-case asset (same proportions as `open2`) and re-split it into doors. Tuning knobs live in `IntroOverlay.tsx` (phase timings, door swing angle, key position).
2. **Bicycle — still BLOCKED on a cutout.** `public/items/bike_hang.png` = the full `bike.png` reference (not a transparent green-bike cutout). JSX block is commented in `app/page.tsx`, position dialled in (`left 57% · top 16.5% · width 12.5%`). Un-comment when Kate re-saves the cutout. NOTE: `open2` now has an "I WANT TO BELIEVE" poster where the bike was to hang — confirm placement with Kate.
3. Possible polish: evening niche uses the older "One more page" reading doll (generated before the cutout-reference method) — proportions may differ slightly from the regenerated editions; regenerate the same way if Kate wants full consistency.

Temp alignment harnesses (`public/_*.html`) + `preview_*.png` are created + deleted per session — never committed. Local static server for visual tuning: `cd public && python3 -m http.server 8765`, open via `preview_start {url:"http://localhost:8765/_x.html"}` (localhost is blocked for plain `navigate`). To locate the niche rect / align crops: `cv2.matchTemplate(open2.png, openpart.png)`.

## Conventions / gotchas
- British English everywhere. Button labels Title Case. No fabricated data (neutral placeholders).
- Don't publish anything private (Kate's vault has visa/immigration/personal — never goes on the site). Contact email = `k.kazachkova@act.software` (not the personal gmail).
- `кукла/` source folder holds Kate's raw AI renders; it got committed — could be gitignored to slim the repo.
- Memory for this project lives under the design-system project's `memory/` (see `project-portfolio-*` and `feedback-portfolio-*` / `feedback-higgsfield-preapproved-spend`).
