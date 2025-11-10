'use client'

import * as React from 'react'

export type SidebarState = 'expanded' | 'collapsed'

export type SidebarContextProps = {
  state: SidebarState
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  openMobile: boolean
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>
  isMobile: boolean
  toggleSidebar: () => void
}


