"use client"

import type { Dispatch, ReactNode, SetStateAction } from "react"
import { Fragment } from "react"
import { Plus, Trash2, Edit2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import type {
  ConferenceProgramItem,
  ConferenceSession,
  InviteStatus,
  ProgramItemType,
} from "@/types"
import { programItemAllowsDuration } from "@/lib/conferences/program-item-duration"
import { PROGRAM_ITEM_LABELS } from "@/lib/conferences/program-item-labels"
import { englishMenuTitleCase } from "@/lib/utils/english-menu-title-case"
import {
  isStandardLagFixedProgramItemType,
  isStandardOpeningItemType,
  sessionUsesStandardOpeningBlock,
  sortProgramItemsByOrder,
} from "@/lib/conferences/standard-opening-block"

const INVITE_MOBILE_STYLES: Record<
  InviteStatus,
  { bg: string; text: string; label: string }
> = {
  not_invited: { bg: "bg-gray-100", text: "text-gray-600", label: "Not Invited" },
  invited: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Invited" },
  accepted: { bg: "bg-green-100", text: "text-green-700", label: "Accepted" },
  declined: { bg: "bg-red-100", text: "text-red-700", label: "Declined" },
  completed: { bg: "bg-blue-100", text: "text-blue-700", label: "Completed" },
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-2 text-sm">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <div className="mt-0.5">{children}</div>
    </div>
  )
}

function slotDiffText(session: ConferenceSession, totalMin: number): ReactNode {
  if (!session.start_time || !session.end_time) return null
  const [sh, sm] = session.start_time.split(":").map(Number)
  const [eh, em] = session.end_time.split(":").map(Number)
  const allotted = eh * 60 + em - (sh * 60 + sm)
  const diff = allotted - totalMin
  return diff !== 0 ? (
    <span className={diff > 0 ? "text-green-700" : "text-red-600"}>
      {diff > 0 ? "+" : ""}
      {diff} min {diff > 0 ? "remaining" : "over"} (vs {allotted}-min slot)
    </span>
  ) : (
    <span className="text-green-700">Exactly on time for {allotted}-min slot</span>
  )
}

