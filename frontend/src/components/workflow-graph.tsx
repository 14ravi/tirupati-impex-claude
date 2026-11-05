"use client";

import { Background, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import type { Task } from "@/lib/workflows";

type TaskNodeData = { name: string; detail: string; active: boolean };
type TaskNode = Node<TaskNodeData, "task">;

function TaskNodeView({ data }: NodeProps<TaskNode>) {
  return (
    <div
      className={`w-40 cursor-pointer rounded-lg border bg-surface px-3 py-2.5 shadow-sm transition-colors ${
        data.active ? "border-accent ring-2 ring-accent/25" : "border-line hover:border-accent"
      }`}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} className="!border-0 !bg-transparent" />
      <p className="text-sm font-medium text-fg">{data.name}</p>
      <p className="mt-0.5 text-xs text-muted">{data.detail}</p>
      <Handle type="source" position={Position.Right} isConnectable={false} className="!border-0 !bg-transparent" />
    </div>
  );
}

const nodeTypes = { task: TaskNodeView };

/** The workflow's tasks as a left-to-right graph. Clicking a task selects it. */
export function WorkflowGraph({
  tasks,
  counts,
  selected,
  onSelect,
}: {
  tasks: Task[];
  counts: Record<string, number> | null;
  selected: string | null;
  onSelect: (taskKey: string) => void;
}) {
  const nodes = useMemo<TaskNode[]>(
    () =>
      tasks.map((task, i) => ({
        id: task.key,
        type: "task",
        position: { x: i * 190, y: 0 },
        data: {
          name: task.name,
          detail:
            counts?.[task.key] !== undefined
              ? `${counts[task.key]} left after this step`
              : `${task.params.length} ${task.params.length === 1 ? "setting" : "settings"}`,
          active: task.key === selected,
        },
      })),
    [tasks, counts, selected],
  );

  const edges = useMemo<Edge[]>(
    () => tasks.slice(1).map((task, i) => ({ id: `${tasks[i].key}-${task.key}`, source: tasks[i].key, target: task.key })),
    [tasks],
  );

  return (
    <div className="h-48 overflow-hidden rounded-lg border border-line bg-surface">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onSelect(node.id)}
        fitView
        fitViewOptions={{ padding: 0.08, maxZoom: 1 }}
        minZoom={0.3}
        maxZoom={1}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        preventScrolling={false}
        colorMode="system"
      >
        <Background gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}
