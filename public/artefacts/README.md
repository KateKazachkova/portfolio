# Specimen artefacts — source drop

One folder per project specimen (Recognition page cards). Drop your own
material into the matching folder and I'll build a square Rubbish-FAMzine
style collage artefact from it, then wire it into the card.

Folders (by project id in `lib/awards.ts`):

- `ukrainska-15/` — Ukrainska 15 (SPECIMEN 001)
- `bulksource/`   — BulkSource (SPECIMEN 002)
- `waypro/`       — WayPro (SPECIMEN 003)
- `onsisoft/`     — OnsiSoft (SPECIMEN 004)

## What to drop in each folder
Anything that says something about the project — the more, the better:
- screenshots of the site / UI
- photos, textures, objects, tickets, stickers, notes
- logo / key colours
- a one-line note (`note.txt`) on the mood or objects you want in the collage

Filenames don't matter. Photos stay local (used only as generation input);
the finished collage is saved as `<id>/artefact.jpg` and referenced from
`lib/awards.ts` (`image` field). Once you've dropped material in, tell me
which project to build first.
