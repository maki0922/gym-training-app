import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CustomerList } from '@/components/features/customers/customer-list'

export type Customer = {
  id: string
  name: string
  nameKana: string
  gender: 'male' | 'female' | 'other' | null
  dateOfBirth: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  lastSessionDate: string | null
}

export default async function CustomersPage() {
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

  // オーナーは全件、トレーナーは is_active = true のみ取得
  const query = supabase
    .from('customers')
    .select('id, name, name_kana, gender, date_of_birth, notes, is_active, created_at')
    .order('name_kana', { ascending: true })

  const { data: customers } = isOwner
    ? await query
    : await query.eq('is_active', true)

  // 各顧客の直近セッション日を取得
  const customerIds = (customers ?? []).map((c) => c.id)
  const { data: latestSessions } = customerIds.length > 0
    ? await supabase
        .from('training_sessions')
        .select('customer_id, session_date')
        .in('customer_id', customerIds)
        .eq('is_deleted', false)
        .eq('status', 'completed')
        .order('session_date', { ascending: false })
    : { data: [] }

  // 各顧客の最新日付をマップ化（最初に出現したものが最新）
  const lastSessionMap = new Map<string, string>()
  for (const s of latestSessions ?? []) {
    if (!lastSessionMap.has(s.customer_id)) {
      lastSessionMap.set(s.customer_id, s.session_date)
    }
  }

  const items: Customer[] = (customers ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    nameKana: c.name_kana,
    gender: c.gender as 'male' | 'female' | 'other' | null,
    dateOfBirth: c.date_of_birth,
    notes: c.notes,
    isActive: c.is_active,
    createdAt: c.created_at,
    lastSessionDate: lastSessionMap.get(c.id) ?? null,
  }))

  return <CustomerList customers={items} isOwner={isOwner} />
}
