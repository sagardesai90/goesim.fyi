'use client'

import * as React from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type SidebarInputProps = React.ComponentProps<typeof Input>

export function SidebarInput({ className, ...props }: SidebarInputProps) {
  return (
    <Input
      data-slot='sidebar-input'
      data-sidebar='input'
      className={cn('bg-background h-8 w-full shadow-none', className)}
      {...props}
    />
  )
}


