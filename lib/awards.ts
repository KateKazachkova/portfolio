// Structured award data for the Quality Check page.
// Real data from Kate's records. Unknown values are null and must never render as "undefined".
// Extend freely; keep placeholders explicit.

export const AWARD_STATS = {
  gold: 6,
  silver: 20,
  bronze: 4,
  total: 30, // medals
  webDistinctions: 6, // CSS Winner Star, CSSDA (3 + kudos), CSS Nectar, Design Nominees
};

export type Quality = {
  key: string;
  label: string;
  description: string;
};

export const QUALITIES: Quality[] = [
  {
    key: "ux",
    label: "User Experience",
    description:
      "Recognition for turning complex information and interactions into experiences people can understand and navigate.",
  },
  {
    key: "ui",
    label: "Interface Design",
    description:
      "Recognition for visual systems that support the product instead of competing with it.",
  },
  {
    key: "innovation",
    label: "Innovation",
    description:
      "Recognition for original concepts, interaction approaches and digital execution.",
  },
  {
    key: "storytelling",
    label: "Digital Storytelling",
    description:
      "Recognition for using design and technology to make personal and complex stories understandable.",
  },
];

export type VerifiedProject = {
  id: string;
  specimen: string;
  name: string;
  image: string | null;
  description: string;
  recognitionCount: number;
  recognisedFor: string[]; // labels
  awards: string[]; // selected awards, plain strings
  caseStudyUrl: string | null;
  externalUrl: string | null;
};

export const VERIFIED_PROJECTS: VerifiedProject[] = [
  {
    id: "ukrainska-15",
    specimen: "SPECIMEN 001",
    name: "Ukrainska 15",
    image: null,
    description:
      "A self-initiated digital story about home, occupation and memory — independently designed and developed to preserve the story of a house in Kupiansk.",
    recognitionCount: 8,
    recognisedFor: ["UX", "UI", "Innovation", "Storytelling"],
    awards: [
      "MUSE Creative Awards — Gold",
      "MUSE Creative Awards — Gold",
      "CSS Design Awards — Best UI, Best UX, Best Innovation + Special Kudos",
      "CSS Winner — Star",
      "CSS Nectar — Site of the Day",
      "Design Nominees — Site of the Day",
      "French Design Awards — Silver",
    ],
    caseStudyUrl: null,
    externalUrl: "https://ukrainska15.com",
  },
  {
    id: "bulksource",
    specimen: "SPECIMEN 002",
    name: "BulkSource",
    image: null,
    description:
      "A US B2B supply-chain SaaS platform for bulk and construction materials, designed from 0→1 and carried single-handedly for four years.",
    recognitionCount: 9,
    recognisedFor: ["UX", "UI"],
    awards: [
      "London Design Awards — 3× Silver",
      "NYX Awards — 3× Silver",
      "Indigo Design Award — 2× Silver + Bronze",
      "NY Product Design Awards — Silver",
    ],
    caseStudyUrl: null,
    externalUrl: null,
  },
  {
    id: "waypro",
    specimen: "SPECIMEN 003",
    name: "WayPro",
    image: null,
    description:
      "An award-winning logistics and routing mobile app for a US client — driver, matching and shipper flows.",
    recognitionCount: 5,
    recognisedFor: ["UX", "UI", "Innovation"],
    awards: [
      "Indigo Design Award — 2× Gold + Silver",
      "London Design Awards — Gold",
      "Davey Awards — Gold (Best UI)",
      "MUSE Creative Awards — Silver",
    ],
    caseStudyUrl: null,
    externalUrl: null,
  },
  {
    id: "onsisoft",
    specimen: "SPECIMEN 004",
    name: "OnsiSoft",
    image: null,
    description:
      "A compliance and benefits SaaS for US government contractors — payroll, company settings and wage determination flows.",
    recognitionCount: 8,
    recognisedFor: ["UX", "UI"],
    awards: [
      "NYX Awards — 3× Silver",
      "MUSE Creative Awards — 3× Silver",
      "Indigo Design Award — Silver + Bronze",
    ],
    caseStudyUrl: null,
    externalUrl: null,
  },
];

export type Organisation = {
  name: string;
  type: string;
  externalUrl: string | null;
  logo: string | null;
};

