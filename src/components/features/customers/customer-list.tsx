'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Customer } from '@/app/(dashboard)/customers/page'
import { reactivateCustomer } from '@/lib/actions/customer'
import { AddCustomerDialog } from './add-customer-dialog'
import { EditCustomerDialog } from './edit-customer-dialog'
import { DeactivateCustomerDialog } from './deactivate-customer-dialog'

type Props = {
  customers: Customer[]
  isOwner: boolean
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

const GENDER_LABEL: Record<string, string> = {
  male: '男性',
  female: '女性',
  other: 'その他',
}

export function CustomerList({ customers, isOwner }: Props) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Customer | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Customer | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const filtered = customers.filter((c) => {
    if (!isOwner && !c.isActive) return false
    if (!showInactive && !c.isActive) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.nameKana.toLowerCase().includes(q)
    }
    return true
  })

  const handleReactivate = async (customer: Customer) => {
    setLoadingId(customer.id)
    const result = await reactivateCustomer(customer.id)
    setLoadingId(null)
    if (result.error) {
      toast.error(result.error)
    }
  }

  const handleRowClick = (customerId: string) => {
    router.push(`/customers/${customerId}`)
  }

  return (
    <>
      <div className="space-y-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-900">顧客一覧</h1>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-zinc-900 hover:bg-zinc-700 text-white"
          >
            <Plus className="size-4" data-icon="inline-start" />
            顧客を追加
          </Button>
        </div>

        {/* 検索フィールド */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="氏名・フリガナで検索"
            className="h-11 pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* オーナー向け: 退会済み表示トグル */}
        {isOwner && (
          <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            退会済みを表示
          </label>
        )}

        {/* PC: テーブル表示 */}
        <div className="hidden md:block">
          <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">氏名</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">フリガナ</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">性別</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">直近トレーニング</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 cursor-pointer"
                    onClick={() => handleRowClick(customer.id)}
                  >
                    <td className="px-4 py-3 text-zinc-900">
                      <span className="flex items-center gap-2">
                        {customer.name}
                        {!customer.isActive && (
                          <Badge className="bg-zinc-100 text-zinc-500 hover:bg-zinc-100 text-xs">退会済み</Badge>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{customer.nameKana}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {customer.gender ? GENDER_LABEL[customer.gender] : '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {customer.lastSessionDate ? formatDateShort(customer.lastSessionDate) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {customer.isActive ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setEditTarget(customer)}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            {isOwner && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-zinc-500 hover:text-zinc-700"
                                onClick={() => setDeactivateTarget(customer)}
                              >
                                退会処理
                              </Button>
                            )}
                          </>
                        ) : isOwner ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-500 hover:text-zinc-700"
                            onClick={() => handleReactivate(customer)}
                            disabled={loadingId === customer.id}
                          >
                            {loadingId === customer.id ? '処理中...' : '再有効化'}
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* モバイル: カード表示 */}
        <div className="md:hidden space-y-2">
          {filtered.map((customer) => (
            <Card
              key={customer.id}
              className="p-4 cursor-pointer hover:bg-zinc-50 transition-colors"
              onClick={() => handleRowClick(customer.id)}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-zinc-900">{customer.name}</span>
                    {!customer.isActive && (
                      <Badge className="bg-zinc-100 text-zinc-500 hover:bg-zinc-100 text-xs">退会済み</Badge>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500">{customer.nameKana}</p>
                  <div className="flex items-center gap-3 text-sm text-zinc-400">
                    {customer.gender && <span>{GENDER_LABEL[customer.gender]}</span>}
                    {customer.lastSessionDate && (
                      <span>最終: {formatDateShort(customer.lastSessionDate)}</span>
                    )}
                  </div>
                </div>
                <div
                  className="flex items-center gap-1 shrink-0 ml-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {customer.isActive ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditTarget(customer)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-zinc-500 hover:text-zinc-700"
                          onClick={() => setDeactivateTarget(customer)}
                        >
                          退会処理
                        </Button>
                      )}
                    </>
                  ) : isOwner ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-zinc-500 hover:text-zinc-700"
                      onClick={() => handleReactivate(customer)}
                      disabled={loadingId === customer.id}
                    >
                      {loadingId === customer.id ? '処理中...' : '再有効化'}
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <p>{searchQuery ? '検索条件に一致する顧客が見つかりません' : '顧客がいません'}</p>
          </div>
        )}
      </div>

      <AddCustomerDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditCustomerDialog customer={editTarget} onClose={() => setEditTarget(null)} />
      <DeactivateCustomerDialog customer={deactivateTarget} onClose={() => setDeactivateTarget(null)} />
    </>
  )
}
