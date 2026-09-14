// Generated from public/player/frame_mirrored.json — geometry of the KATE™ PD-001 player layers
// (the photographed layers are MIRRORED so the player faces the disc rack).
// Quads are normalised to the shared layer frame (0..1), ordered TL, TR, BR, BL — "top" is the far
// (hinge) edge, "bottom" the near (latch) edge. Plane UV: u 0..1 along the hinge, v 0..1 hinge→latch.
export type Pt = [number, number];
export type Quad = [Pt, Pt, Pt, Pt];
export type Sticker = { name: string; u: number; v: number; w: number; rot: number };

export const FRAME: Pt = [2511, 2089];
export const LID_TOP: Quad = [[0.3114, 0.4586], [0.8037, 0.6309], [0.5468, 0.8583], [0.0255, 0.641]];
export const BASE_TOP: Quad = [[0.3142, 0.4844], [0.8104, 0.6166], [0.5759, 0.784], [0.0422, 0.6178]];
export const SCREEN: Quad = [[0.4576, 0.0661], [0.9331, 0.1427], [0.8172, 0.5098], [0.3568, 0.4016]];
export const HINGE: [Pt, Pt] = [[0.3911, 0.4816], [0.7216, 0.5725]];
/** stickers on the closed lid */
export const LID_STICKERS: Sticker[] = [{"name": "umbrella", "u": 0.83, "v": 0.3, "w": 0.24, "rot": -14}, {"name": "kaz-2y5", "u": 0.89, "v": 0.64, "w": 0.22, "rot": 12}, {"name": "chakram", "u": 0.69, "v": 0.8, "w": 0.2, "rot": 0}, {"name": "beavers", "u": 0.30, "v": 0.60, "w": 0.24, "rot": 8}];
/** stickers on the base's palm rest, visible while the player is open */
export const BASE_STICKERS: Sticker[] = [{"name": "trust-no-one", "u": 0.74, "v": 0.3, "w": 0.34, "rot": 8}, {"name": "blood-slide", "u": 0.84, "v": 0.68, "w": 0.24, "rot": -18}, {"name": "wolf-medallion", "u": 0.54, "v": 0.66, "w": 0.15, "rot": -5}];
/** physical controls on the base (plane UV), the LCD window quad (plane UV) and button diameter (plane width units) */
export const CONTROLS = {"prev": [0.908, 1.0895], "play": [0.8534, 1.09], "stop": [0.7987, 1.0952], "next": [0.7447, 1.0993], "power": [0.5474, 1.1085], "dpad": [1.0119, 1.1071], "lcd": [[0.6001, 1.1247], [0.7096, 1.0897], [0.7395, 1.1583], [0.6285, 1.1908]], "buttonSize": 0.055} as const;
/** where the engraving sat on the lid before we erased it from the photo (plane UV) */
export const ENGRAVING = {"kate": [0.5624, 0.5096], "label": [0.5615, 1.0397]} as const;
/** which disc each sticker points at (matched against series titles) */
export const STICKER_TARGETS: Record<string, RegExp> = {
  "umbrella": /how i met your mother/i,
  "trust-no-one": /x-files/i,
  "kaz-2y5": /supernatural/i,
  "blood-slide": /^dexter$/i,
  "chakram": /xena/i,
  "beavers": /angry beavers/i,
  "wolf-medallion": /witcher/i,
};
