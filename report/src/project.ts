/**
 * Facts about the project shared by every report and presenter guide.
 * Fill the TODO fields once; every document picks them up.
 */
export const project = {
  title: "Akıllı Telefon Sensörleri Kullanılarak Nöral Ağlarla İnsan Aktivitesi Tanıma",
  subtitle: "Human Activity Recognition (HAR) · accelerometer ve gyroscope verileriyle",
  course: "BİL 512 01 Yapay Sinir Ağları",
  dataset: {
    name: "Smartphone-Based Recognition of Human Activities and Postural Transitions",
    source: "UCI Machine Learning Repository",
    url: "https://archive.ics.uci.edu/dataset/341/smartphone+based+recognition+of+human+activities+and+postural+transitions",
  },
  authors: ["Erdem Göksel"],
  studentId: "261402103",
  /** TODO: dersi veren öğretim üyesi. */
  instructor: "TODO: Öğretim üyesi",
  sensors: ["Accelerometer", "Gyroscope"],
  models: ["MLP", "1D CNN", "LSTM", "GRU"],
  metrics: ["Accuracy", "Precision", "Recall", "F1-score", "Confusion Matrix"],
} as const;

export type DeliverableKind = "presentation" | "report";

export interface Deliverable {
  id: string;
  kind: DeliverableKind;
  title: string;
  /** Presentation date(s) or submission deadline, as shown to people. */
  due: string;
  /** Presentations only. */
  duration?: string;
}

/** Course deliverables in order; ids match deck ids (slides) and report ids (report). */
export const deliverables: Deliverable[] = [
  {
    id: "proposal",
    kind: "presentation",
    title: "1. Sunum – Project Proposal",
    due: "19.10.2026",
    duration: "5–10 dakika",
  },
  {
    id: "literature-review",
    kind: "report",
    title: "Literature Review Raporu",
    due: "01.11.2026 23:55",
  },
  {
    id: "literature-review",
    kind: "presentation",
    title: "2. Sunum – Literature Review",
    due: "02.11.2026 veya 09.11.2026",
    duration: "15–20 dakika",
  },
  {
    id: "final-results",
    kind: "report",
    title: "Final Results Raporu",
    due: "29.11.2026 23:55",
  },
  {
    id: "final-results",
    kind: "presentation",
    title: "3. Sunum – Final Results",
    due: "30.11.2026 veya 07.12.2026",
    duration: "20–30 dakika",
  },
];

export function deliverable(id: string, kind: DeliverableKind): Deliverable {
  const found = deliverables.find((d) => d.id === id && d.kind === kind);
  if (!found) throw new Error(`No ${kind} deliverable "${id}"`);
  return found;
}
