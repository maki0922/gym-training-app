import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('auth callback exchangeCode error:', error.message)
      if (type === 'invite') {
        return NextResponse.redirect(`${origin}/login?error=invite_expired`)
      }
      return NextResponse.redirect(`${origin}/login?error=auth_error`)
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'recovery' | 'email' | 'invite',
    })
    if (error) {
      console.error('auth callback verifyOtp error:', error.message)
      if (type === 'invite') {
        return NextResponse.redirect(`${origin}/login?error=invite_expired`)
      }
      return NextResponse.redirect(`${origin}/login?error=auth_error`)
    }
  }

  // 招待・パスワードリセット時はセッションを確認
  if (type === 'recovery' || type === 'invite') {
    const { data: { session } } = await supabase.auth.getSession()
    console.log('auth callback session check:', session ? 'session exists' : 'no session')
    return NextResponse.redirect(`${origin}/reset-password/update`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
