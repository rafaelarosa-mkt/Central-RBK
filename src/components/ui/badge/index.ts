import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
export { default as Badge } from './Badge.vue'

export const badgeVariants = cva(
  'inline-flex items-center justify-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 [&>svg]:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground',
        muted: 'border-transparent bg-muted text-muted-foreground',
        success: 'border-transparent bg-success-soft text-success',
        warning: 'border-transparent bg-warning-soft text-warning',
        danger: 'border-transparent bg-danger-soft text-destructive',
        info: 'border-transparent bg-accent text-accent-foreground',
      },
      dot: { true: "before:content-[''] before:size-1.5 before:rounded-full before:bg-current", false: '' },
    },
    defaultVariants: { variant: 'default', dot: false },
  },
)
export type BadgeVariants = VariantProps<typeof badgeVariants>
