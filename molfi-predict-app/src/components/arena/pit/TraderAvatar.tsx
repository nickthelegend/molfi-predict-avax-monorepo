/**
 * TraderAvatar - Deterministic colored initials avatar for traders
 */

import { cn } from '@/lib/utils'

// Deterministic color palette based on trader name hash
const AVATAR_COLORS = [
  { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  { bg: 'bg-violet-500/20', text: 'text-violet-400' },
  { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  { bg: 'bg-rose-500/20', text: 'text-rose-400' },
  { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  { bg: 'bg-pink-500/20', text: 'text-pink-400' },
  { bg: 'bg-teal-500/20', text: 'text-teal-400' },
  { bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
  { bg: 'bg-lime-500/20', text: 'text-lime-400' },
  { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-400' },
]

function hashName(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function getInitials(name: string): string {
  // Handle names like "CryptoWhale", "DeFi_Degen", "MEV_Bot_42"
  const parts = name.replace(/[_-]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

interface TraderAvatarProps {
  name: string
  size?: 'sm' | 'md'
  className?: string
}

export function TraderAvatar({ name, size = 'sm', className }: TraderAvatarProps) {
  const colorIndex = hashName(name) % AVATAR_COLORS.length
  const color = AVATAR_COLORS[colorIndex]
  const initials = getInitials(name)

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-bold flex-shrink-0',
        color.bg, color.text,
        size === 'sm' && 'h-5 w-5 text-[8px]',
        size === 'md' && 'h-6 w-6 text-[9px]',
        className
      )}
    >
      {initials}
    </div>
  )
}
