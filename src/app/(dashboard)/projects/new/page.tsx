'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ProjectForm } from '@/components/project/project-form'
import type { CreateProjectInput } from '@/lib/validations/project'

export default function NewProjectPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: CreateProjectInput) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error('프로젝트 생성 실패', {
          description: result.error?.message || '다시 시도해주세요.',
        })
        return
      }

      toast.success('프로젝트가 생성되었습니다')
      router.push(`/projects/${result.data.id}`)
    } catch (error) {
      toast.error('오류 발생', {
        description: '잠시 후 다시 시도해주세요.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">새 프로젝트</h1>
      <ProjectForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
