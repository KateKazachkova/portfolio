---
name: ship
description: Finish a feature on the portfolio site before it goes out — simplify, code review, typecheck and lint, a look in the browser, heavy-asset checks, then a commit of only this session's hunks; with "push", also push staging and run PageSpeed on staging.uxuikazachkova.xyz. Use when Kate says "/ship", "фича готова", "доведи до конца", "проверь и закоммить", "подготовь к пушу", or finishes a feature and asks what to run.
---

# /ship — a feature, from done to committed (and deployed)

Run the steps in order. Stop at the first step that fails, fix what is yours,
say what failed and what you did, and go on. Report at the end in Russian,
telegraphic: one line per step, `✓` / `✗` / `—` (skipped, with why).

Arguments: `push` also runs step 8. A Figma URL also runs `design-parity`
in step 5. Anything else is the feature's name or scope (file paths).

## 0. Scope: what the feature is

- Other sessions work in this checkout at the same time. `git status` and
  `git diff` show their edits too.
- The feature is what this session changed, or the paths Kate named. If
  that is unclear, list the changed files and ask which are hers before going on.
- Never stage `.claude/launch.json` or `tsconfig.json` unless they are the
  feature: builds and other sessions rewrite them.

## 1. Simplify

Invoke the `simplify` skill on the feature's files. It edits the working
tree. Keep its changes unless they break something below.

## 2. Code review

Invoke `code-review` at `high`, with `--fix`, on the feature's files. For
anything it reports but does not fix, decide: fix it, or list it in the report.

If the diff touches `app/api/**`, `lib/**` that calls an external service,
env vars (`process.env`), `next.config.ts`, forms, or `dangerouslySetInnerHTML`,
also invoke `security-review`. It needs `origin/HEAD`; if it is missing,
run `git remote set-head origin -a`.

## 3. Types and lint

```bash
npx tsc --noEmit 2>&1 | grep -v "^.next"
npx eslint .
```

Both must be clean. Errors only under `.next/types/` come from a stale old
build (pages that no longer exist): delete `.next/types`, not anything else
in `.next/`, since another session's dev server may be using it.

## 4. Heavy assets

For files the feature added or changed under `public/`:

- Images over ~300 KB: check the size they are shown at, the largest across
  the camera's stops (home, Case Files, Recognition, Profile, Off Duty). If
  the file is more than 2.5× wider than that at 2× retina, say so. Things
  inside the case are only ever seen at case size; those get a `.sm.webp`
  copy (see `components/home/CaseShelves.tsx`).
- Every `.mp4` must be faststart, with `moov` before `mdat`; otherwise the
  browser downloads it twice. Fix losslessly:
  `ffmpeg -i in.mp4 -c copy -map 0 -movflags +faststart out.mp4`.
- Nothing over 50 MB, nothing that is source art (`*.psd`, `*.aep`,
  `*_raw.mp4`, `public/dolls/gen/`, `public/player/gen/`): the push hook
  rejects large files, and `.gitignore` keeps source art out.

## 5. Look at it

- Start this session's own dev server: `preview_start` with the name
  `portfolio-check` (port 3250, `NEXT_DIST_DIR=.next-check`, so it never
  touches the dev server another session runs on 3000).
- Open the page the feature is on and check:
  - console and network: no errors, no 404s;
  - the feature works: click, keyboard (Tab/Enter);
  - a phone width (375) as well as desktop.
- The pane is often hidden, so pages do not paint and camera moves do not
  run until a screenshot is taken. Take screenshots between steps.
- If the served CSS lacks an edit that is on disk, the watcher missed it.
  Stop the server, `rm -rf .next-check`, and start it again. Check the rule
  in the served chunk, not in the file.
- With a Figma URL: invoke `design-parity` against this page.
- Stop the server when done.

## 6. Commit

- Stage by explicit path, only the feature's files. `git diff --cached`
  must show no other session's hunks. If a file mixes in someone else's
  edits, commit a blob built from HEAD plus only your hunks
  (`git hash-object -w` + `git update-index --cacheinfo`).
- The message follows the repo's style: prose sentences, what the visitor
  now sees or gets, British English, then the attribution line the session
  prescribes.
- Work stays on `staging`: no feature branches.

## 7. Report

One line per step, the commit hash, and anything left open. If `push` was
not given, end by asking whether to push and check PageSpeed.

## 8. Push and PageSpeed (only with `push`, or when Kate says yes)

1. Before pushing, run `git fetch origin staging` and list what is about to
   go out (`git log --oneline origin/staging..staging`), then
   `git push origin staging`. Never push `main`: it is the parked
   production site.
2. Wait for Vercel: poll a URL that only the new build serves, for example
   a new file, every 10 s for up to ~7 min. If there is none, wait about 90 s.
3. Run PageSpeed Insights on mobile in the browser pane:
   `https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fstaging.uxuikazachkova.xyz%2F&form_factor=mobile`.
   - Front the tab (`tabs_select`) and wait in 10 s steps until the URL gets
     a report id.
   - Then read Performance, Accessibility, LCP, Speed Index, TBT, CLS and
     total size, and open "Avoid enormous network payloads" for the top files.
   - The keyless PageSpeed API is usually over its daily quota; use the page.
4. Report the numbers against the last run (2026-09-25 baseline:
   Performance 70, LCP 18.8 s, SI 4.3 s, 11.1 MB, Accessibility 92), plus
   anything new in the top files.
