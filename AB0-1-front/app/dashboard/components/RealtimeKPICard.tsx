import { Card } from '@/components/ui/card'

type Props = {
  title: string
  value: number | string
  suffix?: string
  hint?: string
  icon?: React.ReactNode
}

export default function RealtimeKPICard({ title, value, suffix, hint, icon }: Props) {
  return (
    <Card className="p-4 flex items-center gap-3">
      {icon}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-white/40">{title}</div>
        <div className="text-2xl font-bold truncate">
          {value}
          {suffix ? <span className="ml-1 text-sm text-white/40">{suffix}</span> : null}
        </div>
        {hint ? <div className="text-xs text-white/40 mt-1 truncate">{hint}</div> : null}
      </div>
    </Card>
  )
}

