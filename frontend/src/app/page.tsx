'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useKPIs } from '@/hooks/use-dashboard';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Target,
  Activity,
  Users,
  FileText,
  GitBranch,
  Zap,
  Eye
} from 'lucide-react';

const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

export default function Dashboard() {
  const { data: kpis, isLoading, error } = useKPIs();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">대시보드를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">데이터를 불러올 수 없습니다</h3>
          <p className="text-muted-foreground">잠시 후 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  if (!kpis) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            대시보드
          </h1>
          <p className="text-muted-foreground">
            개인 운영 체계 성과 및 생산성 분석 - 데이터 기반 인사이트 제공
          </p>
        </div>
      </div>

      {/* 핵심 지표 (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">재작업률</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(kpis.rework_rate)}</div>
            <p className="text-xs text-muted-foreground">
              완료/진행 중 작업 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">컨텍스트 스위칭</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.context_switches_per_day.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              일일 평균 횟수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DoD 준수율</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(kpis.dod_adherence)}</div>
            <p className="text-xs text-muted-foreground">
              DoD 체크 완료 작업 비율
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">샘플 검증률</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(kpis.sample_validation_rate)}</div>
            <p className="text-xs text-muted-foreground">
              승인된 샘플 비율
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 완성도 지표 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            완성도 지표
          </CardTitle>
          <CardDescription>
            프로젝트 관리 체계의 완성도를 측정합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">5SB 작성률</span>
                <span className="text-sm text-muted-foreground">
                  {formatPercentage(kpis.brief_completion_rate)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${kpis.brief_completion_rate * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">DoD 정의율</span>
                <span className="text-sm text-muted-foreground">
                  {formatPercentage(kpis.dod_definition_rate)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${kpis.dod_definition_rate * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">평균 프로젝트 완료율</span>
                <span className="text-sm text-muted-foreground">
                  {formatPercentage(kpis.avg_project_completion)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: `${kpis.avg_project_completion * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 현황 개요 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 프로젝트</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total_projects}</div>
            <p className="text-xs text-muted-foreground">
              관리 중인 프로젝트 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 작업</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total_tasks}</div>
            <p className="text-xs text-muted-foreground">
              등록된 작업 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">리뷰 건수</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total_reviews}</div>
            <p className="text-xs text-muted-foreground">
              작성된 리뷰 총합
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">의사결정</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total_decisions}</div>
            <p className="text-xs text-muted-foreground">
              기록된 의사결정 수
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 작업 상태 분포 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            작업 상태 분포
          </CardTitle>
          <CardDescription>
            현재 모든 작업의 상태별 분포 현황입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center space-y-2">
              <Badge variant="secondary" className="w-full justify-center">
                대기
              </Badge>
              <p className="text-2xl font-bold">{kpis.task_states.backlog}</p>
              <p className="text-xs text-muted-foreground">BACKLOG</p>
            </div>

            <div className="text-center space-y-2">
              <Badge variant="default" className="w-full justify-center">
                진행중
              </Badge>
              <p className="text-2xl font-bold">{kpis.task_states.in_progress}</p>
              <p className="text-xs text-muted-foreground">IN_PROGRESS</p>
            </div>

            <div className="text-center space-y-2">
              <Badge variant="secondary" className="w-full justify-center bg-green-100 text-green-800">
                완료
              </Badge>
              <p className="text-2xl font-bold">{kpis.task_states.done}</p>
              <p className="text-xs text-muted-foreground">DONE</p>
            </div>

            <div className="text-center space-y-2">
              <Badge variant="outline" className="w-full justify-center">
                중단
              </Badge>
              <p className="text-2xl font-bold">{kpis.task_states.paused}</p>
              <p className="text-xs text-muted-foreground">PAUSED</p>
            </div>

            <div className="text-center space-y-2">
              <Badge variant="destructive" className="w-full justify-center">
                취소
              </Badge>
              <p className="text-2xl font-bold">{kpis.task_states.canceled}</p>
              <p className="text-xs text-muted-foreground">CANCELED</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 최근 활동 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            최근 7일 활동
          </CardTitle>
          <CardDescription>
            지난 7일간의 활동 현황을 요약합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpis.recent_tasks}</p>
                <p className="text-sm text-muted-foreground">새 작업</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpis.recent_reviews}</p>
                <p className="text-sm text-muted-foreground">새 리뷰</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <GitBranch className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpis.recent_decisions}</p>
                <p className="text-sm text-muted-foreground">새 의사결정</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}