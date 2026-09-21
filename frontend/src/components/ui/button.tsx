import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-control border border-transparent bg-clip-padding text-[13px] font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:outline-2 focus-visible:outline-ink-900 focus-visible:outline-offset-2 active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-lime-500 text-ink-900 hover:bg-lime-600 active:bg-lime-700 shadow-xs",
        secondary: "bg-[#ECECF4] text-ink-900 hover:bg-[#E2E2EC] border border-border/60",
        outline: "border-border bg-surface-solid/80 hover:bg-surface-tint text-ink-900 shadow-xs",
        ghost: "hover:bg-surface-tint text-ink-900 hover:text-ink-900",
        destructive: "bg-tile-peach-bg text-tile-peach-fg hover:bg-tile-peach-bg/80 border border-tile-peach-fg/30 font-semibold",
        link: "text-ink-900 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 gap-2",
        xs: "h-6 gap-1 rounded-chip px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-control px-3 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 text-sm",
        icon: "size-9 rounded-control",
        "icon-xs": "size-6 rounded-chip [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-control",
        "icon-lg": "size-10 rounded-control",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
