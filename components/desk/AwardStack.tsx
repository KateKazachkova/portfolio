import { AWARD_RECORDS, awardRows, CARD_HEAD, short } from "@/lib/awards";

/**
 * A case file not written up yet lies on the desk as its library card of
 * awards — the one from Ukrainska 15's folder, at the same size and in the
 * same hand, filled from lib/awards.ts — over a stack of postcards, one
 * from each jury: its logo printed large with the year under it, what it
 * gave written on the back. A pointer over the file spreads the postcards a
 * little and tags the card "In progress" (the case is not written yet).
 * With the camera on the file (data-side="here") the card moves left, the
 * postcards fan out to its right, a sticky note above says what the project
 * is, and each postcard (and each row of the card) opens the organiser's
 * winner page.
 * Extras (a Behance tag, the case's own page) ride along as `links`, and a
 * picture postcard of the project itself can lie on top of the juries'.
 * A project with no awards (Atumatu) has no card: its picture postcard
 * lies alone, and the note says where its case is (`status`).
 */

// the juries' logos (public/stamps/awards/<key>.webp, alpha masks) and the
// ink each stamp is printed in
const STAMP: Record<string, { key: string; ratio: number; ink: string }> = {
  "London Design Awards": { key: "lda", ratio: 3.129, ink: "#a3261d" },
  "NYX Awards": { key: "nyx", ratio: 2.644, ink: "#4f3a7d" },
  "Indigo Design Award": { key: "indigo", ratio: 4.0, ink: "#2c3a86" },
  "NY Product Design Awards": { key: "nypda", ratio: 1.966, ink: "#1f2226" },
  "MUSE Creative Awards": { key: "muse", ratio: 3.026, ink: "#8f6d1f" },
  "Davey Awards": { key: "davey", ratio: 2.911, ink: "#1e4a73" },
};

const MEDAL: Record<string, number> = { Gold: 0, Silver: 1, Bronze: 2 };
const rank = (recognition: string) => MEDAL[recognition.split(" ")[0]] ?? 3;

function juriesOf(project: string) {
  const byJury = new Map<string, typeof AWARD_RECORDS>();
  for (const r of AWARD_RECORDS.filter((r) => r.project === project))
    byJury.set(r.organisation, [...(byJury.get(r.organisation) ?? []), r]);
  return [...byJury.entries()]
    .map(([jury, records]) => ({ jury, records: [...records].sort((a, b) => rank(a.recognition) - rank(b.recognition)) }))
    .sort((a, b) => rank(a.records[0].recognition) - rank(b.records[0].recognition) || b.records.length - a.records.length);
}

// how the postcards lie under the card, and fanned out beside it
const UNDER = [[10, 12, 5], [-8, 16, -6], [14, -8, 9], [-12, -10, -3]];

