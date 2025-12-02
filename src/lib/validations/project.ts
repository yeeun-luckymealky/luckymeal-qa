import { z } from 'zod'

export const createProjectSchema = z.object({
  title: z.string().min(1, '프로젝트 제목을 입력해주세요'),
  description: z.string().optional(),
  prdContent: z.string().min(10, 'PRD 내용을 최소 10자 이상 입력해주세요'),
  prdNotionUrl: z.string().url('유효한 URL을 입력해주세요').optional().or(z.literal('')),
  appVersion: z.string().optional(),
  platform: z.enum(['CONSUMER_APP', 'SELLER_APP', 'BOTH']),
  releaseDate: z.string().optional(),
})

export const updateProjectSchema = createProjectSchema.partial()

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
