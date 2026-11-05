import { ChevronRight } from "lucide-react";
import { Fragment } from "react";

/** A small left-to-right diagram of a workflow's tasks, for cards. */
export function TaskChain({ tasks }: { tasks: string[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-1" aria-label="Steps">
      {tasks.map((task, i) => (
        <Fragment key={task}>
          {i > 0 && <ChevronRight className="size-3 text-muted" aria-hidden />}
          <li className="rounded border border-line bg-bg px-1.5 py-0.5 text-xs text-muted">{task}</li>
        </Fragment>
      ))}
    </ol>
  );
}
