"use client"

import { ChevronRight, ChevronDown, Plus, Trash2, Edit2, Circle } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { STATUS_CONFIG } from "./StatusConfig"
import type { RoadmapNode, RoadmapTree, NodeStatus } from "@/lib/types"

interface TreeNodeProps {
  nodeId: string
  tree: RoadmapTree
  goalColor: string
  depth: number
  expanded: Set<string>
  onToggle: (id: string) => void
  onStatusChange: (id: string, status: NodeStatus) => void
  onAddChild: (parentId: string) => void
  onEdit: (node: RoadmapNode) => void
  onDelete: (id: string) => void
}

export function TreeNode({
  nodeId,
  tree,
  goalColor,
  depth,
  expanded,
  onToggle,
  onStatusChange,
  onAddChild,
  onEdit,
  onDelete,
}: TreeNodeProps) {
  const node = tree[nodeId]
  if (!node) return null

  const config = STATUS_CONFIG[node.status]
  const StatusIcon = config.icon
  const hasChildren = node.children.length > 0
  const isExpanded = expanded.has(nodeId)
  const indent = depth * 20

  const completedChildren = node.children.filter(
    (id) => tree[id]?.status === "completed",
  ).length
  const totalChildren = node.children.length
  const progressPct =
    totalChildren > 0
      ? Math.round((completedChildren / totalChildren) * 100)
      : 0

  return (
    <div>
      <div
        className="group flex items-center gap-1.5 py-1.5 px-2 rounded-[8px] hover:bg-[hsl(var(--canvas-soft))] transition-colors"
        style={{ marginLeft: `${indent}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => onToggle(nodeId)}
            className="w-5 h-5 flex items-center justify-center shrink-0 text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] transition-colors"
          >
            {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        ) : (
          <div className="w-5 shrink-0" />
        )}

        <button
          onClick={() => hasChildren && onToggle(nodeId)}
          className="flex items-center gap-1.5 flex-1 min-w-0"
        >
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0 transition-all"
            style={{
              background:
                node.status === "completed"
                  ? "hsl(var(--success))"
                  : node.status === "in-progress"
                    ? goalColor
                    : "hsl(var(--hairline-strong))",
              boxShadow:
                node.status === "in-progress"
                  ? `0 0 6px ${goalColor}40`
                  : "none",
            }}
          />
          <span
            className={`text-[12px] truncate ${
              node.status === "completed"
                ? "line-through text-[hsl(var(--muted))]"
                : "text-[hsl(var(--body-strong))]"
            }`}
          >
            {node.name}
          </span>
          {hasChildren && (
            <span className="text-[10px] text-[hsl(var(--muted))] shrink-0">
              {completedChildren}/{totalChildren}
            </span>
          )}
        </button>

        {hasChildren && progressPct > 0 && progressPct < 100 && (
          <div className="w-12 h-1 bg-[hsl(var(--surface-strong))] rounded-full overflow-hidden shrink-0">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: goalColor }}
            />
          </div>
        )}

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Select
            value={node.status}
            onValueChange={(v) => onStatusChange(nodeId, v as NodeStatus)}
          >
            <SelectTrigger className="w-5 h-5 p-0 border-0 bg-transparent hover:bg-[hsl(var(--surface-strong))] rounded transition-colors [&>svg]:hidden">
              <StatusIcon size={12} className={config.color} />
            </SelectTrigger>
            <SelectContent align="end" className="w-32">
              {(Object.keys(STATUS_CONFIG) as NodeStatus[]).map((s) => {
                const Icon = STATUS_CONFIG[s].icon
                return (
                  <SelectItem key={s} value={s} className="text-[12px]">
                    <span className="flex items-center gap-1.5">
                      <Icon size={11} className={STATUS_CONFIG[s].color} />
                      {STATUS_CONFIG[s].label}
                    </span>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <button
            onClick={() => onAddChild(nodeId)}
            className="w-5 h-5 flex items-center justify-center rounded text-[hsl(var(--muted))] hover:text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/10 transition-colors"
            aria-label="Add child"
          >
            <Plus size={11} />
          </button>
          <button
            onClick={() => onEdit(node)}
            className="w-5 h-5 flex items-center justify-center rounded text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))] hover:bg-[hsl(var(--surface-strong))] transition-colors"
            aria-label="Edit"
          >
            <Edit2 size={11} />
          </button>
          <button
            onClick={() => onDelete(nodeId)}
            className="w-5 h-5 flex items-center justify-center rounded text-[hsl(var(--muted))] hover:text-[hsl(var(--error))] hover:bg-[hsl(var(--error))]/10 transition-colors"
            aria-label="Delete"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="relative">
          <div
            className="absolute top-0 bottom-0 w-px bg-[hsl(var(--hairline))]"
            style={{ left: `${indent + 10}px` }}
          />
          {node.children
            .sort((a, b) => (tree[a]?.order ?? 0) - (tree[b]?.order ?? 0))
            .map((childId) => (
              <TreeNode
                key={childId}
                nodeId={childId}
                tree={tree}
                goalColor={goalColor}
                depth={depth + 1}
                expanded={expanded}
                onToggle={onToggle}
                onStatusChange={onStatusChange}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
        </div>
      )}
    </div>
  )
}
