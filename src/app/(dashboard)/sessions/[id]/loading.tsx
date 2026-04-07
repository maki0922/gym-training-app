import { Skeleton } from '@/components/ui/skeleton'

export default function SessionDetailLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-32" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}
