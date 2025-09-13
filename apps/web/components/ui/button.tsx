import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // base
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all ease-out duration-200 " +
    "cursor-pointer outline-0 focus-visible:outline-none " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    // icon sizing default
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        outline:
          "border bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        outlineSupabase: [
          "border text-foreground",
          "bg-alternative dark:bg-muted",
          "hover:bg-selection",
          "border-line-strong hover:border-line-stronger",
          "focus-visible:outline-4 focus-visible:outline-offset-1 focus-visible:outline-brand-600",
          "data-[state=open]:bg-selection data-[state=open]:outline-brand-600 data-[state=open]:border-button-hover",
          "text-xs px-2.5 py-1 h-[26px]",
          // iconos chicos
          "[&_svg]:h-[14px] [&_svg]:w-[14px] text-foreground-lighter",
        ].join(" "),
        /** === Supabase-style brand variant (exacta) === */
        brandSupabase: [          
          "border text-foreground ",
          "bg-brand-400 dark:bg-brand-500 ",
          "border-brand-500/75 dark:border-brand/30 ",
          "hover:bg-brand/80 dark:hover:bg-brand/50 ",
          "hover:border-brand-600 dark:hover:border-brand ",
          "focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background ",
          "focus-visible:outline-4 focus-visible:outline-offset-1 focus-visible:outline-brand-600 ",
          "data-[state=open]:bg-brand-400/80 dark:data-[state=open]:bg-brand-500/80 data-[state=open]:outline-brand-600 ",
          "[&_svg]:h-[14px] [&_svg]:w-[14px] [&_svg]:text-brand-600",
        ].join(" "),
      },

      size: {
        tiny: "h-[26px] px-2.5 py-1 text-xs", // el tamaño del snippet
        sm: "h-8 rounded-md px-3 text-xs",
        default: "h-9 px-4 py-2",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)} // <-- fix aquí
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
