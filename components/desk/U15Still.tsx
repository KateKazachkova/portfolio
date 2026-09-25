/**
 * Ukrainska 15's stack as home's camera sees it — the folder full of prints,
 * the player beside — as one photograph
 * (public/artefacts/ukrainska-15/envelope/still-home.webp). The live objects
 * are flat planes with their edges stood up; seen this low they read as
 * cut-outs, so at rest a still lies over them: the CSS scene captured
 * headless from this camera, relit and given real thickness and contact
 * shadows by a generation, with the real stickers and print put back over
 * it (the tablet it was made with, under the folder, since cut out and its
 * contact shadow drawn along the folder's own edge). It rides on .case-world, the plane at z = 0, so box px map 1:1. It is
 * right from here only: the moment the camera moves (or the folder opens) it
 * fades and the live objects take over.
 *
 * Box px of the capture: x 68.7–442, y 645.1–805.1 (373.3 × 160), taken with
 * the cases one tile (107.5) further back; brought forward it is that capture
 * scaled about the camera's principal point (560, 226) by (2150 − 306) /
 * (2150 − 413.5), the stack's depth then and now.
 */
export default function U15Still() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="u15-still"
      src="/artefacts/ukrainska-15/envelope/still-home.webp"
      alt=""
      aria-hidden
      draggable={false}
      style={{
        position: "absolute", left: "calc(38.3 * var(--u))", top: "calc(671.0 * var(--u))",
        width: "calc(396.4 * var(--u))", height: "calc(169.9 * var(--u))",
      }}
    />
  );
}
