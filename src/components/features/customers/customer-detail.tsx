'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, AlertCircle } from 'lucide-react'
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
import { reactivateCustomer } from '@/lib/actions/customer'
import { checkDuplicateSession, createSession, type DuplicateSession } from '@/lib/actions/session'
import { EditCustomerDialog } from './edit-customer-dialog'
import { DeactivateCustomerDialog } from './deactivate-customer-dialog'
import type { Customer } from '@/app/(dashboard)/customers/page'
import type { SessionSummary } from '@/app/(dashboard)/customers/[id]/page'

const GENDER_LABEL: Record<string, string> = {
  male: '男性',
  female: '女性',
  other: 'その他',
}

const PAGE_SIZE = 20

function calcAge(dateOfBirth: string): number {
  const today = new Date()
  const dob = new Date(dateOfBirth)
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`
}

type Props = {
  customer: Customer
  sessions: SessionSummary[]
  isOwner: boolean
}

export function CustomerDetail({ customer, sessions, isOwner }: Props) {
  const router = useRouter()
  const [editTarget, setEditTarget] = useState<Customer | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Customer | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [isReactivating, setIsReactivating] = useState(false)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [duplicates, setDuplicates] = useState<DuplicateSession[] | null>(null)

  const visibleSessions = sessions.slice(0, visibleCount)
  const hasMore = sessions.length > visibleCount

  // 入力途中セッションの検出
  const inProgressSession = sessions.find((s) => s.status === 'in_progress')

  const handleReactivate = async () => {
    setIsReactivating(true)
    const result = await reactivateCustomer(customer.id)
    setIsReactivating(false)
    if (result.error) {
      toast.error(result.error)
    }
  }

  // --- 新規セッション開始 ---
  const handleStartSession = async () => {
    setIsCreatingSession(true)
    const checkResult = await checkDuplicateSession(customer.id)

    if (checkResult.duplicates && checkResult.duplicates.length > 0) {
      setDuplicates(checkResult.duplicates)
      setIsCreatingSession(false)
      return
    }

    // 重複なし → 即作成
    const createResult = await createSession(customer.id)
    setIsCreatingSession(false)

    if (createResult.error) {
      toast.error(createResult.error)
    } else if (createResult.sessionId) {
      router.push(`/sessions/${createResult.sessionId}/edit`)
    }
  }

  const handleForceCreateSession = async () => {
    setDuplicates(null)
    setIsCreatingSession(true)
    const createResult = await createSession(customer.id)
    setIsCreatingSession(false)

    if (createResult.error) {
      toast.error(createResult.error)
    } else if (createResult.sessionId) {
      router.push(`/sessions/${createResult.sessionId}/edit`)
    }
  }

  const handleOpenExistingSession = () => {
    if (duplicates && duplicates.length > 0) {
      // 最新の既存セッションを開く
      router.push(`/sessions/${duplicates[0].id}/edit`)
    }
    setDuplicates(null)
  }

  return (
    <>
      <div className="space-y-6">
        {/* 基本情報 */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-zinc-900">{customer.name}</h1>
                {!customer.isActive && (
                  <Badge className="bg-zinc-100 text-zinc-500 hover:bg-zinc-100">退会済み</Badge>
                )}
              </div>
              <p className="text-sm text-zinc-500 mt-0.5">{customer.nameKana}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {customer.isActive ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditTarget(customer)}
                  >
                    <Pencil className="size-3.5 mr-1" />
                    編集
                  </Button>
                  {isOwner && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-zinc-500"
                      onClick={() => setDeactivateTarget(customer)}
                    >
                      退会処理
                    </Button>
                  )}
                </>
              ) : isOwner ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReactivate}
                  disabled={isReactivating}
                >
                  {isReactivating ? '処理中...' : '再有効化'}
                </Button>
              ) : null}
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-zinc-500">性別</dt>
              <dd className="mt-0.5 text-zinc-900 font-medium">
                {customer.gender ? GENDER_LABEL[customer.gender] : '未設定'}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">生年月日</dt>
              <dd className="mt-0.5 text-zinc-900 font-medium">
                {customer.dateOfBirth ? (
                  <>
                    {formatDate(customer.dateOfBirth)}
                    <span className="ml-2 text-zinc-500 font-normal">
                      （{calcAge(customer.dateOfBirth)}歳）
                    </span>
                  </>
                ) : '未設定'}
              </dd>
            </div>
            {customer.notes && (
              <div className="sm:col-span-2">
                <dt className="text-zinc-500">メモ</dt>
                <dd className="mt-0.5 text-zinc-900 whitespace-pre-wrap">{customer.notes}</dd>
              </div>
            )}
          </dl>

          {/* 新規セッション開始ボタン */}
          {customer.isActive && (
            <div className="pt-3 border-t border-zinc-100 mt-4">
              <Button
                className="w-full h-12 bg-zinc-900 hover:bg-zinc-700 text-white"
                onClick={handleStartSession}
                disabled={isCreatingSession}
              >
                <Plus className="size-4 mr-1" />
                {isCreatingSession ? 'セッション作成中...' : '新規セッション開始'}
              </Button>
            </div>
          )}
        </Card>

        {/* 入力途中セッション通知 */}
        {inProgressSession && (
          <button
            onClick={() => router.push(`/sessions/${inProgressSession.id}/edit`)}
            className="w-full rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-left hover:bg-amber-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                入力途中のセッションがあります（{formatDate(inProgressSession.sessionDate)} / 担当: {inProgressSession.trainerIsActive ? inProgressSession.trainerName : `${inProgressSession.trainerName}（退職済み）`}）
              </p>
            </div>
          </button>
        )}

        {/* 過去セッション一覧 */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-zinc-900">過去のセッション</h2>

          {sessions.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">トレーニング記録はまだありません</p>
          ) : (
            <>
              {/* PC: テーブル表示 */}
              <div className="hidden md:block">
                <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50">
                        <th className="px-4 py-3 text-left font-medium text-zinc-600">日付</th>
                        <th className="px-4 py-3 text-left font-medium text-zinc-600">担当</th>
                        <th className="px-4 py-3 text-left font-medium text-zinc-600">種目数</th>
                        <th className="px-4 py-3 text-left font-medium text-zinc-600">状態</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleSessions.map((session) => (
                        <tr
                          key={session.id}
                          className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 cursor-pointer"
                          onClick={() => router.push(`/sessions/${session.id}`)}
                        >
                          <td className="px-4 py-3 text-zinc-900">{formatDate(session.sessionDate)}</td>
                          <td className="px-4 py-3 text-zinc-600">
                            {session.trainerIsActive
                              ? session.trainerName
                              : `${session.trainerName}（退職済み）`}
                          </td>
                          <td className="px-4 py-3 text-zinc-600">{session.exerciseCount}</td>
                          <td className="px-4 py-3">
                            {session.status === 'in_progress' && (
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">入力中</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* モバイル: カード表示 */}
              <div className="md:hidden space-y-2">
                {visibleSessions.map((session) => (
                  <Card
                    key={session.id}
                    className="p-4 cursor-pointer hover:bg-zinc-50 transition-colors"
                    onClick={() => router.push(`/sessions/${session.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <p className="font-medium text-zinc-900">{formatDate(session.sessionDate)}</p>
                        <p className="text-sm text-zinc-500">
                          担当:{' '}
                          {session.trainerIsActive
                            ? session.trainerName
                            : `${session.trainerName}（退職済み）`}
                        </p>
                        <p className="text-sm text-zinc-400">種目数: {session.exerciseCount}</p>
                      </div>
                      {session.status === 'in_progress' && (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs shrink-0 ml-2">入力中</Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  >
                    もっと見る（残り {sessions.length - visibleCount} 件）
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <EditCustomerDialog customer={editTarget} onClose={() => setEditTarget(null)} />
      <DeactivateCustomerDialog customer={deactivateTarget} onClose={() => setDeactivateTarget(null)} />

      {/* 重複セッション警告ダイアログ */}
      <AlertDialog open={!!duplicates} onOpenChange={(open) => !open && setDuplicates(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>本日のセッションが既に存在します</AlertDialogTitle>
            <AlertDialogDescription>
              {duplicates?.map((d) => (
                <span key={d.id} className="block">
                  担当: {d.trainerName} / ステータス: {d.status === 'in_progress' ? '入力中' : '完了'}
                </span>
              ))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleOpenExistingSession}
            >
              既存のセッションを開く
            </Button>
            <Button
              className="w-full bg-zinc-900 hover:bg-zinc-700 text-white"
              onClick={handleForceCreateSession}
            >
              新規作成する
            </Button>
            <AlertDialogCancel className="w-full mt-0">キャンセル</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
