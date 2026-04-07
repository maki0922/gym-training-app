import { Skeleton } from '@/components/ui/skeleton'

export default function SessionEditLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-32" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  )
}
