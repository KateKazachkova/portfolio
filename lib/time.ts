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

  // Weekend editions — she rests, she doesn't work. Shown on Saturday by real
  // local date (see editionForDate); the manual clock still cycles the 5 above.
  weekend_brunch:   { key: "weekend_brunch",   label: "Weekend Edition", slogan: "Off the Clock", range: "Sat 08–11", items: ["Coffee", "Pancakes", "A good book"] },
  weekend_cleaning: { key: "weekend_cleaning", label: "Cleaning Day",    slogan: "Spring Clean",  range: "Sat 11–13", items: ["Bucket", "Cloth", "Red kerchief"] },
};

export function editionForHour(h: number): Edition {
  if (h >= 7 && h < 9) return EDITIONS.morning;
  if (h >= 9 && h < 17) return EDITIONS.office;
  if (h >= 17 && h < 19) return EDITIONS.street;
  if (h >= 19 && h < 23) return EDITIONS.evening;
  return EDITIONS.night;
}

// Weekend-aware edition from a full local date. On Saturday she rests:
// 00–08 deep night (unchanged), 08–11 weekend brunch, 11–13 cleaning day;
// the rest of the day falls back to the normal hour schedule.
export function editionForDate(d: Date): Edition {
  const day = d.getDay(); // 0 Sun … 6 Sat
  const h = d.getHours();
  if (day === 6) {
    if (h < 8) return EDITIONS.night;
    if (h < 11) return EDITIONS.weekend_brunch;
    if (h < 13) return EDITIONS.weekend_cleaning;
  }
  return editionForHour(h);
}

export type Daytime = "morning" | "day" | "evening" | "night";

// Ambient mood for the whole site – groups the editions into 4 moods.
export function daytimeForHour(h: number): Daytime {
  const e = editionForHour(h).key;
  if (e === "morning") return "morning";
  if (e === "office") return "day";
  if (e === "street" || e === "evening") return "evening";
  return "night";
}

export function daytimeForDate(d: Date): Daytime {
  const e = editionForDate(d).key;
  if (e === "weekend_brunch") return "morning";
  if (e === "weekend_cleaning") return "day";
  return daytimeForHour(d.getHours());
}
