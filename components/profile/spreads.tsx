import type { Spread } from "./Binder";
import { CvSheet, PhotoSheet, OverviewSheet, HistorySheet, TeachingSheet, SpecsSheet } from "./Sheets";

// One document per sleeve; the binder opens on the CV and the photograph.
export const SPREADS: Spread[] = [
  { label: "CV", left: <CvSheet />, right: <PhotoSheet /> },
  { label: "Overview", left: <OverviewSheet />, right: <HistorySheet from={0} to={1} sheet="04" /> },
  { label: "Field History", left: <HistorySheet from={1} to={3} sheet="05" />, right: <TeachingSheet /> },
  { label: "Specifications", left: <SpecsSheet /> },
];