export default function AwardStack({ project, title, about, links = [], picture, flat, away }: {
  project: string; title: string;
  /** a case written up elsewhere (Behance): a pointer over the file shows
   *  "On <where>", and the note's foot is a button there. Without it the
   *  note says the case study is in progress, and the file "In progress"
   *  while it has a card of awards. */
  away?: { where: string; href: string };
  links?: { label: string; href: string; external?: boolean }[];
  /** lying flat and closed off the desk (the Case Studies index): no tag,
   *  sticky note or links beside it */
  flat?: boolean;
  /** what the project is, on the sticky note */
  about: string;
  /** a picture postcard of the project itself, on top of the juries' */
  picture?: { src?: string; href: string; alt: string; portrait?: boolean };
}) {
  const rows = awardRows(project);
  // the card's head, as on every copy of it (lib/awards.ts)
  const head = CARD_HEAD[project];
  const juries = juriesOf(project);
  const awayLink = away && { href: away.href, target: "_blank", rel: "noopener noreferrer", tabIndex: -1,
    "aria-label": `${title}: on ${away.where} (opens in a new tab)` };
  return (
    <>
      {juries.map(({ jury, records }, i) => {
        const [ux, uy, ur] = UNDER[i % UNDER.length];
        const stamp = STAMP[jury];
        const year = records.find((r) => r.year)?.year;
        return (
          <a key={jury} className="postcard" href={records[0].externalUrls[0]} target="_blank" rel="noopener noreferrer" tabIndex={-1}
            aria-label={`${jury}: ${records.map((r) => r.recognition).join(", ")} – winner page`}
            style={{ "--ux": ux, "--uy": uy, "--ur": `${ur}deg`, "--fy": -50 + i * 30, "--fr": `${i % 2 ? 1.5 : -1.5}deg`, zIndex: i + 1 } as React.CSSProperties}>
            <span className="postcard__msg">
              <span className="postcard__from">Greetings from</span>
              <span className="postcard__jury">{jury}</span>
              {records.map((r) => (
                <span key={r.id} className="postcard__line">{r.recognition}{r.category ? ` – ${short(r.category)}` : ""}</span>
              ))}
            </span>
            <span className="postcard__addr">
              {stamp && (
                <span className="postcard__logo" style={{ "--ink": stamp.ink, WebkitMaskImage: `url(/stamps/awards/${stamp.key}.webp)`, maskImage: `url(/stamps/awards/${stamp.key}.webp)` } as React.CSSProperties} />
              )}
              {year && <span className="postcard__year" style={{ "--ink": stamp?.ink } as React.CSSProperties}>{year}</span>}
              <span className="postcard__to">K. Kazachkova</span>
              <span className="postcard__to">{title}</span>
              <span className="postcard__to">&nbsp;</span>
            </span>
          </a>
        );
      })}
      {picture && (() => {
        const i = juries.length;
        const [ux, uy, ur] = UNDER[i % UNDER.length];
        return (
          <a className={`postcard postcard--picture${picture.portrait ? " postcard--portrait" : ""}`} href={picture.href} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-label={picture.alt}
            style={{ "--ux": ux, "--uy": uy, "--ur": `${ur}deg`, "--fy": -50 + i * 30, "--fr": "-1deg", zIndex: i + 1 } as React.CSSProperties}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={picture.src} alt="" draggable={false} decoding="async" loading={flat ? "lazy" : undefined} />
            {/* a portrait one is a print with its own caption */}
            {!picture.portrait && <span className="postcard__greet">Greetings from <b>{title}</b></span>}
            {/* where a click on it goes, under a pointer over it */}
            {picture.portrait && !flat && <span className="postcard__go" aria-hidden>View on Behance ↗</span>}
          </a>
        );
      })()}
      {rows.length > 0 && <div className="jury-card">
        <span className="jury-card__head">
          <span>{title}</span>
          {head && <span>{head.sub}</span>}
          {head?.role && <span>{head.role}</span>}
        </span>
        <span className="jury-card__row jury-card__row--th"><span>Date</span><span>Jury</span><span>Award</span></span>
        {rows.map((l, i) => {
          const cells = <><span className="jury-card__date">{l.date}</span><span>{l.jury}</span><span>{l.award}</span></>;
          return l.href
            ? <a key={i} className="jury-card__row" href={l.href} target="_blank" rel="noopener noreferrer" tabIndex={-1}
                aria-label={`${l.jury}, ${l.award} – winner page`}>{cells}</a>
            : <span key={i} className="jury-card__row">{cells}</span>;
        })}
      </div>}
      {!flat && <>
      {awayLink
        ? <a className="stack-soon" {...awayLink}>On {away!.where} ↗</a>
        : rows.length > 0 && <span className="stack-soon" aria-hidden>In progress</span>}
      <span className="sticky-note stack-note">
        <span className="sticky-note__kicker">{title}</span>
        <span className="sticky-note__text">{about}</span>
        {/* a case written up elsewhere: its way there, a red button on the note */}
        {awayLink
          ? <a className="sticky-note__status sticky-note__go" {...awayLink}>{away!.where} ↗</a>
          : <span className="sticky-note__status">Case study in progress</span>}
      </span>
      {links.map((l) => (
        <a key={l.href} className="jury-tag" href={l.href} tabIndex={-1}
          {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{l.label}</a>
      ))}
      </>}
    </>
  );
}
