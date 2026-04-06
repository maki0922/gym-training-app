'use client'

import { useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { Exercise } from '@/app/(dashboard)/admin/exercises/page'
import { CATEGORIES, type Category } from '@/lib/constants'
import { deactivateExercise, reactivateExercise } from '@/lib/actions/exercise'
import { AddExerciseDialog } from './add-exercise-dialog'
import { EditExerciseDialog } from './edit-exercise-dialog'
import { DeactivateExerciseDialog } from './deactivate-exercise-dialog'
import { cn } from '@/lib/utils'

type Props = {
  exercises: Exercise[]
  isOwner: boolean
}

export function ExerciseList({ exercises, isOwner }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'すべて'>('すべて')
  const [showInactive, setShowInactive] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Exercise | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Exercise | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const filtered = exercises.filter((e) => {
    if (!isOwner && !e.isActive) return false
    if (!showInactive && !e.isActive) return false
    if (selectedCategory !== 'すべて' && e.category !== selectedCategory) return false
    return true
  })

  const handleReactivate = async (exercise: Exercise) => {
    setLoadingId(exercise.id)
    const result = await reactivateExercise(exercise.id)
    setLoadingId(null)
    if (result.error) {
      toast.error(result.error)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-900">種目マスタ</h1>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-zinc-900 hover:bg-zinc-700 text-white"
          >
            <Plus className="size-4" data-icon="inline-start" />
            種目を追加
          </Button>
        </div>

        {/* カテゴリフィルター */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {(['すべて', ...CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                selectedCategory === cat
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* オーナー向け: 無効化済み表示トグル */}
        {isOwner && (
          <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            無効化済みを表示
          </label>
        )}

        {/* PC: テーブル表示 */}
        <div className="hidden md:block">
          <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">種目名</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">カテゴリ</th>
                  {isOwner && (
                    <th className="px-4 py-3 text-right font-medium text-zinc-600">操作</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((exercise) => (
                  <tr key={exercise.id} className="border-b border-zinc-100 last:border-b-0">
                    <td className="px-4 py-3 text-zinc-900">
                      <span className="flex items-center gap-2">
                        {exercise.name}
                        {exercise.isSystem && (
                          <Badge variant="outline" className="text-xs">システム</Badge>
                        )}
                        {!exercise.isActive && (
                          <Badge className="bg-zinc-100 text-zinc-500 hover:bg-zinc-100 text-xs">無効</Badge>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{exercise.category}</td>
                    {isOwner && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {exercise.isActive ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setEditTarget(exercise)}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-zinc-500 hover:text-zinc-700"
                                onClick={() => setDeactivateTarget(exercise)}
                              >
                                無効化
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-zinc-500 hover:text-zinc-700"
                              onClick={() => handleReactivate(exercise)}
                              disabled={loadingId === exercise.id}
                            >
                              {loadingId === exercise.id ? '処理中...' : '再有効化'}
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* モバイル: カード表示 */}
        <div className="md:hidden space-y-2">
          {filtered.map((exercise) => (
            <Card key={exercise.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-zinc-900">{exercise.name}</span>
                    {exercise.isSystem && (
                      <Badge variant="outline" className="text-xs">システム</Badge>
                    )}
                    {!exercise.isActive && (
                      <Badge className="bg-zinc-100 text-zinc-500 hover:bg-zinc-100 text-xs">無効</Badge>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500">{exercise.category}</p>
                </div>
                {isOwner && (
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {exercise.isActive ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditTarget(exercise)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-zinc-500 hover:text-zinc-700"
                          onClick={() => setDeactivateTarget(exercise)}
                        >
                          無効化
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-500 hover:text-zinc-700"
                        onClick={() => handleReactivate(exercise)}
                        disabled={loadingId === exercise.id}
                      >
                        {loadingId === exercise.id ? '処理中...' : '再有効化'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <p>種目がありません</p>
          </div>
        )}
      </div>

      <AddExerciseDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditExerciseDialog exercise={editTarget} onClose={() => setEditTarget(null)} />
      <DeactivateExerciseDialog exercise={deactivateTarget} onClose={() => setDeactivateTarget(null)} />
    </>
  )
}
