'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  useNotifications, 
  usePendingNotifications, 
  useNotificationSettings,
  useNotificationStats,
  useGenerateNotifications,
  useMarkNotificationRead,
  useDismissNotification,
  useUpdateNotificationSettings
} from '@/hooks/use-notifications';
import { NotificationStatus, NotificationType, NotificationSettings } from '@/types';
import { 
  Bell, 
  Settings, 
  CheckCircle, 
  X, 
  AlertTriangle,
  Clock,
  FileText,
  Target,
  Calendar,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const notificationTypeConfig = {
  [NotificationType.DUE_DATE_REMINDER]: {
    label: '마감일 알림',
    icon: Calendar,
    color: 'bg-blue-100 text-blue-800'
  },
  [NotificationType.OVERDUE_TASK]: {
    label: '지연 작업',
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-800'
  },
  [NotificationType.MISSING_BRIEF]: {
    label: '5SB 미작성',
    icon: FileText,
    color: 'bg-yellow-100 text-yellow-800'
  },
  [NotificationType.MISSING_DOD]: {
    label: 'DoD 미설정',
    icon: Target,
    color: 'bg-orange-100 text-orange-800'
  },
  [NotificationType.STALE_TASK]: {
    label: '장기 미진행',
    icon: Clock,
    color: 'bg-gray-100 text-gray-800'
  },
  [NotificationType.REVIEW_SCHEDULE]: {
    label: '리뷰 스케줄',
    icon: MessageSquare,
    color: 'bg-purple-100 text-purple-800'
  }
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [settingsData, setSettingsData] = useState<Partial<NotificationSettings>>({});
  
  const { data: notifications, isLoading: notificationsLoading } = useNotifications();
  const { data: pendingNotifications } = usePendingNotifications();
  const { data: settings, isLoading: settingsLoading } = useNotificationSettings();
  const { data: stats } = useNotificationStats();
  
  const generateNotifications = useGenerateNotifications();
  const markRead = useMarkNotificationRead();
  const dismiss = useDismissNotification();
  const updateSettings = useUpdateNotificationSettings();

  // 설정이 로드되면 로컬 상태 초기화
  useEffect(() => {
    if (settings) {
      setSettingsData(settings);
    }
  }, [settings]);

  const handleMarkRead = (id: number) => {
    markRead.mutate(id);
  };

  const handleDismiss = (id: number) => {
    dismiss.mutate(id);
  };

  const handleGenerateNotifications = () => {
    generateNotifications.mutate();
  };

  const handleSettingsUpdate = () => {
    updateSettings.mutate(settingsData);
  };

  const handleSettingChange = (field: string, value: unknown) => {
    setSettingsData((prev: Partial<NotificationSettings>) => ({
      ...prev,
      [field]: value
    }));
  };

  if (notificationsLoading || settingsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">알림을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-8 w-8" />
              알림 센터
            </h1>
            <p className="text-muted-foreground">
              작업 관리 알림 및 리마인더 설정
            </p>
          </div>
          <Button 
            onClick={handleGenerateNotifications}
            disabled={generateNotifications.isPending}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {generateNotifications.isPending ? '생성 중...' : '알림 생성'}
          </Button>
        </div>

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                <p className="text-sm text-muted-foreground">대기 중</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
                <p className="text-sm text-muted-foreground">발송됨</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.read}</div>
                <p className="text-sm text-muted-foreground">읽음</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.dismissed}</div>
                <p className="text-sm text-muted-foreground">해제됨</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-sm text-muted-foreground">총 알림</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 탭 인터페이스 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications">알림 목록</TabsTrigger>
          <TabsTrigger value="settings">설정</TabsTrigger>
        </TabsList>

        {/* 알림 목록 탭 */}
        <TabsContent value="notifications" className="space-y-4">
          {/* 대기중인 알림 */}
          {pendingNotifications && pendingNotifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  대기중인 알림 ({pendingNotifications.length})
                </CardTitle>
                <CardDescription>
                  즉시 확인이 필요한 알림들입니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingNotifications.map((notification) => {
                  const config = notificationTypeConfig[notification.type];
                  const Icon = config.icon;
                  
                  return (
                    <div key={notification.id} className="flex items-start gap-3 p-3 border rounded-lg bg-orange-50">
                      <Icon className="h-5 w-5 text-orange-600 mt-1" />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{notification.title}</p>
                          <Badge variant="outline" className={config.color}>
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { 
                            addSuffix: true, 
                            locale: ko 
                          })}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleMarkRead(notification.id!)}
                          disabled={markRead.isPending}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDismiss(notification.id!)}
                          disabled={dismiss.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* 전체 알림 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>전체 알림</CardTitle>
              <CardDescription>
                {notifications?.length ? `${notifications.length}개의 알림` : '알림이 없습니다'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!notifications?.length ? (
                <div className="text-center py-8">
                  <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">알림이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => {
                    const config = notificationTypeConfig[notification.type];
                    const Icon = config.icon;
                    
                    return (
                      <div 
                        key={notification.id} 
                        className={`flex items-start gap-3 p-3 border rounded-lg ${
                          notification.status === NotificationStatus.READ ? 'bg-gray-50' : 'bg-white'
                        }`}
                      >
                        <Icon className="h-5 w-5 text-muted-foreground mt-1" />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{notification.title}</p>
                            <Badge variant="outline" className={config.color}>
                              {config.label}
                            </Badge>
                            <Badge variant={notification.status === NotificationStatus.READ ? 'secondary' : 'default'}>
                              {notification.status === NotificationStatus.PENDING && '대기'}
                              {notification.status === NotificationStatus.SENT && '발송'}
                              {notification.status === NotificationStatus.READ && '읽음'}
                              {notification.status === NotificationStatus.DISMISSED && '해제'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { 
                              addSuffix: true, 
                              locale: ko 
                            })}
                          </p>
                        </div>
                        {notification.status !== NotificationStatus.READ && notification.status !== NotificationStatus.DISMISSED && (
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleMarkRead(notification.id!)}
                              disabled={markRead.isPending}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDismiss(notification.id!)}
                              disabled={dismiss.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 설정 탭 */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                알림 설정
              </CardTitle>
              <CardDescription>
                알림 유형별 활성화 설정 및 주기 조정
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settingsData && (
                <>
                  {/* 마감일 알림 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">마감일 알림</Label>
                        <p className="text-sm text-muted-foreground">작업 마감일 기반 알림</p>
                      </div>
                      <Switch
                        checked={settingsData.enable_due_date_reminders}
                        onCheckedChange={(checked) => handleSettingChange('enable_due_date_reminders', checked)}
                      />
                    </div>
                    {settingsData.enable_due_date_reminders && (
                      <div className="ml-4">
                        <Label htmlFor="due_date_days">마감 며칠 전에 알림</Label>
                        <Input
                          id="due_date_days"
                          type="number"
                          min="1"
                          max="30"
                          value={settingsData.due_date_reminder_days}
                          onChange={(e) => handleSettingChange('due_date_reminder_days', parseInt(e.target.value))}
                          className="w-20 mt-1"
                        />
                      </div>
                    )}
                  </div>

                  {/* 5SB 미작성 알림 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">5SB 미작성 알림</Label>
                      <p className="text-sm text-muted-foreground">5문장 브리프가 없는 작업 알림</p>
                    </div>
                    <Switch
                      checked={settingsData.enable_missing_brief_alerts}
                      onCheckedChange={(checked) => handleSettingChange('enable_missing_brief_alerts', checked)}
                    />
                  </div>

                  {/* DoD 미설정 알림 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">DoD 미설정 알림</Label>
                      <p className="text-sm text-muted-foreground">완료 정의가 없는 작업 알림</p>
                    </div>
                    <Switch
                      checked={settingsData.enable_missing_dod_alerts}
                      onCheckedChange={(checked) => handleSettingChange('enable_missing_dod_alerts', checked)}
                    />
                  </div>

                  {/* 장기 미진행 작업 알림 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">장기 미진행 작업 알림</Label>
                        <p className="text-sm text-muted-foreground">오래된 진행중 작업 알림</p>
                      </div>
                      <Switch
                        checked={settingsData.enable_stale_task_alerts}
                        onCheckedChange={(checked) => handleSettingChange('enable_stale_task_alerts', checked)}
                      />
                    </div>
                    {settingsData.enable_stale_task_alerts && (
                      <div className="ml-4">
                        <Label htmlFor="stale_days">며칠 후 장기 미진행으로 간주</Label>
                        <Input
                          id="stale_days"
                          type="number"
                          min="1"
                          max="30"
                          value={settingsData.stale_task_days}
                          onChange={(e) => handleSettingChange('stale_task_days', parseInt(e.target.value))}
                          className="w-20 mt-1"
                        />
                      </div>
                    )}
                  </div>

                  {/* 정기 리뷰 알림 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">정기 리뷰 알림</Label>
                        <p className="text-sm text-muted-foreground">프로젝트 정기 리뷰 스케줄 알림</p>
                      </div>
                      <Switch
                        checked={settingsData.enable_review_reminders}
                        onCheckedChange={(checked) => handleSettingChange('enable_review_reminders', checked)}
                      />
                    </div>
                    {settingsData.enable_review_reminders && (
                      <div className="ml-4">
                        <Label htmlFor="review_frequency">리뷰 주기 (일)</Label>
                        <Input
                          id="review_frequency"
                          type="number"
                          min="1"
                          max="30"
                          value={settingsData.review_reminder_frequency_days}
                          onChange={(e) => handleSettingChange('review_reminder_frequency_days', parseInt(e.target.value))}
                          className="w-20 mt-1"
                        />
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={handleSettingsUpdate}
                    disabled={updateSettings.isPending}
                  >
                    {updateSettings.isPending ? '저장 중...' : '설정 저장'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}