import { Skeleton } from '@/components/ui/skeleton'

export default function CustomerDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-32" />
      <div className="rounded-lg border border-zinc-200 bg-white p-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-36" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
