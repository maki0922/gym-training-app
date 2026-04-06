'use client'

import { useState } from 'react'
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
import { CATEGORIES } from '@/lib/constants'
import { addExercise } from '@/lib/actions/exercise'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddExerciseDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const handleClose = () => {
    setName('')
    setCategory('')
    setError(null)
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    setIsPending(true)
    setError(null)

    const formData = new FormData()
    formData.set('name', name)
    formData.set('category', category)

    const result = await addExercise(undefined, formData)
    setIsPending(false)

    if (result.error) {
      setError(result.error)
    } else {
      handleClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>種目を追加</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="add-name">種目名</Label>
            <Input
              id="add-name"
              type="text"
              placeholder="例: ダンベルカール"
              className="h-11"
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-category">カテゴリ</Label>
            <select
              id="add-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="" disabled>カテゴリを選択</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-zinc-900 hover:bg-zinc-700 text-white"
            disabled={isPending || !name || !category}
          >
            {isPending ? '追加中...' : '追加する'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
