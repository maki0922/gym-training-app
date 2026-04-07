'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CATEGORIES } from '@/lib/constants'
import { ChevronLeft } from 'lucide-react'

export type ExerciseOption = {
  id: string
  name: string
  category: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercises: ExerciseOption[]
  onSelectExercise: (exerciseId: string) => void
  onFreeInput: (name: string) => void
}

type Step = 'category' | 'list' | 'free'

export function AddExerciseDialog({
  open,
  onOpenChange,
  exercises,
  onSelectExercise,
  onFreeInput,
}: Props) {
  const [step, setStep] = useState<Step>('category')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [freeName, setFreeName] = useState('')
  const [freeError, setFreeError] = useState<string | null>(null)

  const handleClose = () => {
    setStep('category')
    setSelectedCategory('')
    setFreeName('')
    setFreeError(null)
    onOpenChange(false)
  }

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
    setStep('list')
  }

  const handleExerciseSelect = (exerciseId: string) => {
    onSelectExercise(exerciseId)
    handleClose()
  }

  const handleFreeSubmit = () => {
    const trimmed = freeName.trim()
    if (!trimmed) {
      setFreeError('種目名を入力してください')
      return
    }
    if (trimmed.length > 50) {
      setFreeError('種目名は50文字以内で入力してください')
      return
    }
    onFreeInput(trimmed)
    handleClose()
  }

  const filteredExercises = exercises.filter((e) => e.category === selectedCategory)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === 'category' && '種目を追加'}
            {step === 'list' && (
              <button
                onClick={() => setStep('category')}
                className="inline-flex items-center gap-1 text-base"
              >
                <ChevronLeft className="size-4" />
                {selectedCategory}
              </button>
            )}
            {step === 'free' && (
              <button
                onClick={() => setStep('category')}
                className="inline-flex items-center gap-1 text-base"
              >
                <ChevronLeft className="size-4" />
                自由入力
              </button>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* ステップ1: カテゴリ選択 */}
        {step === 'category' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  variant="outline"
                  className="h-12 text-sm font-medium"
                  onClick={() => handleCategorySelect(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full h-12 text-sm font-medium text-zinc-500 border-dashed"
              onClick={() => setStep('free')}
            >
              自由入力
            </Button>
          </div>
        )}

        {/* ステップ2: 種目一覧 */}
        {step === 'list' && (
          <div className="flex-1 overflow-y-auto -mx-2">
            {filteredExercises.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">
                このカテゴリに種目がありません
              </p>
            ) : (
              <div className="space-y-0.5">
                {filteredExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => handleExerciseSelect(exercise.id)}
                    className="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-zinc-100 transition-colors"
                  >
                    {exercise.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 自由入力 */}
        {step === 'free' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="free-exercise-name">種目名</Label>
              <Input
                id="free-exercise-name"
                type="text"
                placeholder="例: ケーブルフライ"
                className="h-11"
                maxLength={50}
                value={freeName}
                onChange={(e) => {
                  setFreeName(e.target.value)
                  setFreeError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleFreeSubmit()
                  }
                }}
                autoFocus
              />
              {freeError && (
                <p className="text-sm text-red-600">{freeError}</p>
              )}
            </div>
            <Button
              className="w-full bg-zinc-900 hover:bg-zinc-700 text-white"
              onClick={handleFreeSubmit}
              disabled={!freeName.trim()}
            >
              追加する
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
