'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('認証処理中...')

  useEffect(() => {
    const supabase = createClient()
    const type = searchParams.get('type')
    const code = searchParams.get('code')
    const tokenHash = searchParams.get('token_hash')

    async function handleCallback() {
      // PKCE flow: code パラメータがある場合
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('auth callback exchangeCode error:', error.message)
          router.replace(type === 'invite' ? '/login?error=invite_expired' : '/login?error=auth_error')
          return
        }
      }
      // token_hash パラメータがある場合（メールテンプレート経由）
      else if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as 'invite' | 'recovery' | 'email',
        })
        if (error) {
          console.error('auth callback verifyOtp error:', error.message)
          router.replace(type === 'invite' ? '/login?error=invite_expired' : '/login?error=auth_error')
          return
        }
      }
      // パラメータなし: ハッシュフラグメントの処理を待つ
      else {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          await new Promise((resolve) => setTimeout(resolve, 1500))
          const { data: { session: retrySession } } = await supabase.auth.getSession()
          if (!retrySession) {
            console.error('auth callback: no session established')
            router.replace(type === 'invite' ? '/login?error=invite_expired' : '/login?error=auth_error')
            return
          }
        }
      }

      // 招待・パスワードリセットの場合はパスワード設定画面へ
      if (type === 'recovery' || type === 'invite') {
        router.replace('/reset-password/update')
      } else {
        router.replace('/')
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <Loader2 className="size-6 text-zinc-400 animate-spin" />
      <p className="text-sm text-zinc-500">{status}</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-6 text-zinc-400 animate-spin" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
