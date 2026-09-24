import type { Spread } from "./Binder";
import { CvSheet, PhotoSheet, OverviewSheet, HistorySheet, TeachingSheet, SpecsSheet, BudSheet, BudEvidenceSheet, BudCertificate,
  ClusterSheet, ClusterCertificates, ClusterTalksSheet, IxdfSheet, IxdfLetter, IxdfEvidenceSheet } from "./Sheets";

// One document per sleeve; the binder opens on the CV and the photograph.
export const SPREADS: Spread[] = [
  { label: "CV", left: <CvSheet />, right: <PhotoSheet /> },
  { label: "Overview", left: <OverviewSheet />, right: <HistorySheet from={0} to={1} sheet="04" /> },
  { label: "Field History", left: <HistorySheet from={1} to={3} sheet="05" />, right: <TeachingSheet /> },
  // behind a divider with БУДЬ's logo on its tab, standing above the sleeves
  { label: "БУДЬ", left: <BudSheet />, right: <BudEvidenceSheet />, hang: <BudCertificate />, tab: { src: "/profile/bud/logo.webp", alt: "БУДЬ" } },
  { label: "IT Cluster", left: <ClusterSheet />, right: <ClusterTalksSheet />, hang: <ClusterCertificates />, tab: { src: "/profile/itc/logo.webp", alt: "Kharkiv IT Cluster" } },
  { label: "IxDF", left: <IxdfSheet />, right: <IxdfEvidenceSheet />, hang: <IxdfLetter />, tab: { src: "/profile/ixdf/logo.webp", alt: "IxDF Kharkiv" } },
  { label: "Specifications", left: <SpecsSheet /> },
];
