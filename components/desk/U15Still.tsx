/**
 * Ukrainska 15's stack as home's camera sees it — the tablet, the folder full
 * of prints on it, the player beside — as one photograph
 * (public/artefacts/ukrainska-15/envelope/still-home.webp). The live objects
 * are flat planes with their edges stood up; seen this low they read as
 * cut-outs, so at rest a still lies over them: the CSS scene captured
 * headless from this camera, relit and given real thickness and contact
 * shadows by a generation, with the real stickers and print put back over
 * it. It rides on .case-world, the plane at z = 0, so box px map 1:1. It is
 * right from here only: the moment the camera moves (or the folder opens) it
 * fades and the live objects take over.
 *
 * Box px of the capture: x 68.7–442, y 645.1–805.1 (373.3 × 160).
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
        position: "absolute", left: "calc(68.7 * var(--u))", top: "calc(645.1 * var(--u))",
        width: "calc(373.3 * var(--u))", height: "calc(160 * var(--u))",
      }}
    />
  );
}
