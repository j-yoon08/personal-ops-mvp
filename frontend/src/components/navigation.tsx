'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  FolderOpen, 
  CheckSquare, 
  FileText, 
  Target,
  MessageSquare,
  Users,
  Download,
  Home,
  Bell,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  {
    name: '대시보드',
    href: '/',
    icon: Home,
    description: 'KPI와 전체 현황'
  },
  {
    name: '프로젝트',
    href: '/projects',
    icon: FolderOpen,
    description: '프로젝트 관리'
  },
  {
    name: '작업',
    href: '/tasks',
    icon: CheckSquare,
    description: '작업 현황 및 관리'
  },
  {
    name: '5SB',
    href: '/briefs',
    icon: FileText,
    description: '5문장 요약서'
  },
  {
    name: 'DoD',
    href: '/dod',
    icon: Target,
    description: '완료 정의'
  },
  {
    name: '의사결정',
    href: '/decisions',
    icon: MessageSquare,
    description: 'Decision Log'
  },
  {
    name: '리뷰',
    href: '/reviews',
    icon: Users,
    description: 'Pre/Mid/Retro'
  },
  {
    name: '검색',
    href: '/search',
    icon: Search,
    description: '지식 검색 및 패턴 분석'
  },
  {
    name: '알림',
    href: '/notifications',
    icon: Bell,
    description: '알림 및 리마인더'
  },
  {
    name: '내보내기',
    href: '/exports',
    icon: Download,
    description: 'MD 내보내기'
  }
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl">Personal Ops</span>
            </Link>
          </div>

          {/* 네비게이션 메뉴 */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.name} href={item.href}>
                  <Button 
                    variant={isActive ? "default" : "ghost"} 
                    size="sm"
                    className={cn(
                      "flex items-center space-x-2",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* 모바일 메뉴 (향후 확장용) */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm">
              <BarChart3 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* 서브 네비게이션 (현재 페이지 설명) */}
        <div className="border-t py-2">
          <div className="flex items-center justify-between">
            <div>
              {navigation.find(item => item.href === pathname) && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>{navigation.find(item => item.href === pathname)?.description}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                MVP v1.0
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}