'use client'

import { useState, useEffect } from 'react'
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
import { editExercise, CATEGORIES } from '@/lib/actions/exercise'
import type { Exercise } from '@/app/(dashboard)/admin/exercises/page'

type Props = {
  exercise: Exercise | null
  onClose: () => void
}

export function EditExerciseDialog({ exercise, onClose }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (exercise) {
      setName(exercise.name)
      setCategory(exercise.category)
      setError(null)
    }
  }, [exercise])

  const handleSubmit = async () => {
    if (!exercise) return
    setIsPending(true)
    setError(null)

    const formData = new FormData()
    formData.set('name', name)
    formData.set('category', category)

    const result = await editExercise(exercise.id, formData)
    setIsPending(false)

    if (result.error) {
      setError(result.error)
    } else {
      onClose()
    }
  }

  return (
    <Dialog open={!!exercise} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>種目を編集</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">種目名</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
              maxLength={50}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-category">カテゴリ</Label>
            <select
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
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
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-zinc-900 hover:bg-zinc-700 text-white"
            disabled={isPending}
          >
            {isPending ? '更新中...' : '更新する'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
