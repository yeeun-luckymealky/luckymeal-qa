'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles } from 'lucide-react'

interface PrdEditorModalProps {
  projectId: string
  currentPrd: string
  open: boolean
  onClose: () => void
  onGenerated: () => void
}

export function PrdEditorModal({
  projectId,
  currentPrd,
  open,
  onClose,
  onGenerated,
}: PrdEditorModalProps) {
  const [prdContent, setPrdContent] = useState(currentPrd)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveOnly = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prdContent }),
      })

      if (!response.ok) {
        toast.error('PRD 저장 실패')
        return
      }

      toast.success('PRD가 저장되었습니다')
      onClose()
    } catch {
      toast.error('오류 발생')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAndGenerate = async () => {
    setIsGenerating(true)
    try {
      // 1. PRD 저장
      const saveResponse = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prdContent }),
      })

      if (!saveResponse.ok) {
        toast.error('PRD 저장 실패')
        return
      }

      // 2. 시나리오 재생성
      const generateResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      const result = await generateResponse.json()

      if (!generateResponse.ok) {
        toast.error('시나리오 생성 실패', {
          description: result.error?.message || '다시 시도해주세요.',
        })
        return
      }

      toast.success(`${result.data.count}개의 시나리오가 생성되었습니다`)
      onGenerated()
      onClose()
    } catch {
      toast.error('오류 발생')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>PRD 수정 및 시나리오 생성</DialogTitle>
          <DialogDescription>
            PRD를 수정한 후 시나리오를 재생성할 수 있습니다.
            기존 시나리오는 삭제되고 새로 생성됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="prd">PRD 내용</Label>
            <Textarea
              id="prd"
              placeholder="PRD 내용을 입력하세요..."
              value={prdContent}
              onChange={(e) => setPrdContent(e.target.value)}
              rows={15}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              마크다운 형식을 지원합니다. 유저 스토리, 기능 요구사항, 플로우 등을 상세히 작성하면 더 좋은 시나리오가 생성됩니다.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button
              variant="secondary"
              onClick={handleSaveOnly}
              disabled={isSaving || isGenerating}
            >
              {isSaving ? '저장 중...' : 'PRD만 저장'}
            </Button>
            <Button
              onClick={handleSaveAndGenerate}
              disabled={isGenerating || isSaving || !prdContent.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  저장 및 재생성
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
