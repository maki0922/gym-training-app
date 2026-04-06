import { APP_NAME } from '@/lib/constants'

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-zinc-400">{APP_NAME}</p>
    </div>
  )
}
