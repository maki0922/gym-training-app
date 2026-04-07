'use client'

import { useRouter } from 'next/navigation'
import { AlertCircle, Clock, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { DashboardSession } from '@/app/(dashboard)/page'

type Props = {
  todaySessions: DashboardSession[]
  inProgressSessions: DashboardSession[]
  recentSessions: DashboardSession[]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

export function Dashboard({ todaySessions, inProgressSessions, recentSessions }: Props) {
  const router = useRouter()

  const handleSessionClick = (session: DashboardSession) => {
    if (session.status === 'in_progress') {
      router.push(`/sessions/${session.id}/edit`)
    } else {
      router.push(`/sessions/${session.id}`)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-900">ダッシュボード</h1>

      {/* 入力途中セッション通知 */}
      {inProgressSessions.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-amber-600 shrink-0" />
            <p className="text-sm font-medium text-amber-800">
              入力途中のセッションが {inProgressSessions.length} 件あります
            </p>
          </div>
          <div className="space-y-1.5 pl-6">
            {inProgressSessions.map((s) => (
              <button
                key={s.id}
                onClick={() => router.push(`/sessions/${s.id}/edit`)}
                className="block w-full text-left text-sm text-amber-700 hover:text-amber-900 hover:underline transition-colors"
              >
                {s.customerName} — {formatDate(s.sessionDate)}（担当: {s.trainerName}）
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 本日のセッション */}
      <section className="space-y-2">
        <h2 className="text-base font-bold text-zinc-900">本日のセッション</h2>
        {todaySessions.length === 0 ? (
          <p className="text-sm text-zinc-500 py-6 text-center">本日のセッションはまだありません</p>
        ) : (
          <Card className="divide-y divide-zinc-100 overflow-hidden">
            {todaySessions.map((s) => (
              <button
                key={s.id}
                className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-zinc-50 transition-colors"
                onClick={() => handleSessionClick(s)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-zinc-900 truncate">{s.customerName}</span>
                  {s.status === 'in_progress' ? (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs shrink-0">入力中</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs shrink-0">完了</Badge>
                  )}
                </div>
                <span className="text-xs text-zinc-400 shrink-0 ml-2">{s.trainerName} / {s.exerciseCount}種目</span>
              </button>
            ))}
          </Card>
        )}
      </section>

      {/* 直近の記録 */}
      <section className="space-y-2">
        <h2 className="text-base font-bold text-zinc-900">直近の記録</h2>
        {recentSessions.length === 0 ? (
          <p className="text-sm text-zinc-500 py-6 text-center">直近の記録はありません</p>
        ) : (
          <Card className="divide-y divide-zinc-100 overflow-hidden">
            {recentSessions.map((s) => (
              <button
                key={s.id}
                className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-zinc-50 transition-colors"
                onClick={() => router.push(`/sessions/${s.id}`)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-zinc-900 truncate">{s.customerName}</span>
                  <span className="text-xs text-zinc-400 shrink-0">{s.exerciseCount}種目</span>
                </div>
                <span className="text-xs text-zinc-400 shrink-0 ml-2">{formatDateShort(s.sessionDate)}</span>
              </button>
            ))}
          </Card>
        )}
      </section>
    </div>
  )
}
