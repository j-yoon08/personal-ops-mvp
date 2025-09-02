'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { getAllDecisions } from '@/services/decisions';
import { useTasks } from '@/hooks/use-tasks';
import { useProjects } from '@/hooks/use-projects';
import { D7ReviewDialog } from '@/components/dialogs/d7-review-dialog';
import { 
  MessageSquare, 
  Search, 
  Calendar, 
  FolderOpen,
  Clock,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Target
} from 'lucide-react';
import { Project, Task } from '@/types';
import { format, parseISO, addDays, isPast } from 'date-fns';
import Link from 'next/link';

export default function DecisionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: allDecisions, isLoading: decisionsLoading } = useQuery({
    queryKey: ['all-decisions'],
    queryFn: getAllDecisions,
    retry: false,
  });
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: projects, isLoading: projectsLoading } = useProjects();

  // 매핑 생성
  const tasksMap = tasks?.reduce((acc, task) => {
    acc[task.id!] = task;
    return acc;
  }, {} as Record<number, Task>) || {};

  const projectsMap = projects?.reduce((acc, project) => {
    acc[project.id!] = project;
    return acc;
  }, {} as Record<number, Project>) || {};

  // 검색 필터링
  const filteredDecisions = allDecisions?.filter(decision => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const task = tasksMap[decision.task_id];
    const project = task ? projectsMap[task.project_id] : null;
    
    return (
      decision.problem.toLowerCase().includes(searchLower) ||
      decision.options.toLowerCase().includes(searchLower) ||
      decision.decision_reason.toLowerCase().includes(searchLower) ||
      decision.assumptions_risks.toLowerCase().includes(searchLower) ||
      decision.d_plus_7_review?.toLowerCase().includes(searchLower) ||
      task?.title.toLowerCase().includes(searchLower) ||
      project?.name.toLowerCase().includes(searchLower)
    );
  }) || [];

  // 통계 계산
  const stats = {
    total: allDecisions?.length || 0,
    withReview: allDecisions?.filter(d => d.d_plus_7_review).length || 0,
    pendingReview: allDecisions?.filter(d => 
      !d.d_plus_7_review && isPast(addDays(parseISO(d.date), 7))
    ).length || 0,
  };

  if (decisionsLoading || tasksLoading || projectsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">의사결정을 불러오는 중...</p>
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
            <MessageSquare className="h-8 w-8" />
            의사결정 로그
          </h1>
          <p className="text-muted-foreground">
            Decision Log + D+7 리뷰 - 중요한 의사결정과 회고
          </p>
        </div>

        {/* 검색바 */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="의사결정 내용, 작업명, 프로젝트명으로 검색..."
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
            <CardTitle className="text-lg">전체 의사결정</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">리뷰 완료</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.withReview}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">리뷰 대기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.pendingReview}</div>
          </CardContent>
        </Card>
      </div>

      {/* 의사결정 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>의사결정 목록</CardTitle>
          <CardDescription>
            {filteredDecisions.length ? 
              `${filteredDecisions.length}개의 의사결정 기록` : 
              "검색 조건에 맞는 의사결정이 없습니다"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDecisions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {stats.total === 0 ? "작성된 의사결정이 없습니다" : "검색 결과가 없습니다"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {stats.total === 0 ? 
                  "프로젝트 상세 페이지에서 작업별로 의사결정을 기록해보세요" :
                  "다른 검색어로 시도해보세요"
                }
              </p>
              {stats.total === 0 && (
                <Button asChild>
                  <Link href="/projects">프로젝트 보기</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredDecisions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((decision) => {
                  const task = tasksMap[decision.task_id];
                  const project = task ? projectsMap[task.project_id] : null;
                  const reviewDate = addDays(parseISO(decision.date), 7);
                  const isReviewTime = isPast(reviewDate);
                  
                  return (
                    <Card key={decision.id} className="border-l-4 border-l-purple-500">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(parseISO(decision.date), 'yyyy-MM-dd')}
                              </Badge>
                              {decision.d_plus_7_review ? (
                                <Badge variant="default" className="bg-green-600 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  리뷰 완료
                                </Badge>
                              ) : isReviewTime ? (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  리뷰 필요
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  리뷰 대기
                                </Badge>
                              )}
                            </div>
                            
                            {task && (
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                <div className="flex items-center gap-1">
                                  <FolderOpen className="h-4 w-4" />
                                  <Link 
                                    href={`/projects/${task.project_id}`}
                                    className="hover:underline"
                                  >
                                    {project?.name || `프로젝트 ${task.project_id}`}
                                  </Link>
                                </div>
                                <span>→ {task.title}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <D7ReviewDialog
                              decisionId={decision.id}
                              taskId={decision.task_id}
                              decisionDate={decision.date}
                              existingReview={decision.d_plus_7_review}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            문제 상황
                          </h4>
                          <p className="text-sm">{decision.problem}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-1 flex items-center gap-1">
                            <Lightbulb className="h-3 w-3" />
                            검토한 옵션들
                          </h4>
                          <p className="text-sm">{decision.options}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-1 flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            결정 이유
                          </h4>
                          <p className="text-sm">{decision.decision_reason}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-1">가정사항 & 리스크</h4>
                          <p className="text-sm">{decision.assumptions_risks}</p>
                        </div>

                        {decision.d_plus_7_review && (
                          <div className="border-t pt-4">
                            <h4 className="font-semibold text-sm text-muted-foreground mb-1 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              D+7 리뷰 ({format(reviewDate, 'yyyy-MM-dd')})
                            </h4>
                            <p className="text-sm bg-muted p-3 rounded-md">{decision.d_plus_7_review}</p>
                          </div>
                        )}
                        
                        <div className="flex justify-end pt-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/projects/${task?.project_id}`}>
                              작업 보기
                            </Link>
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
    </div>
  );
}