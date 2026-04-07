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

  const items: Customer[] = (customers ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    nameKana: c.name_kana,
    gender: c.gender as 'male' | 'female' | 'other' | null,
    dateOfBirth: c.date_of_birth,
    notes: c.notes,
    isActive: c.is_active,
    createdAt: c.created_at,
  }))

  return <CustomerList customers={items} isOwner={isOwner} />
}
