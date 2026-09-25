import fs from "fs";
import path from "path";

export type WatchItem = {
  title: string;
  why: string;
  poster: string | null;
  year: number | null;
  /** A YouTube video id, from a `Clip:` line (any youtube.com / youtu.be link). */
  clip?: string | null;
};

// The id out of a YouTube link: watch?v=…, youtu.be/…, /embed/… or /shorts/….
function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function parseList(filename: string): WatchItem[] {
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

  const items: WatchItem[] = [];
  let current: WatchItem | null = null;

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

  // Newest first; entries without a year sink to the bottom (alphabetical among themselves)
  return filtered.sort((a, b) => {
    if (a.year === null && b.year === null) return a.title.localeCompare(b.title);
    if (a.year === null) return 1;
    if (b.year === null) return -1;
    return b.year - a.year;
  });
}

export function getFilms(): WatchItem[] {
  return parseList("films.md");
}

export function getSeries(): WatchItem[] {
  return parseList("series.md");
}

export function getBooks(): WatchItem[] {
  return parseList("books.md");
}
