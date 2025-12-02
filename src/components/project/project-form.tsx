'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createProjectSchema, type CreateProjectInput } from '@/lib/validations/project'

interface ProjectFormProps {
  onSubmit: (data: CreateProjectInput) => void
  isLoading?: boolean
  defaultValues?: Partial<CreateProjectInput>
  submitLabel?: string
}

const platformOptions = [
  { value: 'CONSUMER_APP', label: '소비자 앱' },
  { value: 'SELLER_APP', label: '셀러 앱' },
  { value: 'BOTH', label: '모두' },
]

export function ProjectForm({
  onSubmit,
  isLoading,
  defaultValues,
  submitLabel = '프로젝트 생성',
}: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      platform: 'CONSUMER_APP',
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">프로젝트 제목 *</Label>
            <Input
              id="title"
              placeholder="예: 로그인 기능 개선"
              {...register('title')}
              disabled={isLoading}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Input
              id="description"
              placeholder="프로젝트에 대한 간단한 설명"
              {...register('description')}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platform">플랫폼 *</Label>
              <select
                id="platform"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('platform')}
                disabled={isLoading}
              >
                {platformOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appVersion">앱 버전</Label>
              <Input
                id="appVersion"
                placeholder="예: 2.3.0"
                {...register('appVersion')}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="releaseDate">릴리즈 예정일</Label>
              <Input
                id="releaseDate"
                type="date"
                {...register('releaseDate')}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prdNotionUrl">Notion PRD 링크</Label>
              <Input
                id="prdNotionUrl"
                placeholder="https://notion.so/..."
                {...register('prdNotionUrl')}
                disabled={isLoading}
              />
              {errors.prdNotionUrl && (
                <p className="text-sm text-destructive">{errors.prdNotionUrl.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>PRD 내용 *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Textarea
              id="prdContent"
              placeholder="Epic PRD 내용을 붙여넣기 하세요. AI가 이 내용을 분석하여 테스트 시나리오를 생성합니다."
              rows={15}
              {...register('prdContent')}
              disabled={isLoading}
            />
            {errors.prdContent && (
              <p className="text-sm text-destructive">{errors.prdContent.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '처리 중...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
