import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Dashboard } from '@/components/features/dashboard/dashboard'

export type DashboardSession = {
  id: string
  customerName: string
  sessionDate: string
  status: 'in_progress' | 'completed'
  trainerName: string
  exerciseCount: number
}

function todayJST(): string {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().split('T')[0]
}

function daysAgoJST(days: number): string {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  jst.setDate(jst.getDate() - days)
  return jst.toISOString().split('T')[0]
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = todayJST()

  // 本日のセッション
  const { data: todaySessions } = await supabase
    .from('training_sessions')
    .select(`
      id,
      session_date,
      status,
      customers!training_sessions_customer_id_fkey ( name ),
      profiles!training_sessions_trainer_id_fkey ( display_name ),
      training_records ( id )
    `)
    .eq('session_date', today)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  const todayList: DashboardSession[] = (todaySessions ?? []).map((s) => ({
    id: s.id,
    customerName: (s.customers as { name: string } | null)?.name ?? '不明',
    sessionDate: s.session_date,
    status: s.status as 'in_progress' | 'completed',
    trainerName: (s.profiles as { display_name: string } | null)?.display_name ?? '不明',
    exerciseCount: Array.isArray(s.training_records) ? s.training_records.length : 0,
  }))

  // 入力途中セッション（本日以外も含む）
  const { data: inProgressSessions } = await supabase
    .from('training_sessions')
    .select(`
      id,
      session_date,
      status,
      customers!training_sessions_customer_id_fkey ( name ),
      profiles!training_sessions_trainer_id_fkey ( display_name ),
      training_records ( id )
    `)
    .eq('status', 'in_progress')
    .eq('is_deleted', false)
    .order('session_date', { ascending: false })

  const inProgressList: DashboardSession[] = (inProgressSessions ?? []).map((s) => ({
    id: s.id,
    customerName: (s.customers as { name: string } | null)?.name ?? '不明',
    sessionDate: s.session_date,
    status: 'in_progress' as const,
    trainerName: (s.profiles as { display_name: string } | null)?.display_name ?? '不明',
    exerciseCount: Array.isArray(s.training_records) ? s.training_records.length : 0,
  }))

  // 直近7日間の完了セッション（最大5件）
  const weekAgo = daysAgoJST(7)
  const { data: recentSessions } = await supabase
    .from('training_sessions')
    .select(`
      id,
      session_date,
      status,
      customers!training_sessions_customer_id_fkey ( name ),
      profiles!training_sessions_trainer_id_fkey ( display_name ),
      training_records ( id )
    `)
    .eq('status', 'completed')
    .eq('is_deleted', false)
    .gte('session_date', weekAgo)
    .order('session_date', { ascending: false })
    .limit(5)

  const recentList: DashboardSession[] = (recentSessions ?? []).map((s) => ({
    id: s.id,
    customerName: (s.customers as { name: string } | null)?.name ?? '不明',
    sessionDate: s.session_date,
    status: 'completed' as const,
    trainerName: (s.profiles as { display_name: string } | null)?.display_name ?? '不明',
    exerciseCount: Array.isArray(s.training_records) ? s.training_records.length : 0,
  }))

  return (
    <Dashboard
      todaySessions={todayList}
      inProgressSessions={inProgressList}
      recentSessions={recentList}
    />
  )
}
