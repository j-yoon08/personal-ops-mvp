'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProjects } from '@/hooks/use-projects';
import { useTasks } from '@/hooks/use-tasks';
import { useMutation } from '@tanstack/react-query';
import { exportProjectToMarkdown, downloadMarkdownFile } from '@/services/exports';
import { toast } from 'sonner';
import { 
  Download, 
  FolderOpen, 
  FileText,
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  Pause,
  X,
  Info
} from 'lucide-react';
import { TaskState } from '@/types';
import { format } from 'date-fns';
import Link from 'next/link';

const stateConfig = {
  [TaskState.BACKLOG]: {
    label: '대기',
    icon: Clock,
    variant: 'secondary' as const,
    color: 'text-gray-600'
  },
  [TaskState.IN_PROGRESS]: {
    label: '진행중',
    icon: AlertCircle,
    variant: 'default' as const,
    color: 'text-blue-600'
  },
  [TaskState.DONE]: {
    label: '완료',
    icon: CheckCircle,
    variant: 'secondary' as const,
    color: 'text-green-600'
  },
  [TaskState.PAUSED]: {
    label: '중단',
    icon: Pause,
    variant: 'outline' as const,
    color: 'text-yellow-600'
  },
  [TaskState.CANCELED]: {
    label: '취소',
    icon: X,
    variant: 'destructive' as const,
    color: 'text-red-600'
  }
};

export default function ExportsPage() {
  const [exportingProjectId, setExportingProjectId] = useState<number | null>(null);
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: allTasks, isLoading: tasksLoading } = useTasks();

  const exportMutation = useMutation({
    mutationFn: async (projectId: number) => {
      setExportingProjectId(projectId);
      const blob = await exportProjectToMarkdown(projectId);
      const project = projects?.find(p => p.id === projectId);
      const filename = `${project?.name || 'project'}_${format(new Date(), 'yyyy-MM-dd')}.md`;
      downloadMarkdownFile(blob, filename);
      return filename;
    },
    onSuccess: (filename) => {
      toast.success(`${filename} 파일이 다운로드되었습니다!`);
    },
    onError: (error: unknown) => {
      const errorMessage = (error as any)?.response?.data?.detail || '내보내기에 실패했습니다.';
      toast.error(errorMessage);
      console.error('Export error:', error);
    },
    onSettled: () => {
      setExportingProjectId(null);
    }
  });

  // 프로젝트별 작업 통계 계산
  const getProjectStats = (projectId: number) => {
    if (!allTasks) return { total: 0, done: 0, completion: 0 };
    
    const projectTasks = allTasks.filter(task => task.project_id === projectId);
    const done = projectTasks.filter(task => task.state === TaskState.DONE).length;
    const total = projectTasks.length;
    const completion = total > 0 ? Math.round((done / total) * 100) : 0;
    
    return { total, done, completion };
  };

  const handleExport = (projectId: number) => {
    exportMutation.mutate(projectId);
  };

  if (projectsLoading || tasksLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">프로젝트를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Download className="h-8 w-8" />
            마크다운 내보내기
          </h1>
          <p className="text-muted-foreground">
            프로젝트를 마크다운 형태로 내보내기 - README, 블로그, Notion 등에 활용
          </p>
        </div>

        {/* 안내 메시지 */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            내보내기 파일에는 프로젝트 개요, 작업 목록, 5SB, DoD, 의사결정 로그, 리뷰 데이터가 모두 포함됩니다.
          </AlertDescription>
        </Alert>
      </div>

      {/* 프로젝트 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>내보낼 프로젝트 선택</CardTitle>
          <CardDescription>
            {projects?.length ? 
              `${projects.length}개의 프로젝트 중 선택하여 마크다운으로 내보내세요` : 
              "내보낼 프로젝트가 없습니다"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!projects?.length ? (
            <div className="text-center py-12">
              <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">프로젝트가 없습니다</h3>
              <p className="text-muted-foreground mb-4">
                먼저 프로젝트를 생성한 후 내보내기를 사용해보세요.
              </p>
              <Button asChild>
                <Link href="/projects">프로젝트 만들기</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => {
                const stats = getProjectStats(project.id!);
                const isExporting = exportingProjectId === project.id;
                
                return (
                  <Card key={project.id} className="relative">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{project.name}</CardTitle>
                          {project.description && (
                            <CardDescription className="mb-3">
                              {project.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      
                      {/* 프로젝트 통계 */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CheckSquare className="h-4 w-4" />
                          <span>{stats.total}개 작업</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>{stats.completion}% 완료</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {/* 작업 상태별 미니 통계 */}
                      {allTasks && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {Object.entries(TaskState).map(([key, state]) => {
                            const count = allTasks.filter(task => 
                              task.project_id === project.id && task.state === state
                            ).length;
                            
                            if (count === 0) return null;
                            
                            const config = stateConfig[state];
                            const Icon = config.icon;
                            
                            return (
                              <Badge key={key} variant={config.variant} className="text-xs">
                                <Icon className="h-3 w-3 mr-1" />
                                {count}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* 내보내기 버튼 */}
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleExport(project.id!)}
                          disabled={isExporting || exportMutation.isPending}
                          className="flex-1"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {isExporting ? '내보내는 중...' : 'MD 다운로드'}
                        </Button>
                        <Button variant="outline" asChild>
                          <a href={`/projects/${project.id}`}>
                            <FileText className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 내보내기 형식 안내 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            내보내기 형식
          </CardTitle>
          <CardDescription>
            마크다운 파일에 포함되는 내용들
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">포함되는 정보</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  프로젝트 기본 정보 (이름, 설명, 생성일)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  프로젝트 통계 (작업 수, 완료율)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  작업 목록 및 상태
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  5문장 브리프 (5SB) 상세 내용
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  완료 정의 (DoD) 상세 내용
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  의사결정 로그 (문제, 옵션, 결정 사유, 위험요소, D+7 리뷰)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  리뷰 데이터 (Premortem, Midmortem, Retro 결과)
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">활용 방안</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• GitHub README.md 파일로 활용</li>
                <li>• Notion, Obsidian 등에 임포트</li>
                <li>• 블로그 포스트 작성 시 참고</li>
                <li>• 프로젝트 보고서 초안 작성</li>
                <li>• 팀 회의 자료로 활용</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}