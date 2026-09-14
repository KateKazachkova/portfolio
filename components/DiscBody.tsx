import type { CSSProperties } from "react";

/**
 * The physical disc: printed label → grooves → iridescent sheen → clear hub →
 * silver rim. Pure CSS layers inside a `.cd-body` circle; the parent decides
 * the tilt (`--px/--py`) and any transition. Shared by the rack, the flying
 * disc and the player.
 */
export default function DiscBody({ poster, title, className, style }: { poster: string | null; title: string; className?: string; style?: CSSProperties }) {
  return (
    <span className={`cd-body ${className ?? ""}`} style={style}>
      {poster ? (
        <span className="cd-face" style={{ backgroundImage: `url(${poster})` } as CSSProperties} />
      ) : (
        <span className="cd-face cd-face--blank"><span>{title}</span></span>
      )}
      <span className="cd-grooves" aria-hidden="true" />
      <span className="cd-sheen" aria-hidden="true" />
      <span className="cd-hub" aria-hidden="true" />
      <span className="cd-edge" aria-hidden="true" />
    </span>
  );
}
