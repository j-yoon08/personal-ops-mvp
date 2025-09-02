'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  useUnifiedSearch, 
  useDecisionPatterns, 
  useSearchStats 
} from '@/hooks/use-search';
import { SearchResult } from '@/types';
import { 
  Search, 
  FileText, 
  FolderOpen, 
  CheckSquare, 
  Target, 
  MessageSquare, 
  Users, 
  TrendingUp,
  Clock,
  Brain,
  BookOpen
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';

const contentTypeConfig = {
  projects: { label: '프로젝트', icon: FolderOpen, color: 'bg-blue-100 text-blue-800' },
  tasks: { label: '작업', icon: CheckSquare, color: 'bg-green-100 text-green-800' },
  briefs: { label: '5SB', icon: FileText, color: 'bg-purple-100 text-purple-800' },
  dod: { label: 'DoD', icon: Target, color: 'bg-orange-100 text-orange-800' },
  decisions: { label: '의사결정', icon: MessageSquare, color: 'bg-red-100 text-red-800' },
  reviews: { label: '리뷰', icon: Users, color: 'bg-indigo-100 text-indigo-800' }
};

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('search');
  const [decisionQuery, setDecisionQuery] = useState('');

  // Debounce search queries
  const debouncedQuery = useDebounce(query, 300);
  const debouncedDecisionQuery = useDebounce(decisionQuery, 300);

  // Search hooks
  const { data: searchResults, isLoading: searchLoading } = useUnifiedSearch(
    debouncedQuery,
    selectedTypes.length > 0 ? selectedTypes : undefined,
    50,
    debouncedQuery.length >= 2
  );

  const { data: decisionPatterns, isLoading: decisionsLoading } = useDecisionPatterns(
    debouncedDecisionQuery,
    20,
    debouncedDecisionQuery.length >= 3
  );

  const { data: stats } = useSearchStats();

  // Memoized results for better performance
  const sortedResults = useMemo(() => {
    if (!searchResults?.results) return {};

    const sorted: Record<string, SearchResult[]> = {};
    
    Object.entries(searchResults.results).forEach(([type, results]) => {
      if (results && results.length > 0) {
        sorted[type] = [...results].sort((a, b) => b.relevance_score - a.relevance_score);
      }
    });

    return sorted;
  }, [searchResults]);

  const handleTypeToggle = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedTypes(prev => [...prev, type]);
    } else {
      setSelectedTypes(prev => prev.filter(t => t !== type));
    }
  };

  const getResultLink = (result: SearchResult) => {
    switch (result.type) {
      case 'project':
        return `/projects/${result.id}`;
      case 'task':
        return `/projects/${result.project_id}`;
      default:
        return `/projects/${result.project_id}`;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Search className="h-8 w-8" />
            지식 검색
          </h1>
          <p className="text-muted-foreground">
            축적된 프로젝트 경험과 지식을 검색하고 재활용하세요
          </p>
        </div>

        {/* 검색 통계 */}
        {stats && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.content_summary.total}</p>
                  <p className="text-sm text-muted-foreground">총 콘텐츠</p>
                </div>
                {Object.entries(contentTypeConfig).map(([type, config]) => {
                  const count = stats.content_summary[type as keyof typeof stats.content_summary];
                  const Icon = config.icon;
                  return (
                    <div key={type} className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Icon className="h-4 w-4" />
                        <p className="text-lg font-bold">{count}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{config.label}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">통합 검색</TabsTrigger>
          <TabsTrigger value="patterns">의사결정 패턴</TabsTrigger>
        </TabsList>

        {/* 통합 검색 탭 */}
        <TabsContent value="search" className="space-y-6">
          {/* 검색 입력 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                통합 검색
              </CardTitle>
              <CardDescription>
                모든 프로젝트 데이터에서 키워드를 검색합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 검색어 입력 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="검색어를 입력하세요 (최소 2글자)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* 콘텐츠 타입 필터 */}
              <div className="space-y-2">
                <p className="text-sm font-medium">검색 대상 (선택하지 않으면 전체 검색)</p>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(contentTypeConfig).map(([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={type}
                          checked={selectedTypes.includes(type)}
                          onCheckedChange={(checked) => handleTypeToggle(type, !!checked)}
                        />
                        <label htmlFor={type} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Icon className="h-4 w-4" />
                          {config.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 검색 결과 */}
          {debouncedQuery.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  검색 결과
                  {searchResults && (
                    <Badge variant="outline">
                      {searchResults.total_results}개 결과
                    </Badge>
                  )}
                </CardTitle>
                {searchResults && (
                  <CardDescription>
                    &quot;{searchResults.query}&quot;에 대한 검색 결과
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {searchLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                    <p className="text-muted-foreground">검색 중...</p>
                  </div>
                ) : Object.keys(sortedResults).length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">검색 결과가 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(sortedResults).map(([type, results]) => {
                      const config = contentTypeConfig[type as keyof typeof contentTypeConfig];
                      const Icon = config.icon;
                      
                      return (
                        <div key={type}>
                          <div className="flex items-center gap-2 mb-3">
                            <Icon className="h-5 w-5" />
                            <h3 className="text-lg font-semibold">{config.label}</h3>
                            <Badge variant="outline">{results.length}개</Badge>
                          </div>
                          
                          <div className="space-y-3">
                            {results.map((result) => (
                              <div key={`${result.type}-${result.id}`} className="border rounded-lg p-4 hover:bg-muted/50">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Link 
                                        href={getResultLink(result)}
                                        className="font-medium text-primary hover:underline"
                                      >
                                        {result.title}
                                      </Link>
                                      <Badge variant="outline" className={config.color}>
                                        {config.label}
                                      </Badge>
                                      <Badge variant="secondary">
                                        관련도 {result.relevance_score}%
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {result.content}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDistanceToNow(new Date(result.created_at), { 
                                          addSuffix: true, 
                                          locale: ko 
                                        })}
                                      </span>
                                      {result.project_id && (
                                        <Link 
                                          href={`/projects/${result.project_id}`}
                                          className="text-primary hover:underline"
                                        >
                                          프로젝트 #{result.project_id}
                                        </Link>
                                      )}
                                      {result.task_id && (
                                        <span>작업 #{result.task_id}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 의사결정 패턴 탭 */}
        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                의사결정 패턴 분석
              </CardTitle>
              <CardDescription>
                과거 유사한 문제 상황의 의사결정 사례를 분석합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="문제 상황이나 키워드를 입력하세요 (최소 3글자)"
                  value={decisionQuery}
                  onChange={(e) => setDecisionQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {debouncedDecisionQuery.length >= 3 && (
                <>
                  {decisionsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                      <p className="text-muted-foreground">패턴 분석 중...</p>
                    </div>
                  ) : !decisionPatterns?.decision_patterns?.length ? (
                    <div className="text-center py-8">
                      <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">관련 의사결정 패턴을 찾을 수 없습니다</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">
                          &quot;{decisionPatterns.query}&quot;와 관련된 과거 의사결정
                        </h3>
                        <Badge variant="outline">
                          {decisionPatterns.decision_patterns.length}개 패턴
                        </Badge>
                      </div>
                      
                      {decisionPatterns.decision_patterns.map((pattern) => (
                        <Card key={pattern.id} className="border-l-4 border-l-blue-500">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{pattern.problem}</CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">
                                  관련도 {pattern.relevance_score}%
                                </Badge>
                                {pattern.has_review && (
                                  <Badge variant="outline" className="bg-green-100 text-green-800">
                                    리뷰 완료
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">선택지</p>
                              <p className="text-sm">{pattern.options}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">결정</p>
                              <p className="text-sm">{pattern.decision}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">위험요소</p>
                              <p className="text-sm">{pattern.risks}</p>
                            </div>
                            {pattern.d_plus_7_review && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">D+7 리뷰</p>
                                <p className="text-sm bg-muted p-2 rounded">{pattern.d_plus_7_review}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(pattern.created_at), { 
                                  addSuffix: true, 
                                  locale: ko 
                                })}
                              </span>
                              <Link 
                                href={`/tasks`}
                                className="text-primary hover:underline"
                              >
                                작업 #{pattern.task_id}
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}