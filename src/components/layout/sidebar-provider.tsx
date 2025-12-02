'use client'

import { createContext, useContext, useState, useEffect, useSyncExternalStore } from 'react'

interface SidebarContextType {
  isOpen: boolean
  toggle: () => void
  close: () => void
  open: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

// localStorage 구독 함수
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

function getSnapshot(): boolean {
  const saved = localStorage.getItem('sidebar-open')
  return saved === null ? true : saved === 'true'
}

function getServerSnapshot(): boolean {
  return true // SSR에서는 기본값 true
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // useSyncExternalStore로 localStorage와 동기화
  const storedValue = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [isOpen, setIsOpen] = useState(storedValue)

  // localStorage에 상태 저장
  useEffect(() => {
    localStorage.setItem('sidebar-open', String(isOpen))
  }, [isOpen])

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
