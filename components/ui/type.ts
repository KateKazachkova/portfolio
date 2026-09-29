/**
 * The typographic constants the whole site was repeating.
 *
 * `mono` was declared identically in fourteen files. It is not a token in the
 * CSS sense — the font itself comes from the --font-mono variable Next sets —
 * but the fallback chain after it was being retyped every time, and a fallback
 * chain that drifts is how two pages end up in different fonts on the one
 * machine that lacks the webfont.
 */
export const mono = "var(--font-mono), ui-monospace, monospace";

/** The headline family (Archivo), for UI text set in the headline's voice. */
export const display = "var(--font-display), system-ui, sans-serif";
