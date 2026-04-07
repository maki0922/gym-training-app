import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database.types'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  console.log('auth callback params:', { code: code ? 'present' : 'null', tokenHash: tokenHash ? 'present' : 'null', type, allParams: searchParams.toString() })

  const redirectUrl = (type === 'recovery' || type === 'invite')
    ? `${origin}/reset-password/update`
    : `${origin}${next}`

  const response = NextResponse.redirect(redirectUrl)

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.headers.get('cookie')
            ?.split('; ')
            .map((c) => {
              const [name, ...rest] = c.split('=')
              return { name, value: rest.join('=') }
            }) ?? []
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

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

  return response
}
