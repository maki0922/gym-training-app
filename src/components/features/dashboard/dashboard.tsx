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
  return `${d.getMonth() + 1}/${d.getDate()}`
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
      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">本日のセッション</h2>
        {todaySessions.length === 0 ? (
          <p className="text-sm text-zinc-500 py-6 text-center">本日のセッションはまだありません</p>
        ) : (
          <div className="space-y-2">
            {todaySessions.map((s) => (
              <Card
                key={s.id}
                className="p-4 cursor-pointer hover:bg-zinc-50 transition-colors"
                onClick={() => handleSessionClick(s)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-900">{s.customerName}</span>
                      {s.status === 'in_progress' ? (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">
                          <Clock className="size-3 mr-0.5" />
                          入力中
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                          <CheckCircle className="size-3 mr-0.5" />
                          完了
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500">担当: {s.trainerName}</p>
                    <p className="text-sm text-zinc-400">種目数: {s.exerciseCount}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 直近の記録 */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-zinc-900">直近の記録</h2>
        {recentSessions.length === 0 ? (
          <p className="text-sm text-zinc-500 py-6 text-center">直近の記録はありません</p>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((s) => (
              <Card
                key={s.id}
                className="p-4 cursor-pointer hover:bg-zinc-50 transition-colors"
                onClick={() => router.push(`/sessions/${s.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-medium text-zinc-900">{s.customerName}</span>
                    <p className="text-sm text-zinc-500">担当: {s.trainerName} / 種目数: {s.exerciseCount}</p>
                  </div>
                  <span className="text-sm text-zinc-400 shrink-0 ml-2">{formatDateShort(s.sessionDate)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
