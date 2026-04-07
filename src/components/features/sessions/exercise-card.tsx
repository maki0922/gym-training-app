'use client'

import { useState, useCallback } from 'react'
import { Trash2, Plus, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import {
  addSet,
  updateSet,
  deleteSet,
  deleteRecord,
  updateRecordNotes,
  copyPreviousSets,
} from '@/lib/actions/session'
import type { RecordData, SetData, PreviousRecord } from './session-editor'

type Props = {
  sessionId: string
  customerId: string
  record: RecordData
  previousRecord: PreviousRecord | null
  onLocalUpdate: (recordId: string, updater: (r: RecordData) => RecordData) => void
}

export function ExerciseCard({ sessionId, customerId, record, previousRecord, onLocalUpdate }: Props) {
  const [deleteSetTarget, setDeleteSetTarget] = useState<SetData | null>(null)
  const [showDeleteRecord, setShowDeleteRecord] = useState(false)
  const [isPendingAdd, setIsPendingAdd] = useState(false)
  const [isPendingDelete, setIsPendingDelete] = useState(false)
  const [isPendingCopy, setIsPendingCopy] = useState(false)

  const exerciseName = record.exerciseName ?? record.exerciseNameManual ?? '不明な種目'

  // --- セット値の変更（ローカル即時更新 + onBlur保存） ---

  const handleSetLocalChange = useCallback(
    (setId: string, field: 'weight' | 'reps' | 'notes', value: string) => {
      onLocalUpdate(record.id, (r) => ({
        ...r,
        sets: r.sets.map((s) => {
          if (s.id !== setId) return s
          if (field === 'weight') return { ...s, weight: value === '' ? null : parseFloat(value) || null }
          if (field === 'reps') return { ...s, reps: value === '' ? null : parseInt(value) || null }
          return { ...s, notes: value || null }
        }),
      }))
    },
    [record.id, onLocalUpdate]
  )

  const handleSetBlur = useCallback(
    async (set: SetData) => {
      const result = await updateSet(set.id, set.weight, set.reps, set.notes)
      if (result.error) {
        toast.error(result.error)
      }
    },
    []
  )

  // --- セット追加 ---

  const handleAddSet = async () => {
    setIsPendingAdd(true)
    const result = await addSet(sessionId, record.id)
    setIsPendingAdd(false)
    if (result.error) {
      toast.error(result.error)
    }
  }

  // --- セット削除 ---

  const handleDeleteSet = async () => {
    if (!deleteSetTarget) return
    setIsPendingDelete(true)
    const result = await deleteSet(sessionId, deleteSetTarget.id, record.id)
    setIsPendingDelete(false)
    if (result.error) {
      toast.error(result.error)
    }
    setDeleteSetTarget(null)
  }

  // --- 種目削除 ---

  const handleDeleteRecord = async () => {
    setIsPendingDelete(true)
    const result = await deleteRecord(sessionId, record.id)
    setIsPendingDelete(false)
    if (result.error) {
      toast.error(result.error)
    }
    setShowDeleteRecord(false)
  }

  // --- 種目メモ更新（onBlur） ---

  const handleRecordNotesChange = (value: string) => {
    onLocalUpdate(record.id, (r) => ({ ...r, notes: value || null }))
  }

  const handleRecordNotesBlur = async () => {
    const result = await updateRecordNotes(record.id, record.notes)
    if (result.error) {
      toast.error(result.error)
    }
  }

  // --- 前回をコピー ---

  const handleCopyPrevious = async () => {
    if (!record.exerciseId) return
    setIsPendingCopy(true)
    const result = await copyPreviousSets(sessionId, record.id, customerId, record.exerciseId)
    setIsPendingCopy(false)
    if (result.error) {
      toast.error(result.error)
    }
  }

  return (
    <>
      <Card className="p-4 space-y-3">
        {/* 種目ヘッダー */}
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-zinc-900">{exerciseName}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-red-500"
            onClick={() => setShowDeleteRecord(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        {/* 前回記録 */}
        {previousRecord && (
          <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
            <p className="text-xs text-zinc-500">
              前回: {previousRecord.date} — {previousRecord.setCount}セット
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-zinc-600 hover:text-zinc-900 min-h-[44px]"
              onClick={handleCopyPrevious}
              disabled={isPendingCopy}
            >
              <Copy className="size-3 mr-1" />
              {isPendingCopy ? 'コピー中...' : '前回をコピー'}
            </Button>
          </div>
        )}

        {/* セットヘッダー */}
        <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 px-1 text-xs text-zinc-400 font-medium">
          <span></span>
          <span>重量 (kg)</span>
          <span>回数</span>
          <span></span>
        </div>

        {/* セット行 */}
        {record.sets.map((set, idx) => (
          <div key={set.id} className={`space-y-1 rounded-lg px-1 py-1.5 ${idx % 2 === 1 ? 'bg-zinc-50' : ''}`}>
            <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 items-center">
              <span className="text-sm text-zinc-400 text-center font-medium">{set.setNumber}</span>
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                max="999.9"
                placeholder="—"
                className="h-11 text-center"
                value={set.weight ?? ''}
                onChange={(e) => handleSetLocalChange(set.id, 'weight', e.target.value)}
                onBlur={() => handleSetBlur(set)}
              />
              <Input
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                max="999"
                placeholder="—"
                className="h-11 text-center"
                value={set.reps ?? ''}
                onChange={(e) => handleSetLocalChange(set.id, 'reps', e.target.value)}
                onBlur={() => handleSetBlur(set)}
              />
              <button
                type="button"
                className="flex items-center justify-center size-11 -m-1.5 text-zinc-300 hover:text-red-500 transition-colors"
                onClick={() => setDeleteSetTarget(set)}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            {/* セットメモ */}
            <div className="pl-8 pr-10">
              <Input
                type="text"
                placeholder="メモ（例: 補助あり）"
                className="h-8 text-xs text-zinc-500"
                maxLength={100}
                value={set.notes ?? ''}
                onChange={(e) => handleSetLocalChange(set.id, 'notes', e.target.value)}
                onBlur={() => handleSetBlur(set)}
              />
            </div>
          </div>
        ))}

        {/* セット追加ボタン */}
        <Button
          variant="outline"
          className="w-full text-zinc-500 border-dashed h-11"
          onClick={handleAddSet}
          disabled={isPendingAdd}
        >
          <Plus className="size-3.5 mr-1" />
          {isPendingAdd ? '追加中...' : 'セットを追加'}
        </Button>

        {/* 種目メモ */}
        <div className="space-y-1">
          <Textarea
            placeholder="種目メモ（任意）"
            className="text-sm min-h-[2.5rem] resize-none"
            maxLength={500}
            rows={1}
            value={record.notes ?? ''}
            onChange={(e) => handleRecordNotesChange(e.target.value)}
            onBlur={handleRecordNotesBlur}
          />
        </div>
      </Card>

      {/* セット削除確認ダイアログ */}
      <AlertDialog open={!!deleteSetTarget} onOpenChange={(open) => !open && setDeleteSetTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>セットを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              このセットの記録を削除します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteSet}
              disabled={isPendingDelete}
            >
              {isPendingDelete ? '削除中...' : '削除する'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 種目削除確認ダイアログ */}
      <AlertDialog open={showDeleteRecord} onOpenChange={setShowDeleteRecord}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>種目を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {exerciseName} とそのセット記録をすべて削除します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteRecord}
              disabled={isPendingDelete}
            >
              {isPendingDelete ? '削除中...' : '削除する'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