export function ConferenceProgramMobile({
  session,
  itemsUnsorted,
  totalMin,
  editingItem,
  setEditingItem,
  editForm,
  setEditForm,
  presidencyItemForm,
  setPresidencyItemForm,
  addingPresidencySessionId,
  setAddingPresidencySessionId,
  patchProgramItem,
  deleteProgramItem,
  moveProgramItem,
  cycleInviteStatus,
  addProgramItem,
  addPresidencyItem,
  inputClass,
  selectClass,
}: {
  session: ConferenceSession
  itemsUnsorted: ConferenceProgramItem[]
  totalMin: number
  editingItem: string | null
  setEditingItem: Dispatch<SetStateAction<string | null>>
  editForm: Partial<ConferenceProgramItem>
  setEditForm: Dispatch<SetStateAction<Partial<ConferenceProgramItem>>>
  presidencyItemForm: { topic: string; notes: string }
  setPresidencyItemForm: Dispatch<SetStateAction<{ topic: string; notes: string }>>
  addingPresidencySessionId: string | null
  setAddingPresidencySessionId: Dispatch<SetStateAction<string | null>>
  patchProgramItem: (itemId: string, updates: Partial<ConferenceProgramItem>) => Promise<void>
  deleteProgramItem: (itemId: string) => Promise<void>
  moveProgramItem: (
    sessionId: string,
    itemId: string,
    direction: "up" | "down"
  ) => Promise<void>
  cycleInviteStatus: (item: ConferenceProgramItem) => Promise<void>
  addProgramItem: (sessionId: string) => Promise<void>
  addPresidencyItem: (sessionId: string) => Promise<void>
  inputClass: string
  selectClass: string
}) {
  const isPresidencyMeeting = session.session_type === "presidency_meeting"
  const sortedProgramItems = sortProgramItemsByOrder(itemsUnsorted)
  const lag = sessionUsesStandardOpeningBlock(session.session_type)

  const firstClosingIdx =
    !isPresidencyMeeting && lag
      ? sortedProgramItems.findIndex((i) => i.item_type === "closing_hymn")
      : -1
  const lastClosingHymnIdx = sortedProgramItems.map((i) => i.item_type).lastIndexOf("closing_hymn")
  const lastBenedictionIdx = sortedProgramItems.map((i) => i.item_type).lastIndexOf("benediction")

  const typeOptionsForAdd = Object.entries(PROGRAM_ITEM_LABELS).filter(
    ([val]) => !isStandardLagFixedProgramItemType(val as ProgramItemType)
  )

  if (isPresidencyMeeting) {
    return (
      <div className="space-y-3 pb-4 lg:hidden">
        {sortedProgramItems.map((item, idx) => {
          const isEditing = editingItem === item.id
          if (isEditing) {
            return (
              <div key={item.id} className="space-y-2 rounded-xl border border-indigo-300 bg-indigo-50 p-4">
                <input
                  type="text"
                  value={editForm.topic ?? item.topic ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, topic: e.target.value }))}
                  onBlur={(e) =>
                    void patchProgramItem(item.id, { topic: e.target.value.trim() || undefined })}
                  placeholder="Topic"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={editForm.notes ?? item.notes ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                  onBlur={(e) =>
                    void patchProgramItem(item.id, { notes: e.target.value.trim() || undefined })}
                  placeholder="Notes"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null)
                    setEditForm({})
                  }}
                  className="text-green-700"
                >
                  <Check className="h-5 w-5" />
                </button>
              </div>
            )
          }
          return (
            <div key={item.id} className="rounded-xl border border-blue-100 bg-blue-50/30 p-4 shadow-sm">
              <FieldRow label="Topic">{item.topic || item.hymn_number || "—"}</FieldRow>
              <FieldRow label="Notes">
                <p className="whitespace-pre-wrap text-gray-600">{item.notes || "—"}</p>
              </FieldRow>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-blue-100 pt-3">
                <button
                  type="button"
                  onClick={() => moveProgramItem(session.id, item.id, "up")}
                  disabled={idx === 0}
                  className="rounded-md border bg-white px-2 py-1 text-xs disabled:opacity-30"
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => moveProgramItem(session.id, item.id, "down")}
                  disabled={idx === sortedProgramItems.length - 1}
                  className="rounded-md border bg-white px-2 py-1 text-xs disabled:opacity-30"
                >
                  Down
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(item.id)
                    setEditForm({})
                  }}
                  className="text-indigo-600"
                  aria-label="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => deleteProgramItem(item.id)} className="text-red-500" aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
        <div className="rounded-lg border bg-gray-50 p-4">
          {addingPresidencySessionId === session.id ? (
            <div className="space-y-2">
              <input
                type="text"
                value={presidencyItemForm.topic}
                onChange={(e) => setPresidencyItemForm({ ...presidencyItemForm, topic: e.target.value })}
                placeholder="Topic"
                className={inputClass}
              />
              <input
                type="text"
                value={presidencyItemForm.notes}
                onChange={(e) =>
                  setPresidencyItemForm({ ...presidencyItemForm, notes: e.target.value })
                }
                placeholder="Notes"
                className={inputClass}
              />
              <div className="flex gap-2 pt-2">
                <Button onClick={() => addPresidencyItem(session.id)} size="sm">
                  Add
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAddingPresidencySessionId(null)
                    setPresidencyItemForm({ topic: "", notes: "" })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full justify-center" onClick={() => setAddingPresidencySessionId(session.id)}>
              <Plus className="mr-2 h-4 w-4" /> Add item
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 pb-4 lg:hidden">
      {sortedProgramItems.map((item, idx) => {
        const isEditing = editingItem === item.id
        const showAddBefore =
          lag && firstClosingIdx >= 0 && idx === firstClosingIdx

        const addSlot = showAddBefore ? (
          <button
            key={`${session.id}-add-slot-m`}
            type="button"
            onClick={() => addProgramItem(session.id)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 py-3 text-sm font-medium text-indigo-700"
          >
            <Plus className="h-4 w-4" /> Add item (before closing)
          </button>
        ) : null

        const statusStyle = INVITE_MOBILE_STYLES[item.invite_status]
        const isBreakout = item.item_type === "breakout"
        const isDiscussion = item.item_type === "discussion"
        const isOpeningFixed = lag && isStandardOpeningItemType(item.item_type)
        const isLastClosingHymn = item.item_type === "closing_hymn" && idx === lastClosingHymnIdx
        const isLastBenediction = item.item_type === "benediction" && idx === lastBenedictionIdx
        const isClosingFixed = isLastClosingHymn || isLastBenediction
        const isProtected = isOpeningFixed || isClosingFixed
        const canMove = !isProtected

        if (isEditing) {
          return (
            <Fragment key={item.id}>
              {addSlot}
              <div className="space-y-2 rounded-xl border border-indigo-300 bg-indigo-50 p-4">
                <p className="text-xs font-medium text-gray-500">Row {idx + 1}</p>
                {lag &&
                isStandardLagFixedProgramItemType(editForm.item_type || item.item_type) ? (
                  <span className="font-medium">
                    {PROGRAM_ITEM_LABELS[editForm.item_type || item.item_type] ||
                      (editForm.item_type || item.item_type)}
                  </span>
                ) : (
                  <select
                    value={editForm.item_type || item.item_type}
                    onChange={(e) => {
                      const v = e.target.value as ProgramItemType
                      setEditForm((f) => ({ ...f, item_type: v }))
                      const patch: Partial<ConferenceProgramItem> = { item_type: v }
                      if (!programItemAllowsDuration(v)) patch.duration_minutes = 0
                      void patchProgramItem(item.id, patch)
                    }}
                    className={`${selectClass} w-full`}
                  >
                    {typeOptionsForAdd.map(([val, lbl]) => (
                      <option key={val} value={val}>
                        {englishMenuTitleCase(lbl)}
                      </option>
                    ))}
                  </select>
                )}
                {programItemAllowsDuration(editForm.item_type || item.item_type) ? (
                  <label className="block text-xs text-gray-500">
                    Minutes
                    <input
                      type="text"
                      inputMode="numeric"
                      value={String(editForm.duration_minutes ?? item.duration_minutes ?? "")}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 3)
                        if (digits === "") {
                          setEditForm((f) => ({ ...f, duration_minutes: 0 }))
                          return
                        }
                        const n = parseInt(digits, 10)
                        if (!Number.isNaN(n)) setEditForm((f) => ({ ...f, duration_minutes: n }))
                      }}
                      onBlur={(e) => {
                        const n = parseInt(e.target.value.replace(/\D/g, ""), 10) || 0
                        void patchProgramItem(item.id, { duration_minutes: n })
                      }}
                      className={`${inputClass} mt-1`}
                    />
                  </label>
                ) : null}
                <label className="block text-xs text-gray-500">
                  Assigned to
                  <input
                    type="text"
                    value={editForm.assigned_to ?? item.assigned_to ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, assigned_to: e.target.value }))}
                    onBlur={(e) =>
                      void patchProgramItem(item.id, {
                        assigned_to: e.target.value.trim() || undefined,
                      })}
                    placeholder="Name…"
                    className={`${inputClass} mt-1`}
                  />
                </label>
                <label className="block text-xs text-gray-500">
                  Topic / hymn
                  <input
                    type="text"
                    value={editForm.topic ?? item.topic ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, topic: e.target.value }))}
                    onBlur={(e) =>
                      void patchProgramItem(item.id, { topic: e.target.value.trim() || undefined })}
                    className={`${inputClass} mt-1`}
                    placeholder="Topic or hymn #"
                  />
                </label>
                <label className="block text-xs text-gray-500">
                  Notes
                  <textarea
                    value={editForm.notes ?? item.notes ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                    onBlur={(e) =>
                      void patchProgramItem(item.id, { notes: e.target.value.trim() || undefined })}
                    className={`${inputClass} mt-1 min-h-[4rem]`}
                    placeholder="Notes"
                  />
                </label>
                <label className="block text-xs text-gray-500">
                  Invite status
                  <select
                    value={editForm.invite_status || item.invite_status}
                    onChange={(e) => {
                      const v = e.target.value as InviteStatus
                      setEditForm((f) => ({ ...f, invite_status: v }))
                      void patchProgramItem(item.id, { invite_status: v })
                    }}
                    className={`${selectClass} mt-1 w-full`}
                  >
                    {Object.entries(INVITE_MOBILE_STYLES).map(([val, s]) => (
                      <option key={val} value={val}>
                        {englishMenuTitleCase(s.label)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null)
                    setEditForm({})
                  }}
                  className="mt-2 text-sm font-medium text-green-700"
                >
                  Done
                </button>
              </div>
            </Fragment>
          )
        }

        return (
          <Fragment key={item.id}>
            {addSlot}
            <div
              className={`rounded-xl border p-4 shadow-sm ${
                isBreakout
                  ? "border-amber-200 bg-amber-50/50"
                  : isDiscussion
                    ? "border-blue-100 bg-blue-50/40"
                    : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-gray-400">#{idx + 1}</p>
                  <p
                    className={`text-base font-semibold leading-snug ${
                      isBreakout ? "text-amber-900" : isDiscussion ? "text-blue-900" : "text-gray-900"
                    }`}
                  >
                    {PROGRAM_ITEM_LABELS[item.item_type] || item.item_type}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => cycleInviteStatus(item)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                >
                  {statusStyle.label}
                </button>
              </div>

              {programItemAllowsDuration(item.item_type) && item.duration_minutes > 0 ? (
                <FieldRow label="Minutes">{item.duration_minutes}</FieldRow>
              ) : null}

              <FieldRow label="Assigned">
                {lag && isStandardLagFixedProgramItemType(item.item_type) ? (
                  <input
                    type="text"
                    key={`m-assign-${item.id}-${item.assigned_to ?? ""}`}
                    defaultValue={item.assigned_to ?? ""}
                    placeholder="Name…"
                    onBlur={(e) => {
                      const v = e.target.value.trim() || undefined
                      const prev = item.assigned_to?.trim() || undefined
                      if (v !== prev) void patchProgramItem(item.id, { assigned_to: v })
                    }}
                    className={inputClass}
                  />
                ) : (
                  <span>{item.assigned_to || "—"}</span>
                )}
              </FieldRow>

              <FieldRow label="Topic / hymn">
                <span className="break-words">{item.topic || item.hymn_number || "—"}</span>
              </FieldRow>

              <FieldRow label="Notes">
                <span className="break-words text-gray-700">{item.notes || "—"}</span>
              </FieldRow>

              <div className="mt-4 flex flex-wrap gap-3 border-t border-gray-100 pt-3 text-sm font-medium">
                {canMove && (
                  <>
                    <button
                      type="button"
                      disabled={idx === 0 || isStandardLagFixedProgramItemType(sortedProgramItems[idx - 1]?.item_type)}
                      className="text-gray-700 disabled:opacity-20"
                      onClick={() => moveProgramItem(session.id, item.id, "up")}
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      disabled={
                        idx === sortedProgramItems.length - 1 ||
                        sortedProgramItems[idx + 1]?.item_type === "closing_hymn" ||
                        sortedProgramItems[idx + 1]?.item_type === "benediction"
                      }
                      className="text-gray-700 disabled:opacity-20"
                      onClick={() => moveProgramItem(session.id, item.id, "down")}
                    >
                      Down
                    </button>
                  </>
                )}
                <button type="button" onClick={() => { setEditingItem(item.id); setEditForm({}) }} className="text-indigo-600">
                  Edit
                </button>
                {!isProtected ? (
                  <button type="button" onClick={() => deleteProgramItem(item.id)} className="text-red-600">
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          </Fragment>
        )
      })}

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
        <p className="text-sm">
          <span className="font-semibold">{totalMin}</span> programmed minutes.
          {session.start_time && session.end_time ? (
            <span className="mt-1 block text-xs text-gray-700">{slotDiffText(session, totalMin)}</span>
          ) : null}
        </p>
        {!(lag && firstClosingIdx >= 0) ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full justify-center border-indigo-200 text-indigo-700 hover:bg-indigo-50 sm:w-auto"
            onClick={() => addProgramItem(session.id)}
          >
            <Plus className="mr-2 h-4 w-4" /> Add item
          </Button>
        ) : null}
      </div>
    </div>
  )
}
