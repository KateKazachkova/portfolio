import Binder, { type Spread } from "@/components/profile/Binder";
import { CvSheet, PhotoSheet, OverviewSheet, HistorySheet, TeachingSheet, SpecsSheet } from "@/components/profile/Sheets";

export const metadata = {
  title: "Profile – Kate Kazachkova",
  description: "The professional specification of the KATE™ model: overview, field history, teaching and specifications.",
};

// One document per sleeve; the binder opens on the CV and the photograph.
const SPREADS: Spread[] = [
  { label: "CV", left: <CvSheet />, right: <PhotoSheet /> },
  { label: "Overview", left: <OverviewSheet />, right: <HistorySheet from={0} to={1} sheet="04" /> },
  { label: "Field History", left: <HistorySheet from={1} to={3} sheet="05" />, right: <TeachingSheet /> },
  { label: "Specifications", left: <SpecsSheet /> },
];

export default function Profile() {
  return (
    <main className="min-h-screen px-4 md:px-8 py-10">
      <h1 className="sr-only">Profile – Kate Kazachkova</h1>
      <Binder spreads={SPREADS} />
    </main>
  );
}
