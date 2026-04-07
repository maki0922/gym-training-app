import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

function todayJST(): string {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().split('T')[0]
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (process.env.CRON_ENABLED !== 'true') {
    return Response.json({ ok: true, skipped: true, reason: 'CRON_ENABLED is not true' })
  }

  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const today = todayJST()

    const { data, error } = await supabase
      .from('training_sessions')
      .update({ status: 'completed' })
      .eq('status', 'in_progress')
      .eq('is_deleted', false)
      .lt('session_date', today)
      .select('id')

    if (error) {
      console.error('Cron complete-sessions error:', error)
      return Response.json({ error: 'Internal Server Error' }, { status: 500 })
    }

    const updatedCount = data?.length ?? 0
    console.log(`Cron complete-sessions: ${updatedCount} sessions updated`)

    return Response.json({ ok: true, updatedCount })
  } catch (err) {
    console.error('Cron complete-sessions unexpected error:', err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
