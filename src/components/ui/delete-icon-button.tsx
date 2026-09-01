import type { ComponentProps } from 'react'
import { Trash2 } from 'lucide-react'

import { cn } from '#/lib/utils'

import { Button } from './button'

type DeleteIconButtonProps = Omit<
  ComponentProps<typeof Button>,
  'children' | 'size' | 'variant'
> & {
  'aria-label': string
}

export function DeleteIconButton({
  className,
  ...props
}: DeleteIconButtonProps) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className={cn(
        'shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
        className,
      )}
      {...props}
    >
      <Trash2 />
    </Button>
  )
}

