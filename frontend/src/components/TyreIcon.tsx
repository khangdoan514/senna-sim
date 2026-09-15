/**
 * TyreIcon.tsx
 * 
 */

import { useState } from 'react'
import { compoundLetter, tyreIconSrc } from '../lib/tyreIcons'

// Image size classes
const imgSize: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-5 w-5 max-h-5 max-w-5',
  md: 'h-7 w-7 max-h-7 max-w-7',
  lg: 'h-9 w-9 max-h-9 max-w-9',
}

interface TyreIconProps {
  compound?: string
  tyre?: number | null // 0 to 4
  size?: keyof typeof imgSize
  className?: string
}

// Tyre icon
export default function TyreIcon({
  compound,
  tyre,
  size = 'md',
  className = '',
}: TyreIconProps) {
  const [failed, setFailed] = useState(false)
  const src = tyreIconSrc(compound, tyre)
  const letter = compoundLetter(compound, tyre)
  const showImg = Boolean(src && !failed)

  if (showImg) {
    return (
      <img
        src={src!}
        alt=""
        width={48}
        height={48}
        decoding="async"
        draggable={false}
        title={compound || 'Tyre compound'}
        className={`shrink-0 object-contain object-center ${imgSize[size]} ${className}`}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center font-mono text-xs font-bold tabular-nums text-gray-500 ${imgSize[size]} ${className}`}
      title={compound || 'Tyre'}
    >
      {letter}
    </span>
  )
}
