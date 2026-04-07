'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { deleteSession } from '@/lib/actions/session'

type SetView = {
  setNumber: number
  weight: number | null
  reps: number | null
  notes: string | null
}

type RecordView = {
  id: string
  exerciseName: string
  notes: string | null
  sets: SetView[]
}

type SessionView = {
  id: string
  customerId: string
  customerName: string
  sessionDate: string
  status: 'in_progress' | 'completed'
  notes: string | null
  trainerName: string
  trainerIsActive: boolean
}

type Props = {
  session: SessionView
  records: RecordView[]
  isOwner: boolean
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`
}

export function SessionDetailView({ session, records, isOwner }: Props) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [isPendingDelete, setIsPendingDelete] = useState(false)

  const handleDelete = async () => {
    setIsPendingDelete(true)
    const result = await deleteSession(session.id, session.customerId)
    setIsPendingDelete(false)

    if (result.error) {
      toast.error(result.error)
      setShowDelete(false)
    } else {
      toast.success('セッションを削除しました')
      router.push(`/customers/${session.customerId}`)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* ヘッダー */}
        <div className="flex items-start justify-between">
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
            <p className="text-sm text-zinc-500">
              担当: {session.trainerName}
              {!session.trainerIsActive && (
                <span className="text-zinc-400">（退職済み）</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/sessions/${session.id}/edit`)}
            >
              <Pencil className="size-3.5 mr-1" />
              編集
            </Button>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 hover:text-red-700"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="size-3.5 mr-1" />
                削除
              </Button>
            )}
          </div>
        </div>

        {/* 種目カード一覧 */}
        {records.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-8">種目が記録されていません</p>
        ) : (
          records.map((record) => (
            <Card key={record.id} className="p-4 space-y-3">
              <h3 className="font-medium text-zinc-900">{record.exerciseName}</h3>

              {/* セットテーブル */}
              {record.sets.length > 0 && (
                <div className="rounded-lg border border-zinc-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-100">
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400 w-12">SET</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-zinc-400">重量</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-zinc-400">回数</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-400">メモ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {record.sets.map((set) => (
                        <tr key={set.setNumber} className="border-b border-zinc-50 last:border-b-0">
                          <td className="px-3 py-2 text-zinc-400 font-medium">{set.setNumber}</td>
                          <td className="px-3 py-2 text-right text-zinc-900">
                            {set.weight !== null ? `${set.weight} kg` : '—'}
                          </td>
                          <td className="px-3 py-2 text-right text-zinc-900">
                            {set.reps !== null ? `${set.reps} 回` : '—'}
                          </td>
                          <td className="px-3 py-2 text-zinc-500 text-xs">
                            {set.notes || ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 種目メモ */}
              {record.notes && (
                <p className="text-sm text-zinc-500 bg-zinc-50 rounded-lg px-3 py-2">
                  {record.notes}
                </p>
              )}
            </Card>
          ))
        )}

        {/* セッション全体メモ */}
        {session.notes && (
          <Card className="p-4">
            <h3 className="text-sm font-medium text-zinc-500 mb-1">セッションメモ</h3>
            <p className="text-sm text-zinc-900 whitespace-pre-wrap">{session.notes}</p>
          </Card>
        )}
      </div>

      {/* セッション削除確認ダイアログ */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>セッションを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {formatDate(session.sessionDate)} のセッション記録を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
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
