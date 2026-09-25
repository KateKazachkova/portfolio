import { useWarm } from "./useWarm";

/**
 * What lies with OnsiSoft's awards: it is payroll and compliance software,
 * so a payslip and a desk calculator. The payslip is Kate's own time on the
 * project, set as a continuous-form slip (tractor-feed holes down both
 * sides): she came on and began the redesign on 11 Oct 2024, her design
 * team has worked on it since Apr 2025, and she mentored an intern on it
 * from 4 Jun to 6 Nov 2025. The net pay is what the redesign did
 * (content/profile.ts). The calculator is generated
 * (public/items/onsisoft/calculator.webp, 526 × 800); its display, in code,
 * shows the bigger of the two, and its keys are labelled in code too.
 */

const EARNINGS = [
  { item: "Redesign", from: "Oct 2024" },
  { item: "Design team", from: "Apr 2025" },
  { item: "Intern mentoring", from: "Jun–Nov 2025" },
];
const NET = [
  { item: "Support requests", value: "−71%" },
  { item: "Onboarding completion", value: "+76%" },
];

export function Payslip() {
  return (
    <div className="payslip" aria-label="OnsiSoft payslip: K. Kazachkova on the project from 11 October 2024">
      <div className="payslip__paper">
        <div className="payslip__head">
          <span>OnsiSoft</span>
          <span>Payslip</span>
        </div>
        <div className="payslip__grid">
          <div className="payslip__col">
            <span className="payslip__k">Employee</span><span className="payslip__v">K. Kazachkova</span>
            <span className="payslip__k">Department</span><span className="payslip__v">Product design</span>
            <span className="payslip__k">Pay period</span><span className="payslip__v">11 Oct 2024 – present</span>
          </div>
          <div className="payslip__col">
            <span className="payslip__th"><span>Earnings</span><span>From</span></span>
            {EARNINGS.map((e) => (
              <span key={e.item} className="payslip__row"><span>{e.item}</span><span>{e.from}</span></span>
            ))}
            <span className="payslip__th payslip__th--net"><span>Net</span><span /></span>
            {NET.map((n) => (
              <span key={n.item} className="payslip__row payslip__row--net"><span>{n.item}</span><b>{n.value}</b></span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// The keys' faces, set over the generated calculator (which came blank):
// [label, left, top, right, bottom] in px of the 526 × 800 image, and
// whether the key is one of the grey ones (light type) or cream (dark).
const C = [43, 135, 227, 318, 410].map((x) => [x, x + 76]);
const R = [[320, 388], [404, 474], [490, 562], [578, 650], [666, 744]];
const KEYS: [string, number, number, number, number, boolean][] = [
  ["MR", C[0][0], R[0][0], C[0][1], R[0][1], true], ["M−", C[1][0], R[0][0], C[1][1], R[0][1], true],
  ["M+", C[2][0], R[0][0], C[2][1], R[0][1], true], ["−", C[3][0], R[0][0], C[3][1], R[0][1], true],
  ["C", C[4][0], R[0][0], C[4][1] + 2, R[0][1], true],
  ["%", C[0][0], R[1][0], C[0][1], R[1][1], true], ["7", C[1][0], R[1][0], C[1][1], R[1][1], false],
  ["8", C[2][0], R[1][0], C[2][1], R[1][1], false], ["9", C[3][0], R[1][0], C[3][1], R[1][1], false],
  ["÷", C[4][0], R[1][0], C[4][1] + 2, R[1][1], true],
  ["√", C[0][0], R[2][0], C[0][1], R[2][1], true], ["4", C[1][0], R[2][0], C[1][1], R[2][1], false],
  ["5", C[2][0], R[2][0], C[2][1], R[2][1], false], ["6", C[3][0], R[2][0], C[3][1], R[2][1], false],
  ["×", C[4][0], R[2][0], C[4][1] + 2, R[2][1], true],
  ["±", C[0][0], R[3][0], C[0][1], R[3][1], true], ["1", C[1][0], R[3][0], C[1][1], R[3][1], false],
  ["2", C[2][0], R[3][0], C[2][1], R[3][1], false], ["3", C[3][0], R[3][0], C[3][1], R[3][1], false],
  ["+", C[4][0], R[3][0], C[4][1] + 2, R[4][1], true],
  ["0", C[0][0], R[4][0], 258, R[4][1], true], ["=", 276, R[4][0], C[3][1], R[4][1], false],
];

export function Calculator() {
  const warm = useWarm();
  return (
    <span className="calc" aria-hidden>
      {/* its body: four walls up to the top, which lies at its height */}
      <span className="calc__wall calc__wall--front" />
      <span className="calc__wall calc__wall--back" />
      <span className="calc__wall calc__wall--left" />
      <span className="calc__wall calc__wall--right" />
      <span className="calc__top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={warm ? "/items/onsisoft/calculator.webp" : undefined} alt="" draggable={false} decoding="async" />
        <span className="calc__lcd">+76%</span>
        {KEYS.map(([k, l, t, r, b, grey]) => (
          <span key={k} className={grey ? "calc__key calc__key--grey" : "calc__key"}
            style={{ left: `${(l / 526) * 100}%`, top: `${(t / 800) * 100}%`, width: `${((r - l) / 526) * 100}%`, height: `${((b - t) / 800) * 100}%` }}>{k}</span>
        ))}
      </span>
    </span>
  );
}
