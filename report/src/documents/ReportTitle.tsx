import { TitlePage } from "../pdf";
import { deliverable, project } from "../project";

/** Title page shared by every report: project, authors, course and deadline. */
export function ReportTitle({ id }: { id: string }) {
  const d = deliverable(id, "report");
  return (
    <TitlePage
      eyebrow={d.title}
      title={project.title}
      subtitle={project.subtitle}
      meta={[
        ["Hazırlayanlar", project.authors.join(", ")],
        ["Ders", project.course],
        ["Öğretim üyesi", project.instructor],
        ["Teslim tarihi", d.due],
      ]}
    />
  );
}
