'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebar } from './sidebar-provider'
import {
  LayoutDashboard,
  FolderKanban,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const navigation = [
  { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My', href: '/my', icon: User },
  { name: '프로젝트', href: '/projects', icon: FolderKanban },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isOpen, toggle } = useSidebar()

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-gray-900 transition-all duration-300 relative',
        isOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* 토글 버튼 */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 border-2 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* 로고 */}
      <div className="flex h-16 items-center px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          {isOpen ? (
            <span className="text-xl font-bold text-white whitespace-nowrap">럭키밀 QA</span>
          ) : (
            <span className="text-xl font-bold text-white">🍀</span>
          )}
        </Link>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              title={!isOpen ? item.name : undefined}
              className={cn(
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isOpen ? 'gap-3' : 'justify-center',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {isOpen && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
