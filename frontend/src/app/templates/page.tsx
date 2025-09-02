'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useTemplates, 
  useRecommendedTemplates, 
  useBestPractices,
  useTemplateStats,
  useTemplateCategories,
  useGenerateTemplateFromProject,
  useInitSystemTemplates,
  useRecordTemplateUsage
} from '@/hooks/use-templates';
import { TemplateCategory, TemplateType, Template } from '@/types';
import { 
  BookTemplate, 
  Search, 
  Sparkles, 
  Award, 
  Copy,
  CheckCircle,
  Star,
  Bot,
  Settings,
  TrendingUp,
  Lightbulb,
  Target,
  FileText,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const templateTypeConfig = {
  [TemplateType.BRIEF]: { label: '5SB', icon: FileText, color: 'bg-blue-100 text-blue-800' },
  [TemplateType.DOD]: { label: 'DoD', icon: Target, color: 'bg-green-100 text-green-800' },
  [TemplateType.PROJECT]: { label: '프로젝트', icon: BookTemplate, color: 'bg-purple-100 text-purple-800' }
};

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState<TemplateType | 'all'>('all');
  const [recommendKeywords, setRecommendKeywords] = useState('');
  const [projectId, setProjectId] = useState('');

  // Hooks
  const { data: templates, isLoading: templatesLoading } = useTemplates(
    selectedCategory === 'all' ? undefined : selectedCategory,
    selectedType === 'all' ? undefined : selectedType
  );
  
  const { data: recommendations, isLoading: recommendLoading } = useRecommendedTemplates(
    recommendKeywords, 
    10, 
    recommendKeywords.length >= 2
  );
  
  const { data: bestPractices } = useBestPractices(
    selectedCategory === 'all' ? undefined : selectedCategory
  );
  
  const { data: stats } = useTemplateStats();
  const { data: categories } = useTemplateCategories();
  
  const generateTemplate = useGenerateTemplateFromProject();
  const initSystemTemplates = useInitSystemTemplates();
  const recordUsage = useRecordTemplateUsage();

  const handleUseTemplate = (template: Template) => {
    // 템플릿 사용 기록
    recordUsage.mutate({
      templateId: template.id,
      usageData: {
        used_for: 'template_browsing'
      }
    });

    // 템플릿 내용을 클립보드에 복사
    const contentText = JSON.stringify(template.content, null, 2);
    navigator.clipboard.writeText(contentText).then(() => {
      // 성공 처리는 recordUsage의 onSuccess에서 처리됨
    });
  };

  const handleGenerateFromProject = () => {
    const id = parseInt(projectId);
    if (id > 0) {
      generateTemplate.mutate(id);
      setProjectId('');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookTemplate className="h-8 w-8" />
              템플릿 & 베스트 프랙티스
            </h1>
            <p className="text-muted-foreground">
              검증된 템플릿으로 빠르고 일관된 프로젝트 시작
            </p>
          </div>
          <Button 
            onClick={() => initSystemTemplates.mutate()}
            disabled={initSystemTemplates.isPending}
            variant="outline"
          >
            <Settings className="mr-2 h-4 w-4" />
            {initSystemTemplates.isPending ? '초기화 중...' : '시스템 템플릿 초기화'}
          </Button>
        </div>

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{stats.template_stats.total_templates}</div>
                <p className="text-sm text-muted-foreground">총 템플릿</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.template_stats.system_templates}</div>
                <p className="text-sm text-muted-foreground">시스템 제공</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.template_stats.ai_generated_templates}</div>
                <p className="text-sm text-muted-foreground">AI 생성</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.summary.categories_covered}</div>
                <p className="text-sm text-muted-foreground">카테고리</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">템플릿 둘러보기</TabsTrigger>
          <TabsTrigger value="recommend">맞춤 추천</TabsTrigger>
          <TabsTrigger value="practices">베스트 프랙티스</TabsTrigger>
          <TabsTrigger value="generate">AI 템플릿 생성</TabsTrigger>
        </TabsList>

        {/* 템플릿 둘러보기 탭 */}
        <TabsContent value="browse" className="space-y-6">
          {/* 필터 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                템플릿 필터
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as TemplateCategory | 'all')}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 카테고리</SelectItem>
                  {categories?.categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as TemplateType | 'all')}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="템플릿 타입" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 타입</SelectItem>
                  {Object.entries(templateTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* 템플릿 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templatesLoading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground">템플릿을 불러오는 중...</p>
              </div>
            ) : !templates?.templates.length ? (
              <div className="col-span-full text-center py-8">
                <BookTemplate className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">템플릿이 없습니다</p>
              </div>
            ) : (
              templates.templates.map((template) => {
                const typeConfig = templateTypeConfig[template.template_type];
                const TypeIcon = typeConfig.icon;

                return (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base mb-2">{template.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {template.description}
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={typeConfig.color}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {typeConfig.label}
                        </Badge>
                        
                        {template.is_system_template && (
                          <Badge variant="secondary">
                            <Settings className="h-3 w-3 mr-1" />
                            시스템
                          </Badge>
                        )}
                        
                        {template.is_ai_generated && (
                          <Badge variant="outline" className="bg-purple-100 text-purple-800">
                            <Bot className="h-3 w-3 mr-1" />
                            AI
                          </Badge>
                        )}
                        
                        {template.success_rate && (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            <Star className="h-3 w-3 mr-1" />
                            {Math.round(template.success_rate * 100)}%
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      {/* 태그 */}
                      {template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {/* 통계 */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {template.usage_count}회 사용
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(template.created_at), { 
                            addSuffix: true, 
                            locale: ko 
                          })}
                        </span>
                      </div>
                      
                      {/* 액션 버튼 */}
                      <Button 
                        onClick={() => handleUseTemplate(template)}
                        className="w-full"
                        size="sm"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        템플릿 사용
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* 맞춤 추천 탭 */}
        <TabsContent value="recommend" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                키워드 기반 템플릿 추천
              </CardTitle>
              <CardDescription>
                프로젝트 키워드를 입력하면 가장 적합한 템플릿을 추천해드립니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="키워드를 쉼표로 구분해서 입력하세요 (예: 웹개발, React, API)"
                  value={recommendKeywords}
                  onChange={(e) => setRecommendKeywords(e.target.value)}
                  className="flex-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* 추천 결과 */}
          {recommendKeywords.length >= 2 && (
            <div className="space-y-4">
              {recommendLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                  <p className="text-muted-foreground">추천 템플릿을 찾는 중...</p>
                </div>
              ) : !recommendations?.recommendations.length ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Sparkles className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">관련 템플릿을 찾을 수 없습니다</p>
                  </CardContent>
                </Card>
              ) : (
                recommendations.recommendations.map((rec) => {
                  const typeConfig = templateTypeConfig[rec.template.template_type];
                  const TypeIcon = typeConfig.icon;

                  return (
                    <Card key={rec.template.id} className="border-l-4 border-l-yellow-500">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                              {rec.template.name}
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                <Star className="h-3 w-3 mr-1" />
                                {rec.relevance_score}점
                              </Badge>
                            </CardTitle>
                            <CardDescription>{rec.template.description}</CardDescription>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={typeConfig.color}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {typeConfig.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        {/* 매칭 이유 */}
                        <div>
                          <p className="text-sm font-medium mb-2">추천 이유:</p>
                          <div className="space-y-1">
                            {rec.match_reasons.map((reason, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                {reason}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => handleUseTemplate(rec.template)}
                          size="sm"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          템플릿 사용
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </TabsContent>

        {/* 베스트 프랙티스 탭 */}
        <TabsContent value="practices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                베스트 프랙티스
              </CardTitle>
              <CardDescription>
                검증된 프로젝트 관리 방법론과 원칙들
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            {bestPractices?.best_practices.map((practice) => (
              <Card key={practice.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    {practice.title}
                    <Badge variant="outline">
                      신뢰도 {Math.round(practice.confidence_score * 100)}%
                    </Badge>
                  </CardTitle>
                  <CardDescription>{practice.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 핵심 원칙 */}
                  {practice.principles.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        핵심 원칙
                      </h4>
                      <ul className="space-y-1">
                        {practice.principles.map((principle, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {principle}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 해야 할 것들 */}
                  {practice.do_list.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-green-700">✅ 해야 할 것들</h4>
                      <ul className="space-y-1">
                        {practice.do_list.map((item, index) => (
                          <li key={index} className="text-sm text-green-700">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 하지 말아야 할 것들 */}
                  {practice.dont_list.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-red-700">❌ 하지 말아야 할 것들</h4>
                      <ul className="space-y-1">
                        {practice.dont_list.map((item, index) => (
                          <li key={index} className="text-sm text-red-700">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 예시 */}
                  {practice.examples.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">💡 예시</h4>
                      <ul className="space-y-1">
                        {practice.examples.map((example, index) => (
                          <li key={index} className="text-sm text-muted-foreground">• {example}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* AI 템플릿 생성 탭 */}
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                성공한 프로젝트에서 템플릿 생성
              </CardTitle>
              <CardDescription>
                완료율이 높은 프로젝트에서 자동으로 템플릿을 추출합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="프로젝트 ID를 입력하세요"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  type="number"
                />
                <Button 
                  onClick={handleGenerateFromProject}
                  disabled={generateTemplate.isPending || !projectId}
                >
                  <Bot className="mr-2 h-4 w-4" />
                  {generateTemplate.isPending ? '생성 중...' : '템플릿 생성'}
                </Button>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>조건:</strong> 완료율 80% 이상, 5SB 또는 DoD가 작성된 프로젝트만 템플릿으로 변환 가능합니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}