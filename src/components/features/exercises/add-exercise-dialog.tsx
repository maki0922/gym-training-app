'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addExercise, CATEGORIES, type ExerciseActionState } from '@/lib/actions/exercise'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const initialState: ExerciseActionState = {}

export function AddExerciseDialog({ open, onOpenChange }: Props) {
  const [state, formAction, isPending] = useActionState(addExercise, initialState)

  useEffect(() => {
    if (state.success) {
      onOpenChange(false)
    }
  }, [state, onOpenChange])

  // ダイアログが閉じたらstateをリセットするためkeyを使う
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={open ? 'open' : 'closed'}>
        <DialogHeader>
          <DialogTitle>種目を追加</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="add-name">種目名</Label>
            <Input
              id="add-name"
              name="name"
              type="text"
              placeholder="例: ダンベルカール"
              className="h-11"
              maxLength={50}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-category">カテゴリ</Label>
            <select
              id="add-category"
              name="category"
              defaultValue=""
              className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              required
            >
              <option value="" disabled>カテゴリを選択</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {state.error && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
              <p className="text-sm text-red-600">{state.error}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button
              type="submit"
              className="bg-zinc-900 hover:bg-zinc-700 text-white"
              disabled={isPending}
            >
              {isPending ? '追加中...' : '追加する'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