export const ORGANISATIONS: Organisation[] = [
  { name: "MUSE Creative Awards", type: "International creative awards", externalUrl: "https://creativeawards.com", logo: null },
  { name: "London Design Awards", type: "International design awards", externalUrl: null, logo: null },
  { name: "Indigo Design Award", type: "International design awards", externalUrl: null, logo: null },
  { name: "NYX Awards", type: "International design & marketing", externalUrl: null, logo: null },
  { name: "Davey Awards", type: "Creative awards for smaller studios", externalUrl: null, logo: null },
  { name: "NY Product Design Awards", type: "Product design awards", externalUrl: null, logo: null },
  { name: "French Design Awards", type: "International design awards", externalUrl: null, logo: null },
  { name: "CSS Design Awards", type: "Web design excellence", externalUrl: null, logo: null },
  { name: "CSS Winner", type: "Web design excellence", externalUrl: null, logo: null },
  { name: "CSS Nectar", type: "Web design gallery", externalUrl: null, logo: null },
  { name: "Design Nominees", type: "Web design gallery", externalUrl: null, logo: null },
];

export type AwardRecord = {
  id: string;
  awardName: string;
  organisation: string;
  project: string;
  year: number | null;
  recognition: string;
  externalUrl: string | null;
  featured: boolean;
};

export const AWARD_RECORDS: AwardRecord[] = [
  { id: "muse-u15-1", awardName: "MUSE Creative Awards", organisation: "MUSE Creative Awards", project: "Ukrainska 15", year: 2026, recognition: "Gold", externalUrl: null, featured: true },
  { id: "muse-u15-2", awardName: "MUSE Creative Awards", organisation: "MUSE Creative Awards", project: "Ukrainska 15", year: 2026, recognition: "Gold", externalUrl: null, featured: true },
  { id: "cssda-u15", awardName: "CSS Design Awards", organisation: "CSS Design Awards", project: "Ukrainska 15", year: 2026, recognition: "Best UI · Best UX · Best Innovation · Special Kudos", externalUrl: null, featured: true },
  { id: "csswinner-u15", awardName: "CSS Winner", organisation: "CSS Winner", project: "Ukrainska 15", year: 2026, recognition: "Star", externalUrl: null, featured: true },
  { id: "cssnectar-u15", awardName: "CSS Nectar", organisation: "CSS Nectar", project: "Ukrainska 15", year: 2026, recognition: "Site of the Day", externalUrl: null, featured: false },
  { id: "designnominees-u15", awardName: "Design Nominees", organisation: "Design Nominees", project: "Ukrainska 15", year: 2026, recognition: "Site of the Day", externalUrl: null, featured: false },
  { id: "french-u15", awardName: "French Design Awards", organisation: "French Design Awards", project: "Ukrainska 15", year: 2026, recognition: "Silver", externalUrl: null, featured: false },

  { id: "indigo-waypro", awardName: "Indigo Design Award", organisation: "Indigo Design Award", project: "WayPro", year: 2025, recognition: "2× Gold + Silver", externalUrl: null, featured: true },
  { id: "davey-waypro", awardName: "Davey Awards", organisation: "Davey Awards", project: "WayPro", year: 2025, recognition: "Gold — Best UI", externalUrl: null, featured: true },
  { id: "london-waypro", awardName: "London Design Awards", organisation: "London Design Awards", project: "WayPro", year: 2024, recognition: "Gold", externalUrl: null, featured: false },
  { id: "muse-waypro", awardName: "MUSE Creative Awards", organisation: "MUSE Creative Awards", project: "WayPro", year: 2025, recognition: "Silver", externalUrl: null, featured: false },

  { id: "london-bulksource", awardName: "London Design Awards", organisation: "London Design Awards", project: "BulkSource", year: 2024, recognition: "3× Silver", externalUrl: null, featured: false },
  { id: "nyx-bulksource", awardName: "NYX Awards", organisation: "NYX Awards", project: "BulkSource", year: 2024, recognition: "3× Silver", externalUrl: null, featured: false },
  { id: "indigo-bulksource", awardName: "Indigo Design Award", organisation: "Indigo Design Award", project: "BulkSource", year: 2024, recognition: "2× Silver + Bronze", externalUrl: null, featured: false },
  { id: "nyproduct-bulksource", awardName: "NY Product Design Awards", organisation: "NY Product Design Awards", project: "BulkSource", year: 2024, recognition: "Silver", externalUrl: null, featured: false },

  { id: "nyx-onsisoft", awardName: "NYX Awards", organisation: "NYX Awards", project: "OnsiSoft", year: 2025, recognition: "3× Silver", externalUrl: null, featured: false },
  { id: "muse-onsisoft", awardName: "MUSE Creative Awards", organisation: "MUSE Creative Awards", project: "OnsiSoft", year: 2025, recognition: "3× Silver", externalUrl: null, featured: false },
  { id: "indigo-onsisoft", awardName: "Indigo Design Award", organisation: "Indigo Design Award", project: "OnsiSoft", year: 2025, recognition: "Silver + Bronze", externalUrl: null, featured: false },
];
