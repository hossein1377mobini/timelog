"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Edit2,
  Check,
  Circle,
  Loader2,
  X,
} from "lucide-react";
import {
  getRoadmapTree,
  addRoadmapNode,
  updateRoadmapNode,
  deleteRoadmapNode,
  migratePhasesToTree,
  dispatchStorageEvent,
} from "@/lib/storage";
import type {
  Goal,
  RoadmapNode,
  RoadmapTree,
  NodeStatus,
  NodeType,
} from "@/lib/types";

const STATUS_CONFIG: Record<
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
};

const TYPE_LABELS: Record<NodeType, string> = {
  phase: "Phase",
  objective: "Objective",
  task: "Task",
};

import { GOAL_BAR_MAP } from "@/lib/constants"

const GOAL_COLORS = GOAL_BAR_MAP

interface TreeNodeProps {
  nodeId: string;
  tree: RoadmapTree;
  goalColor: string;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onStatusChange: (id: string, status: NodeStatus) => void;
  onAddChild: (parentId: string) => void;
  onEdit: (node: RoadmapNode) => void;
  onDelete: (id: string) => void;
}

function TreeNode({
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
  const node = tree[nodeId];
  if (!node) return null;

  const config = STATUS_CONFIG[node.status];
  const StatusIcon = config.icon;
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(nodeId);
  const indent = depth * 20;

  const completedChildren = node.children.filter(
    (id) => tree[id]?.status === "completed",
  ).length;
  const totalChildren = node.children.length;
  const progressPct =
    totalChildren > 0
      ? Math.round((completedChildren / totalChildren) * 100)
      : 0;

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
            {isExpanded ? (
              <ChevronDown size={13} />
            ) : (
              <ChevronRight size={13} />
            )}
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
              {(Object.keys(STATUS_CONFIG) as NodeStatus[]).map((s) => (
                <SelectItem key={s} value={s} className="text-[12px]">
                  <span className="flex items-center gap-1.5">
                    {(() => {
                      const Icon = STATUS_CONFIG[s].icon;
                      return (
                        <Icon size={11} className={STATUS_CONFIG[s].color} />
                      );
                    })()}
                    {STATUS_CONFIG[s].label}
                  </span>
                </SelectItem>
              ))}
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
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function RoadmapTreeView({ goal }: { goal: Goal }) {
  const [tree, setTree] = useState<RoadmapTree>(() => {
    migratePhasesToTree(goal.id);
    return getRoadmapTree(goal.id);
  });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState<{ parentId: string } | null>(null);
  const [showEdit, setShowEdit] = useState<RoadmapNode | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<NodeType>("task");
  const [error, setError] = useState("");

  const goalColor = GOAL_COLORS[goal.color] ?? GOAL_COLORS.Purple;

  const rootIds = useMemo(() => {
    return Object.values(tree)
      .filter((n) => n.parentId === null)
      .sort((a, b) => a.order - b.order)
      .map((n) => n.id);
  }, [tree]);

  const stats = useMemo(() => {
    const nodes = Object.values(tree);
    const total = nodes.filter((n) => n.parentId !== null).length;
    const done = nodes.filter(
      (n) => n.parentId !== null && n.status === "completed",
    ).length;
    return {
      total,
      done,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  }, [tree]);

  function reload() {
    setTree(getRoadmapTree(goal.id));
  }

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleStatusChange = useCallback(
    (nodeId: string, status: NodeStatus) => {
      updateRoadmapNode(goal.id, nodeId, { status });
      reload();
      dispatchStorageEvent();
    },
    [goal.id],
  );

  function openAdd(parentId: string) {
    setShowAdd({ parentId });
    setNewName("");
    setNewDesc("");
    setNewType("task");
    setError("");
  }

  function handleAdd() {
    if (!newName.trim()) {
      setError("Name is required");
      return;
    }
    if (!showAdd) return;
    const siblings = Object.values(tree).filter(
      (n) => n.parentId === showAdd.parentId,
    );
    addRoadmapNode(goal.id, {
      type: newType,
      name: newName.trim(),
      description: newDesc.trim(),
      goalId: goal.id,
      parentId: showAdd.parentId,
      children: [],
      status: "pending",
      order: siblings.length,
    });
    setExpanded((prev) => new Set(prev).add(showAdd.parentId));
    reload();
    setShowAdd(null);
    dispatchStorageEvent();
  }

  function openEdit(node: RoadmapNode) {
    setShowEdit(node);
    setNewName(node.name);
    setNewDesc(node.description);
    setNewType(node.type);
    setError("");
  }

  function handleEdit() {
    if (!newName.trim()) {
      setError("Name is required");
      return;
    }
    if (!showEdit) return;
    updateRoadmapNode(goal.id, showEdit.id, {
      name: newName.trim(),
      description: newDesc.trim(),
      type: newType,
    });
    reload();
    setShowEdit(null);
    dispatchStorageEvent();
  }

  function handleDelete(nodeId: string) {
    deleteRoadmapNode(goal.id, nodeId);
    reload();
    setDeleteConfirm(null);
    dispatchStorageEvent();
  }

  function handleAddRoot() {
    const rootNodes = Object.values(tree).filter((n) => n.parentId === null);
    addRoadmapNode(goal.id, {
      type: "phase",
      name: "New Phase",
      description: "",
      goalId: goal.id,
      parentId: null,
      children: [],
      status: "pending",
      order: rootNodes.length,
    });
    reload();
    dispatchStorageEvent();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: goalColor }}
          />
          <span className="text-[12px] font-medium text-[hsl(var(--body-strong))]">
            Roadmap
          </span>
          {stats.total > 0 && (
            <span className="text-[10px] text-[hsl(var(--muted))]">
              {stats.done}/{stats.total} · {stats.pct}%
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddRoot}
          className="h-6 text-[11px] px-2 gap-1 text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))]"
        >
          <Plus size={11} />
          Add phase
        </Button>
      </div>

      {stats.total > 0 && (
        <div className="h-1 bg-[hsl(var(--surface-strong))] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${stats.pct}%`, background: goalColor }}
          />
        </div>
      )}

      {rootIds.length === 0 ? (
        <div
          onClick={handleAddRoot}
          className="border border-dashed border-[hsl(var(--hairline-strong))] rounded-[10px] p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-[hsl(var(--body))]/30 hover:bg-[hsl(var(--canvas-soft))] transition-all"
        >
          <Plus size={14} className="text-[hsl(var(--muted))]" />
          <p className="text-[12px] text-[hsl(var(--muted))]">
            Add your first phase
          </p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {rootIds.map((id) => (
            <TreeNode
              key={id}
              nodeId={id}
              tree={tree}
              goalColor={goalColor}
              depth={0}
              expanded={expanded}
              onToggle={toggleExpand}
              onStatusChange={handleStatusChange}
              onAddChild={openAdd}
              onEdit={openEdit}
              onDelete={setDeleteConfirm}
            />
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd !== null} onOpenChange={() => setShowAdd(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold">
              Add node
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                Type
              </label>
              <Select
                value={newType}
                onValueChange={(v) => setNewType(v as NodeType)}
              >
                <SelectTrigger className="h-9 text-[14px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phase">Phase</SelectItem>
                  <SelectItem value="objective">Objective</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                Name
              </label>
              <Input
                value={newName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setNewName(e.target.value);
                  setError("");
                }}
                placeholder="e.g. Literature Review"
                className="h-9 text-[14px]"
                autoFocus
              />
              {error && (
                <p className="text-[11px] text-[hsl(var(--error))]">{error}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                Description
              </label>
              <Textarea
                value={newDesc}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNewDesc(e.target.value)
                }
                placeholder="Optional details"
                className="resize-none h-16 text-[14px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAdd}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEdit !== null} onOpenChange={() => setShowEdit(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold">
              Edit node
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                Type
              </label>
              <Select
                value={newType}
                onValueChange={(v) => setNewType(v as NodeType)}
              >
                <SelectTrigger className="h-9 text-[14px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phase">Phase</SelectItem>
                  <SelectItem value="objective">Objective</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                Name
              </label>
              <Input
                value={newName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setNewName(e.target.value);
                  setError("");
                }}
                className="h-9 text-[14px]"
              />
              {error && (
                <p className="text-[11px] text-[hsl(var(--error))]">{error}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[hsl(var(--muted))]">
                Description
              </label>
              <Textarea
                value={newDesc}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNewDesc(e.target.value)
                }
                className="resize-none h-16 text-[14px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowEdit(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleEdit}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold">
              Delete node?
            </DialogTitle>
          </DialogHeader>
          <p className="text-[14px] text-[hsl(var(--muted))] py-1">
            This will remove the node and all its children.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                deleteConfirm !== null && handleDelete(deleteConfirm)
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
