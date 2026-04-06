'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { sendPasswordResetEmail, type AuthActionState } from '@/lib/actions/auth'

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
    <Card>
      <CardHeader>
        <CardTitle className="text-center">パスワードリセット</CardTitle>
        <CardDescription className="text-center">
          登録済みのメールアドレスを入力してください。
          パスワード再設定用のリンクをお送りします。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-zinc-700">
              メールを送信しました。受信ボックスをご確認ください。
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                ログイン画面へ戻る
              </Button>
            </Link>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="example@gym.com"
              />
            </div>
            {state.error && (
              <p className="text-sm text-red-600">{state.error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? '送信中...' : 'リセットメールを送信'}
            </Button>
            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-zinc-500 hover:text-zinc-900 underline underline-offset-4"
              >
                ログイン画面へ戻る
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
