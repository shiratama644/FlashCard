import { Badge } from "@/components/ui/badge";

type ProjectCardProps = {
  title: string;
  description?: string;
  categoryName: string;
  cardCount: number;
};

export function ProjectCard({ title, description, categoryName, cardCount }: ProjectCardProps) {
  return (
    <article className="rounded-2xl border border-white/20 bg-white/10 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Badge>{categoryName}</Badge>
        <span className="text-xs text-white/70">{cardCount} cards</span>
      </div>
      <h2 className="text-lg font-extrabold">{title}</h2>
      {description ? <p className="mt-2 text-sm text-white/80">{description}</p> : null}
    </article>
  );
}
