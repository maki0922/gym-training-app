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
      if (type === 'invite') {
        return NextResponse.redirect(`${origin}/login?error=invite_expired`)
      }
      return NextResponse.redirect(`${origin}/login?error=auth_error`)
    }
  }

  if (type === 'recovery' || type === 'invite') {
    return NextResponse.redirect(`${origin}/reset-password/update`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
