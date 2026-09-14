export type Edition = {
  key: string;
  label: string;
  slogan: string | null;
  range: string;
  items: string[];
};

export const EDITIONS: Record<string, Edition> = {
  morning: { key: "morning", label: "Morning Edition", slogan: "Loading… Please Wait", range: "07–09", items: ["Mushroom mug", "Blue cardigan", "Stitch pyjamas"] },
  office:  { key: "office",  label: "Day Edition",     slogan: "Deep Work",          range: "10–13", items: ["Laptop", "Figma", "Undo ×5"] },

  // Workday shifts — the Day edition split into what a designer's day actually
  // looks like. Same outfit, different business.
  work_standup: { key: "work_standup", label: "Day Edition", slogan: "Morning Standup", range: "09–10", items: ["Mug", "Earbuds", "Camera off"] },
  work_lunch:   { key: "work_lunch",   label: "Day Edition", slogan: "Lunch Break",     range: "13–14", items: ["Lunch box", "Fork", "A few pages"] },
  work_calls:   { key: "work_calls",   label: "Day Edition", slogan: "Calls & Reviews", range: "14–16", items: ["Laptop", "Camera on", "Hands talking"] },
  work_wrapup:  { key: "work_wrapup",  label: "Day Edition", slogan: "Wrap-up",         range: "16–17", items: ["Notebook", "Pencil", "Plan for tomorrow"] },
  // Specials that only happen on real calendar days (see editionForDate)
  mon_standup:    { key: "mon_standup",    label: "Day Edition", slogan: "Monday Standup",  range: "Mon 09–10",       items: ["Mug", "Second mug", "Earbuds"] },
  fri_wine:       { key: "fri_wine",       label: "Day Edition", slogan: "Friday Call",     range: "Fri 17:00–17:58", items: ["Laptop", "Red wine", "Colleagues"] },
  fri_transition: { key: "fri_transition", label: "Day Edition", slogan: "Closing Time",    range: "Fri 17:58–18:00", items: ["Laptop shut", "Hoodie", "Yellow raincoat"] },
  street:  { key: "street",  label: "Street Edition",  slogan: "Urban Explorer",     range: "17–19", items: ["Flashlight", "Old map", "Compass", "Key"] },
  evening: { key: "evening", label: "Evening Edition", slogan: null,                 range: "19–23", items: [] },
  night:   { key: "night",   label: "Deep Night Edition", slogan: "Archive Mode",    range: "23–07", items: ["Blanket", "Harari books", "Film negatives"] },

  // Weekend editions — she rests, she doesn't work. Shown on Saturday by real
  // local date (see editionForDate); the manual clock still cycles the 5 above.
  weekend_brunch:   { key: "weekend_brunch",   label: "Weekend Edition", slogan: "Off the Clock",  range: "Sat 08–11", items: ["Coffee", "Pancakes", "A good book"] },
  weekend_cleaning: { key: "weekend_cleaning", label: "Cleaning Day",    slogan: "Spring Clean",   range: "Sat 11–13", items: ["Bucket", "Cloth", "Red kerchief"] },
  weekend_series:   { key: "weekend_series",   label: "Series Marathon", slogan: "One More Episode", range: "Sat 13–19", items: ["Laptop", "Popcorn", "Blanket"] },
};

export function editionForHour(h: number): Edition {
  if (h >= 7 && h < 9) return EDITIONS.morning;
  if (h >= 9 && h < 10) return EDITIONS.work_standup;
  if (h >= 10 && h < 13) return EDITIONS.office;       // deep work
  if (h >= 13 && h < 14) return EDITIONS.work_lunch;
  if (h >= 14 && h < 16) return EDITIONS.work_calls;
  if (h >= 16 && h < 17) return EDITIONS.work_wrapup;
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
  const m = d.getMinutes();
  const weekend = day === 6 || day === 0;
  // Monday: the standup needs two mugs.
  if (day === 1 && h === 9) return EDITIONS.mon_standup;
  // Friday: 17:00 the call with colleagues turns into wine; at 17:58 she shuts
  // the laptop and pulls on the hoodie + raincoat — the hand-over to the street.
  if (day === 5 && h === 17) return m < 58 ? EDITIONS.fri_wine : EDITIONS.fri_transition;
  if (weekend) {
    if (h < 8) return EDITIONS.night;
    if (h < 11) return EDITIONS.weekend_brunch;
    if (h < 13) return EDITIONS.weekend_cleaning;
    // Sunday afternoon is meant for cycling (TODO); until that edition
    // exists, both weekend days share the series marathon so she never works.
    if (h < 19) return EDITIONS.weekend_series;
  }
  return editionForHour(h);
}

export type Daytime = "morning" | "day" | "evening" | "night";

// Ambient mood for the whole site – groups the editions into 4 moods.
export function daytimeForHour(h: number): Daytime {
  const e = editionForHour(h).key;
  if (e === "morning") return "morning";
  if (e === "office" || e.startsWith("work_") || e === "mon_standup") return "day";
  if (e === "fri_wine" || e === "fri_transition") return "evening";
  if (e === "street" || e === "evening") return "evening";
  return "night";
}

export function daytimeForDate(d: Date): Daytime {
  const e = editionForDate(d).key;
  if (e === "weekend_brunch") return "morning";
  if (e === "weekend_cleaning" || e === "weekend_series") return "day";
  return daytimeForHour(d.getHours());
}
