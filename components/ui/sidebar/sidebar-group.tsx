'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

type SidebarGroupProps = React.ComponentProps<'div'>

export function SidebarGroup({ className, ...props }: SidebarGroupProps) {
  return (
    <div
      data-slot='sidebar-group'
      data-sidebar='group'
      className={cn('relative flex w-full min-w-0 flex-col p-2', className)}
      {...props}
    />
  )
}


