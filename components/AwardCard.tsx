import "./AwardCard.css";
import { awardRows, CARD_HEAD } from "@/lib/awards";

/**
 * A project's awards as a library book card — the one in Ukrainska 15's
 * folder on the desk, drawn for any project from lib/awards.ts. What the
 * book has been out to is juries: one ruled row per award, a record that
 * stands for several (CSSDA's "Best UI · Best UX …") split into its rows.
 * The date column is stamped with the award's year. A row with a winner
 * page is a link to it, the whole row wide, and says so on hover. Its head
 * is the desk's (lib/awards.ts CARD_HEAD), so the card reads the same
 * everywhere.
 */

export default function AwardCard({ project }: { project: string }) {
  const rows = awardRows(project);
  const head = CARD_HEAD[project];
  if (!rows.length) return null;
  return (
    <div className="award-card" role="table" aria-label={`${project}: awards`}>
      <div className="award-card__head">
        <span>{project}</span>
        {head && <span>{head.sub}</span>}
        {head?.role && <span>{head.role}</span>}
      </div>
      <div className="award-card__row award-card__row--th" role="row">
        <span role="columnheader">Date</span><span role="columnheader">Jury</span><span role="columnheader">Award</span>
      </div>
      {rows.map((l, i) => (
        <div key={i} className="award-card__row" role="row">
          <span role="cell" className="award-card__date">{l.date}</span>
          <span role="cell">{l.jury}</span>
          <span role="cell">
            {l.href ? (
              <a className="award-card__link" href={l.href} target="_blank" rel="noopener noreferrer"
                aria-label={`${l.jury} – ${l.award}: winner page`}>{l.award}</a>
            ) : l.award}
          </span>
        </div>
      ))}
    </div>
  );
}
