import { Circle, Loader2, Check } from "lucide-react"
import type { RoadmapNode, NodeStatus, NodeType } from "@/lib/types"

export const STATUS_CONFIG: Record<
  NodeStatus,
  { color: string; bg: string; icon: typeof Circle; label: string }
> = {
  pending: {
    color: "text-[hsl(var(--muted))]",
    bg: "bg-[hsl(var(--surface-strong))]",
    icon: Circle,
    label: "Pending",
  },
  "in-progress": {
    color: "text-[hsl(var(--timeline-thinking))]",
    bg: "bg-[hsl(var(--timeline-thinking))]/20",
    icon: Loader2,
    label: "In Progress",
  },
  completed: {
    color: "text-[hsl(var(--success))]",
    bg: "bg-[hsl(var(--success))]/15",
    icon: Check,
    label: "Completed",
  },
}

export const TYPE_LABELS: Record<NodeType, string> = {
  phase: "Phase",
  objective: "Objective",
  task: "Task",
}
