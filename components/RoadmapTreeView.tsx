"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
  fetchRoadmapTree,
  addRoadmapNode as dbAddRoadmapNode,
  updateRoadmapNodeDb,
  deleteRoadmapNodeDb,
} from "@/lib/db-client"
import type { Goal, RoadmapNode, RoadmapTree, NodeStatus, NodeType } from "@/lib/types"
import { getGoalBarColor } from "@/lib/constants"
import { TreeNode, AddNodeDialog, EditNodeDialog, DeleteConfirmDialog } from "./roadmap"

export default function RoadmapTreeView({ goal }: { goal: Goal }) {
  const [tree, setTree] = useState<RoadmapTree>({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showAdd, setShowAdd] = useState<{ parentId: string } | null>(null)
  const [showEdit, setShowEdit] = useState<RoadmapNode | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Shared form fields for both Add & Edit dialogs
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newType, setNewType] = useState<NodeType>("task")
  const [error, setError] = useState("")

  const goalColor: string = getGoalBarColor(goal.color)

  useEffect(() => {
    loadTree()
  }, [goal.id])

  async function loadTree() {
    try {
      const t = await fetchRoadmapTree(goal.id)
      setTree(t)
    } catch (e) {
      console.error("Failed to load roadmap tree:", e)
    } finally {
      setLoading(false)
    }
  }

  const rootIds = useMemo(() => {
    return Object.values(tree)
      .filter((n) => n.parentId === null)
      .sort((a, b) => a.order - b.order)
      .map((n) => n.id)
  }, [tree])

  const stats = useMemo(() => {
    const nodes = Object.values(tree)
    const total = nodes.filter((n) => n.parentId !== null).length
    const done = nodes.filter((n) => n.parentId !== null && n.status === "completed").length
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
  }, [tree])

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleStatusChange = useCallback(
    async (nodeId: string, status: NodeStatus) => {
      await updateRoadmapNodeDb(nodeId, { status })
      await loadTree()
    },
    [goal.id],
  )

  // ── Add ──
  function openAdd(parentId: string) {
    setShowAdd({ parentId })
    setNewName("")
    setNewDesc("")
    setNewType("task")
    setError("")
  }

  async function handleAdd() {
    if (!newName.trim()) { setError("Name is required"); return }
    if (!showAdd) return
    const siblings = Object.values(tree).filter((n) => n.parentId === showAdd.parentId)
    await dbAddRoadmapNode(goal.id, {
      type: newType, name: newName.trim(), description: newDesc.trim(),
      goalId: goal.id, parentId: showAdd.parentId, children: [],
      status: "pending", order: siblings.length,
    })
    setExpanded((prev) => new Set(prev).add(showAdd.parentId))
    await loadTree()
    setShowAdd(null)
  }

  // ── Edit ──
  function openEdit(node: RoadmapNode) {
    setShowEdit(node)
    setNewName(node.name)
    setNewDesc(node.description)
    setNewType(node.type)
    setError("")
  }

  async function handleEdit() {
    if (!newName.trim()) { setError("Name is required"); return }
    if (!showEdit) return
    await updateRoadmapNodeDb(showEdit.id, {
      name: newName.trim(), description: newDesc.trim(), type: newType,
    })
    await loadTree()
    setShowEdit(null)
  }

  // ── Delete ──
  async function handleDelete(nodeId: string) {
    await deleteRoadmapNodeDb(nodeId)
    await loadTree()
    setDeleteConfirm(null)
  }

  async function handleAddRoot() {
    const rootNodes = Object.values(tree).filter((n) => n.parentId === null)
    await dbAddRoadmapNode(goal.id, {
      type: "phase", name: "New Phase", description: "",
      goalId: goal.id, parentId: null, children: [],
      status: "pending", order: rootNodes.length,
    })
    await loadTree()
  }

  if (loading) {
    return <div className="text-[12px] text-[hsl(var(--muted))] py-4 text-center">Loading roadmap...</div>
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: goalColor }} />
          <span className="text-[12px] font-medium text-[hsl(var(--body-strong))]">Roadmap</span>
          {stats.total > 0 && (
            <span className="text-[10px] text-[hsl(var(--muted))]">
              {stats.done}/{stats.total} · {stats.pct}%
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handleAddRoot}
          className="h-6 text-[11px] px-2 gap-1 text-[hsl(var(--muted))] hover:text-[hsl(var(--body-strong))]">
          <Plus size={11} /> Add phase
        </Button>
      </div>

      {/* Progress bar */}
      {stats.total > 0 && (
        <div className="h-1 bg-[hsl(var(--surface-strong))] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${stats.pct}%`, background: goalColor }} />
        </div>
      )}

      {/* Tree */}
      {rootIds.length === 0 ? (
        <div onClick={handleAddRoot}
          className="border border-dashed border-[hsl(var(--hairline-strong))] rounded-[10px] p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-[hsl(var(--body))]/30 hover:bg-[hsl(var(--canvas-soft))] transition-all">
          <Plus size={14} className="text-[hsl(var(--muted))]" />
          <p className="text-[12px] text-[hsl(var(--muted))]">Add your first phase</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {rootIds.map((id) => (
            <TreeNode key={id} nodeId={id} tree={tree} goalColor={goalColor} depth={0}
              expanded={expanded} onToggle={toggleExpand}
              onStatusChange={handleStatusChange} onAddChild={openAdd}
              onEdit={openEdit} onDelete={setDeleteConfirm} />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddNodeDialog open={showAdd !== null} onClose={() => setShowAdd(null)}
        newName={newName} newDesc={newDesc} newType={newType} error={error}
        onNameChange={setNewName} onDescChange={setNewDesc}
        onTypeChange={setNewType} onAdd={handleAdd} />

      <EditNodeDialog open={showEdit !== null} onClose={() => setShowEdit(null)}
        newName={newName} newDesc={newDesc} newType={newType} error={error}
        onNameChange={setNewName} onDescChange={setNewDesc}
        onTypeChange={setNewType} onSave={handleEdit} />

      <DeleteConfirmDialog open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm !== null && handleDelete(deleteConfirm)} />
    </div>
  )
}