'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface SidebarContextType {
  isOpen: boolean
  toggle: () => void
  close: () => void
  open: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

function getInitialState(): boolean {
  if (typeof window === 'undefined') return true
  const saved = localStorage.getItem('sidebar-open')
  return saved === null ? true : saved === 'true'
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)
  const [mounted, setMounted] = useState(false)

  // 클라이언트에서만 localStorage 값 적용
  useEffect(() => {
    setIsOpen(getInitialState())
    setMounted(true)
  }, [])

  // localStorage에 상태 저장
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebar-open', String(isOpen))
    }
  }, [isOpen, mounted])

  const toggle = () => setIsOpen((prev) => !prev)
  const close = () => setIsOpen(false)
  const open = () => setIsOpen(true)

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close, open }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
