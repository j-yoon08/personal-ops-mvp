'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { getDoDByTask } from '@/services/dod';
import { useTasks } from '@/hooks/use-tasks';
import { useProjects } from '@/hooks/use-projects';
import { 
  Target, 
  Search, 
  Calendar, 
  FolderOpen,
  CheckSquare,
  FileText,
  Clock
} from 'lucide-react';
import { Project, Task, DoD } from '@/types';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';

export default function DoDPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: projects, isLoading: projectsLoading } = useProjects();

  // 프로젝트 매핑 생성
  const projectsMap = projects?.reduce((acc, project) => {
    acc[project.id!] = project;
    return acc;
  }, {} as Record<number, Project>) || {};

  // DoD가 있는 task들만 필터링하고 DoD 정보 가져오기
  const dodQueries = useQuery({
    queryKey: ['all-dods', tasks?.map(t => t.id).join(',')],
    queryFn: async () => {
      if (!tasks) return [];

      const settled = await Promise.allSettled(
        tasks.map(async (task) => {
          const dod = await getDoDByTask(task.id!);
          return dod ? { task, dod, project: projectsMap[task.project_id] } : null;
        })
      );

      return settled
        .filter((r): r is PromiseFulfilledResult<{ task: Task; dod: DoD; project: Project } | null> => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.value as { task: Task; dod: DoD; project: Project });
    },
    enabled: !!tasks && !!projects,
    retry: false,
  });

  const dodsWithTasks = dodQueries.data || [];

  // 검색 필터링
  const filteredDods = dodsWithTasks.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.task.title.toLowerCase().includes(searchLower) ||
      item.dod.deliverable_formats.toLowerCase().includes(searchLower) ||
      item.dod.mandatory_checks.some((check: string) => check.toLowerCase().includes(searchLower)) ||
      item.dod.quality_bar.toLowerCase().includes(searchLower) ||
      item.dod.verification.toLowerCase().includes(searchLower) ||
      (item.project?.name ?? '').toLowerCase().includes(searchLower)
    );
  });

  if (tasksLoading || projectsLoading || dodQueries.isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">DoD를 불러오는 중...</p>
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
            <Target className="h-8 w-8" />
            DoD (Definition of Done)
          </h1>
          <p className="text-muted-foreground">
            작성된 모든 완료 정의를 한 곳에서 관리
          </p>
        </div>

        {/* 검색바 */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="DoD 내용, 작업명, 프로젝트명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">전체 DoD</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dodsWithTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">전체 작업</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tasks?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">작성율</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {tasks?.length ? Math.round((dodsWithTasks.length / tasks.length) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DoD 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>DoD 목록</CardTitle>
          <CardDescription>
            {filteredDods.length ? 
              `${filteredDods.length}개의 완료 정의` : 
              "검색 조건에 맞는 DoD가 없습니다"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDods.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {dodsWithTasks.length === 0 ? "작성된 DoD가 없습니다" : "검색 결과가 없습니다"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {dodsWithTasks.length === 0 ? 
                  "프로젝트 상세 페이지에서 작업별로 DoD를 작성해보세요" :
                  "다른 검색어로 시도해보세요"
                }
              </p>
              {dodsWithTasks.length === 0 && (
                <Button asChild>
                  <Link href="/projects">프로젝트 보기</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredDods.map((item) => (
                <Card key={item.task.id} className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl mb-2">{item.task.title}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <FolderOpen className="h-4 w-4" />
                            <Link 
                              href={`/projects/${item.task.project_id}`}
                              className="hover:underline"
                            >
                              {item.project?.name || `프로젝트 ${item.task.project_id}`}
                            </Link>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(parseISO(item.dod.created_at), 'yyyy-MM-dd')}
                          </div>
                          <Badge variant="outline">{item.dod.version_tag}</Badge>
                        </div>
                      </div>
                      <Badge variant="secondary">P{item.task.priority}</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          결과물 형식
                        </h4>
                        <p className="text-sm">{item.dod.deliverable_formats}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1 flex items-center gap-1">
                          <CheckSquare className="h-3 w-3" />
                          검증 방법
                        </h4>
                        <p className="text-sm">{item.dod.verification}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-1">
                        <CheckSquare className="h-3 w-3" />
                        필수 체크 항목
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(item.dod.mandatory_checks as string[]).map((check: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                            <span>{check}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1">품질 기준</h4>
                      <p className="text-sm">{item.dod.quality_bar}</p>
                    </div>

                    {item.dod.deadline && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>마감일: {item.dod.deadline}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-end pt-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/projects/${item.task.project_id}`}>
                          작업 보기
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}