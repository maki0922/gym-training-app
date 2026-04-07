'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { ExerciseCard } from './exercise-card'
import { AddExerciseDialog, type ExerciseOption } from './add-exercise-dialog'
import {
  addExerciseToSession,
  addFreeExerciseToSession,
  updateSessionNotes,
  completeSession,
} from '@/lib/actions/session'

// ---------- 型定義 ----------

export type SetData = {
  id: string
  setNumber: number
  weight: number | null
  reps: number | null
  notes: string | null
}

export type RecordData = {
  id: string
  exerciseId: string | null
  exerciseName: string | null
  exerciseNameManual: string | null
  sortOrder: number
  notes: string | null
  sets: SetData[]
}

export type PreviousRecord = {
  date: string
  setCount: number
}

export type SessionData = {
  id: string
  customerId: string
  customerName: string
  sessionDate: string
  status: 'in_progress' | 'completed'
  notes: string | null
  records: RecordData[]
}

type Props = {
  session: SessionData
  exercises: ExerciseOption[]
  previousRecords: Record<string, PreviousRecord>
}

// ---------- helpers ----------

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`
}

// ---------- component ----------

export function SessionEditor({ session, exercises, previousRecords }: Props) {
  const router = useRouter()
  const [records, setRecords] = useState<RecordData[]>(session.records)
  const [sessionNotes, setSessionNotes] = useState(session.notes ?? '')
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [isPendingComplete, setIsPendingComplete] = useState(false)

  // ローカルステート更新関数（子コンポーネントに渡す）
  const handleLocalUpdate = useCallback(
    (recordId: string, updater: (r: RecordData) => RecordData) => {
      setRecords((prev) => prev.map((r) => (r.id === recordId ? updater(r) : r)))
    },
    []
  )

  // --- 種目追加（マスタ） ---
  const handleSelectExercise = async (exerciseId: string) => {
    const result = await addExerciseToSession(session.id, exerciseId)
    if (result.error) {
      toast.error(result.error)
    }
  }

  // --- 種目追加（自由入力） ---
  const handleFreeInput = async (name: string) => {
    const result = await addFreeExerciseToSession(session.id, name)
    if (result.error) {
      toast.error(result.error)
    }
  }

  // --- セッションメモ（onBlur保存） ---
  const handleSessionNotesBlur = async () => {
    const result = await updateSessionNotes(session.id, sessionNotes || null)
    if (result.error) {
      toast.error(result.error)
    }
  }

  // --- セッション完了 ---
  const handleComplete = async () => {
    setIsPendingComplete(true)
    const result = await completeSession(session.id, session.customerId)
    setIsPendingComplete(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      router.push(`/customers/${session.customerId}`)
    }
  }

  return (
    <>
      <div className="space-y-4 pb-24">
        {/* ヘッダー */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-zinc-900">{session.customerName}</h1>
            {session.status === 'in_progress' && (
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">入力中</Badge>
            )}
            {session.status === 'completed' && (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">完了</Badge>
            )}
          </div>
          <p className="text-sm text-zinc-500">{formatDate(session.sessionDate)}</p>
        </div>

        {/* 種目カード一覧 */}
        {records.map((record) => (
          <ExerciseCard
            key={record.id}
            sessionId={session.id}
            customerId={session.customerId}
            record={record}
            previousRecord={record.exerciseId ? (previousRecords[record.exerciseId] ?? null) : null}
            onLocalUpdate={handleLocalUpdate}
          />
        ))}

        {/* 種目が0の場合 */}
        {records.length === 0 && (
          <div className="text-center py-12 text-zinc-400">
            <p className="text-sm">種目を追加してトレーニングを記録しましょう</p>
          </div>
        )}

        {/* 種目追加ボタン */}
        <Button
          variant="outline"
          className="w-full h-12 text-zinc-500 border-dashed"
          onClick={() => setShowAddExercise(true)}
        >
          <Plus className="size-4 mr-1" />
          種目を追加
        </Button>

        {/* セッション全体メモ */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">セッションメモ</label>
          <Textarea
            placeholder="セッション全体のメモ（任意）"
            className="text-sm min-h-[3rem] resize-none"
            maxLength={500}
            rows={2}
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            onBlur={handleSessionNotesBlur}
          />
        </div>

        {/* セッション完了ボタン */}
        {session.status === 'in_progress' && (
          <Button
            className="w-full h-12 bg-zinc-900 hover:bg-zinc-700 text-white text-base"
            disabled={records.length === 0}
            onClick={() => setShowComplete(true)}
          >
            <CheckCircle className="size-5 mr-2" />
            セッション完了
          </Button>
        )}
      </div>

      {/* 種目追加ダイアログ */}
      <AddExerciseDialog
        open={showAddExercise}
        onOpenChange={setShowAddExercise}
        exercises={exercises}
        onSelectExercise={handleSelectExercise}
        onFreeInput={handleFreeInput}
      />

      {/* セッション完了確認ダイアログ */}
      <AlertDialog open={showComplete} onOpenChange={setShowComplete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>セッションを完了しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              完了後もセッション詳細画面から編集できます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <Button
              className="bg-zinc-900 hover:bg-zinc-700 text-white"
              onClick={handleComplete}
              disabled={isPendingComplete}
            >
              {isPendingComplete ? '完了処理中...' : '完了する'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
