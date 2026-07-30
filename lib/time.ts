export type Edition = {
  key: string;
  label: string;
  slogan: string | null;
  range: string;
  items: string[];
};

export const EDITIONS: Record<string, Edition> = {
  morning: { key: "morning", label: "Morning Edition", slogan: "Loading… Please Wait", range: "07–09", items: ["Mushroom mug", "Blue cardigan", "Stitch pyjamas"] },
  office:  { key: "office",  label: "Day Edition",     slogan: "The Investigator",   range: "09–17", items: ["Polaroid", "Notebook", "VHS", "Case folder"] },
  street:  { key: "street",  label: "Street Edition",  slogan: "Urban Explorer",     range: "17–19", items: ["Flashlight", "Old map", "Compass", "Key"] },
  evening: { key: "evening", label: "Evening Edition", slogan: null,                 range: "19–23", items: [] },
  night:   { key: "night",   label: "Deep Night Edition", slogan: "Archive Mode",    range: "23–07", items: ["Blanket", "Harari books", "Film negatives"] },
};

export function editionForHour(h: number): Edition {
  if (h >= 7 && h < 9) return EDITIONS.morning;
  if (h >= 9 && h < 17) return EDITIONS.office;
  if (h >= 17 && h < 19) return EDITIONS.street;
  if (h >= 19 && h < 23) return EDITIONS.evening;
  return EDITIONS.night;
}

export type Daytime = "morning" | "day" | "evening" | "night";

// Ambient mood for the whole site — groups the 5 editions into 4 moods.
export function daytimeForHour(h: number): Daytime {
  const e = editionForHour(h).key;
  if (e === "morning") return "morning";
  if (e === "office") return "day";
  if (e === "street" || e === "evening") return "evening";
  return "night";
}
