import fs from "fs";
import path from "path";

export type WatchItem = {
  title: string;
  why: string;
  poster: string | null;
  year: number | null;
  /** A YouTube video id, from a `Clip:` line (any youtube.com / youtu.be link). */
  clip?: string | null;
  /** The disc's own label, a 520 × 520 cut of the poster for the CD wallet
   *  (public/posters/disc/), if one has been made; otherwise the disc wears
   *  the full poster. */
  disc?: string | null;
};

/** A book or a comic on Off Duty's shelf: a WatchItem with who wrote it,
 *  and, if given, its spine's colours and its size. */
export type ShelfItem = WatchItem & {
  author?: string;
  /** the spine's colour and its lettering's, from a `Spine: #bg #ink` line */
  spine?: [string, string] | null;
  /** cm: height × thickness for a book, height × width for a comic */
  size?: [number, number] | null;
};

// A label in public/posters/disc/ named after the title, however it is
// spelt ("Outlander- Blood of My Blood.png", "sleepy-hollow.png"), with or
// without a year in brackets, or after the poster's own file; any of the
// usual formats.
const DISC_DIR = path.join(process.cwd(), "public/posters/disc");
const slugOf = (t: string) =>
  t.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
function discFor(item: WatchItem): string | null {
  let files: string[];
  try { files = fs.readdirSync(DISC_DIR); } catch { return null; }
  const names = [
    slugOf(item.title),
    slugOf(item.title.replace(/\s*\([^)]*\)\s*$/, "")),
    item.poster ? slugOf(path.basename(item.poster).replace(/\.[^.]+$/, "")) : "",
  ].filter(Boolean);
  for (const name of names) {
    const f = files.find((x) => /\.(webp|png|jpe?g)$/i.test(x) && slugOf(x.replace(/\.[^.]+$/, "")) === name);
    // escaped for CSS too: the disc face puts it in an unquoted url()
    if (f) return `/posters/disc/${encodeURIComponent(f).replace(/['()]/g, (c) => "%" + c.charCodeAt(0).toString(16))}`;
  }
  return null;
}

// The id out of a YouTube link: watch?v=…, youtu.be/…, /embed/… or /shorts/….
function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function parseList(filename: string, keepOrder = false): ShelfItem[] {
  const filePath = path.join(process.cwd(), "content/about/films-and-series", filename);

  let raw = "";
  try {
    raw = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  // Drop HTML comments whole, before anything is read line by line. Each of
  // these files opens with a commented-out template — a `## Title` with a year,
  // a why and a poster — and skipping only the lines that *start* with `<!--`
  // let the three lines inside it through as a real entry. It has been passing
  // unnoticed because the template's heading is the literal word "Title" and
  // the filter at the bottom drops that one string; rename it to anything else
  // and the list grows a phantom film pointing at posters/filename.jpg.
  // The second pass takes an unclosed comment to the end of the file, which is
  // what a Markdown renderer does with it too.
  const body = raw.replace(/<!--[\s\S]*?-->/g, "").replace(/<!--[\s\S]*$/, "");

  const items: ShelfItem[] = [];
  let current: ShelfItem | null = null;

  for (const line of body.split("\n")) {
    const trimmed = line.trim();

    // Skip the top-level heading
    if (trimmed.startsWith("#") && !trimmed.startsWith("##")) continue;

    if (trimmed.startsWith("## ")) {
      if (current) items.push(current);
      current = { title: trimmed.replace(/^##\s+/, "").trim(), why: "", poster: null, year: null };
    } else if (current && /^why i like it:/i.test(trimmed)) {
      current.why = trimmed.replace(/^why i like it:/i, "").trim();
    } else if (current && /^poster:/i.test(trimmed)) {
      const p = trimmed.replace(/^poster:/i, "").trim();
      current.poster = p ? "/" + p.replace(/^\/?posters\//, "posters/") : null;
    } else if (current && /^clip:/i.test(trimmed)) {
      current.clip = youtubeId(trimmed.replace(/^clip:/i, "").trim());
    } else if (current && /^author:/i.test(trimmed)) {
      current.author = trimmed.replace(/^author:/i, "").trim() || undefined;
    } else if (current && /^spine:/i.test(trimmed)) {
      const c = trimmed.match(/#[0-9a-f]{3,8}\b/gi);
      current.spine = c && c.length >= 2 ? [c[0], c[1]] : null;
    } else if (current && /^size:/i.test(trimmed)) {
      const n = trimmed.match(/\d+(?:[.,]\d+)?/g)?.map((x) => parseFloat(x.replace(",", ".")));
      current.size = n && n.length >= 2 ? [n[0], n[1]] : null;
    } else if (current && /^year:/i.test(trimmed)) {
      const y = parseInt(trimmed.replace(/^year:/i, "").trim(), 10);
      current.year = Number.isFinite(y) ? y : null;
    }
  }
  if (current) items.push(current);

  // Anything left without a title is not an entry. The "title" check is what
  // used to hide the comment bug above; it stays as a cheap guard for a
  // template pasted outside a comment.
  const filtered = items.filter((i) => i.title && i.title.toLowerCase() !== "title");
  // the shelf keeps them the way the file lists them
  if (keepOrder) return filtered;

  // Newest first; entries without a year sink to the bottom (alphabetical among themselves)
  return filtered.sort((a, b) => {
    if (a.year === null && b.year === null) return a.title.localeCompare(b.title);
    if (a.year === null) return 1;
    if (b.year === null) return -1;
    return b.year - a.year;
  });
}

export function getSeries(): WatchItem[] {
  return parseList("series.md").map((s) => ({ ...s, disc: discFor(s) }));
}

/** Off Duty's shelf: the books spine out and the comics face out, in the
 *  order their files list them. */
export function getShelf(): { books: ShelfItem[]; comics: ShelfItem[] } {
  return { books: parseList("books.md", true), comics: parseList("comics.md", true) };
}

/** The films, for the VHS stacks on Off Duty's corner. */
export function getFilms(): WatchItem[] {
  return parseList("films.md");
}
