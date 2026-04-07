import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { CustomerDetail } from '@/components/features/customers/customer-detail'

export type SessionSummary = {
  id: string
  sessionDate: string
  status: 'in_progress' | 'completed'
  trainerName: string
  trainerIsActive: boolean
  exerciseCount: number
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const isOwner = profile.role === 'owner'

  // 顧客情報取得
  const { data: customer } = await supabase
    .from('customers')
    .select('id, name, name_kana, gender, date_of_birth, notes, is_active, created_at')
    .eq('id', id)
    .single()

  if (!customer) notFound()

  // トレーナーは退会済み顧客にアクセス不可
  if (!isOwner && !customer.is_active) notFound()

  // 過去セッション取得（論理削除を除く、in_progress も表示）
  const { data: sessions } = await supabase
    .from('training_sessions')
    .select(`
      id,
      session_date,
      status,
      trainer_id,
      profiles!training_sessions_trainer_id_fkey (
        display_name,
        is_active
      ),
      training_records (
        id
      )
    `)
    .eq('customer_id', id)
    .eq('is_deleted', false)
    .order('session_date', { ascending: false })

  const sessionList: SessionSummary[] = (sessions ?? []).map((s) => ({
    id: s.id,
    sessionDate: s.session_date,
    status: s.status as 'in_progress' | 'completed',
    trainerName: (s.profiles as { display_name: string; is_active: boolean } | null)?.display_name ?? '不明',
    trainerIsActive: (s.profiles as { display_name: string; is_active: boolean } | null)?.is_active ?? true,
    exerciseCount: Array.isArray(s.training_records) ? s.training_records.length : 0,
  }))

  return (
    <div className="space-y-6">
      <Link
        href="/customers"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        <ChevronLeft className="size-4" />
        顧客一覧に戻る
      </Link>

      <CustomerDetail
        customer={{
          id: customer.id,
          name: customer.name,
          nameKana: customer.name_kana,
          gender: customer.gender as 'male' | 'female' | 'other' | null,
          dateOfBirth: customer.date_of_birth,
          notes: customer.notes,
          isActive: customer.is_active,
          createdAt: customer.created_at,
          lastSessionDate: sessionList.find((s) => s.status === 'completed')?.sessionDate ?? null,
        }}
        sessions={sessionList}
        isOwner={isOwner}
      />
    </div>
  )
}
