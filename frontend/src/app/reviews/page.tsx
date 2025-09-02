'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { getAllReviews } from '@/services/reviews';
import { useTasks } from '@/hooks/use-tasks';
import { useProjects } from '@/hooks/use-projects';
import { EditReviewDialog } from '@/components/dialogs/edit-review-dialog';
import { 
  Users, 
  Search, 
  Calendar, 
  FolderOpen,
  AlertTriangle,
  Activity,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { Project, Task } from '@/types';
import { ReviewType } from '@/types/review';

const reviewTypeConfig = {
  [ReviewType.PREMORTEM]: {
    label: "사전 검토",
    description: "시작 전 위험 분석",
    icon: AlertTriangle,
    color: "bg-yellow-500",
    variant: "secondary" as const
  },
  [ReviewType.MIDMORTEM]: {
    label: "중간 검토", 
    description: "진행 중 점검",
    icon: Activity,
    color: "bg-blue-500",
    variant: "default" as const
  },
  [ReviewType.RETRO]: {
    label: "회고",
    description: "완료 후 학습",
    icon: RotateCcw,
    color: "bg-green-500",
    variant: "outline" as const
  }
};

export default function ReviewsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: allReviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['all-reviews'],
    queryFn: getAllReviews,
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
  const filteredReviews = allReviews?.filter(review => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const task = tasksMap[review.task_id];
    const project = task ? projectsMap[task.project_id] : null;
    
    return (
      review.positives.toLowerCase().includes(searchLower) ||
      review.negatives.toLowerCase().includes(searchLower) ||
      review.changes_next.toLowerCase().includes(searchLower) ||
      task?.title.toLowerCase().includes(searchLower) ||
      project?.name.toLowerCase().includes(searchLower) ||
      reviewTypeConfig[review.review_type].label.toLowerCase().includes(searchLower)
    );
  }) || [];

  // 통계 계산
  const stats = {
    total: allReviews?.length || 0,
    premortem: allReviews?.filter(r => r.review_type === ReviewType.PREMORTEM).length || 0,
    midmortem: allReviews?.filter(r => r.review_type === ReviewType.MIDMORTEM).length || 0,
    retro: allReviews?.filter(r => r.review_type === ReviewType.RETRO).length || 0,
  };

  if (reviewsLoading || tasksLoading || projectsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">리뷰를 불러오는 중...</p>
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
            <Users className="h-8 w-8" />
            리뷰 시스템
          </h1>
          <p className="text-muted-foreground">
            Premortem, Midmortem, Retrospective - 체계적인 리뷰 프로세스
          </p>
        </div>

        {/* 검색바 */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="리뷰 내용, 작업명, 프로젝트명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">전체 리뷰</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-yellow-600">사전 검토</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.premortem}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-600">중간 검토</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.midmortem}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-600">회고</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.retro}</div>
          </CardContent>
        </Card>
      </div>

      {/* 리뷰 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>리뷰 목록</CardTitle>
          <CardDescription>
            {filteredReviews.length ? 
              `${filteredReviews.length}개의 리뷰` : 
              "검색 조건에 맞는 리뷰가 없습니다"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {stats.total === 0 ? "작성된 리뷰가 없습니다" : "검색 결과가 없습니다"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {stats.total === 0 ? 
                  "프로젝트 상세 페이지에서 작업별로 리뷰를 작성해보세요" :
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
              {filteredReviews
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((review) => {
                  const task = tasksMap[review.task_id];
                  const project = task ? projectsMap[task.project_id] : null;
                  const config = reviewTypeConfig[review.review_type];
                  const Icon = config.icon;
                  
                  return (
                    <Card key={review.id} className="border-l-4 border-l-indigo-500">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={config.variant} className="flex items-center gap-1">
                                <Icon className="h-3 w-3" />
                                {config.label}
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(parseISO(review.created_at), 'yyyy-MM-dd')}
                              </Badge>
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
                            <EditReviewDialog review={review} taskId={review.task_id} />
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-green-600" />
                              {review.review_type === ReviewType.PREMORTEM ? "예상되는 장점" :
                               review.review_type === ReviewType.MIDMORTEM ? "잘 되고 있는 점" :
                               "잘했던 점"}
                            </h4>
                            <div className="bg-green-50 border border-green-200 rounded-md p-3">
                              <p className="text-sm">{review.positives}</p>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-1">
                              <TrendingDown className="h-3 w-3 text-red-600" />
                              {review.review_type === ReviewType.PREMORTEM ? "예상되는 위험" :
                               review.review_type === ReviewType.MIDMORTEM ? "문제점" :
                               "아쉬웠던 점"}
                            </h4>
                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                              <p className="text-sm">{review.negatives}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-1">
                            <ArrowRight className="h-3 w-3 text-blue-600" />
                            {review.review_type === ReviewType.PREMORTEM ? "사전 준비사항" :
                             review.review_type === ReviewType.MIDMORTEM ? "조정할 점" :
                             "다음에 바꿀 점"}
                          </h4>
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                            <p className="text-sm">{review.changes_next}</p>
                          </div>
                        </div>
                        
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