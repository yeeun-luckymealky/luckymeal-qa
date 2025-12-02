import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">
          럭키밀 QA
        </h1>
        <p className="text-lg text-gray-600 max-w-md">
          PRD를 입력하면 AI가 테스트 시나리오를 자동으로 생성합니다
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/login">로그인</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">회원가입</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
