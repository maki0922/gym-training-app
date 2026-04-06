'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sendPasswordResetEmail, type AuthActionState } from '@/lib/actions/auth'
import { APP_NAME } from '@/lib/constants'

const initialState: AuthActionState & { sent?: boolean } = { error: undefined, sent: false }

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    async (prev: typeof initialState, formData: FormData) => {
      const result = await sendPasswordResetEmail(prev, formData)
      if (!result.error) return { ...result, sent: true }
      return { ...result, sent: false }
    },
    initialState
  )
  const isSent = !isPending && state.sent === true

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-8 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2">
          <Link
            href="/login"
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            ← ログインへ戻る
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 pt-2">
            パスワードリセット
          </h2>
          <p className="text-sm text-zinc-500">
            登録済みのメールアドレスにリセット用リンクをお送りします
          </p>
        </div>

        {isSent ? (
          <div className="space-y-6">
            <div className="rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-5 text-center space-y-1">
              <p className="font-medium text-zinc-900">メールを送信しました</p>
              <p className="text-sm text-zinc-500">
                受信ボックスをご確認ください
              </p>
            </div>
            <Link href="/login">
              <Button
                variant="outline"
                className="w-full h-11 border-zinc-200 hover:bg-zinc-50"
              >
                ログイン画面へ戻る
              </Button>
            </Link>
          </div>
        ) : (
          <form action={formAction} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-zinc-700">
                メールアドレス
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="example@gym.com"
                className="h-11"
              />
            </div>
            {state.error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-sm text-red-600">{state.error}</p>
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-11 bg-zinc-900 hover:bg-zinc-700 text-white transition-colors"
              disabled={isPending}
            >
              {isPending ? '送信中...' : 'リセットメールを送信'}
            </Button>
          </form>
        )}

        <p className="text-center text-xs text-zinc-400">{APP_NAME}</p>
      </div>
    </div>
  )
}
