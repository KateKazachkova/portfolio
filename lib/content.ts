import fs from "fs";
import path from "path";

export type WatchItem = {
  title: string;
  why: string;
  poster: string | null;
};

function parseList(filename: string): WatchItem[] {
  const filePath = path.join(process.cwd(), "content/about/films-and-series", filename);

  let raw = "";
  try {
    raw = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  const items: WatchItem[] = [];
  let current: WatchItem | null = null;

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();

    // Skip HTML comments and the top-level heading
    if (trimmed.startsWith("<!--") || trimmed.startsWith("#") && !trimmed.startsWith("##")) continue;

    if (trimmed.startsWith("## ")) {
      if (current) items.push(current);
      current = { title: trimmed.replace(/^##\s+/, "").trim(), why: "", poster: null };
    } else if (current && /^why i like it:/i.test(trimmed)) {
      current.why = trimmed.replace(/^why i like it:/i, "").trim();
    } else if (current && /^poster:/i.test(trimmed)) {
      const p = trimmed.replace(/^poster:/i, "").trim();
      current.poster = p ? "/" + p.replace(/^\/?posters\//, "posters/") : null;
    }
  }
  if (current) items.push(current);

  // Drop empty template placeholders
  return items.filter((i) => i.title && i.title.toLowerCase() !== "title");
}

export function getFilms(): WatchItem[] {
  return parseList("films.md");
}

export function getSeries(): WatchItem[] {
  return parseList("series.md");
}
