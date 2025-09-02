'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBriefByTask, updateBrief, deleteBrief } from "@/services/briefs";
import { toast } from "sonner";
import { BriefUpdate } from "@/types/brief";

const formSchema = z.object({
  purpose: z.string().min(1, "목적을 입력해주세요"),
  success_criteria: z.string().min(1, "성공 기준을 입력해주세요"),
  constraints: z.string().min(1, "제약사항을 입력해주세요"),
  priority: z.string().min(1, "우선순위를 입력해주세요"),
  validation: z.string().min(1, "검증 방법을 입력해주세요"),
});

type FormValues = z.infer<typeof formSchema>;

interface EditBriefDialogProps {
  taskId: number;
  triggerText?: string;
}

export function EditBriefDialog({ 
  taskId, 
  triggerText = "5SB 수정"
}: EditBriefDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: brief, isLoading } = useQuery({
    queryKey: ["brief", taskId],
    queryFn: () => getBriefByTask(taskId),
    enabled: open, // 다이얼로그가 열릴 때만 로드
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purpose: "",
      success_criteria: "",
      constraints: "",
      priority: "",
      validation: "",
    },
  });

  // 브리프 데이터가 로드되면 폼에 설정
  useEffect(() => {
    if (brief) {
      form.reset({
        purpose: brief.purpose,
        success_criteria: brief.success_criteria,
        constraints: brief.constraints,
        priority: brief.priority,
        validation: brief.validation,
      });
    }
  }, [brief, form]);

  const updateBriefMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: BriefUpdate }) => 
      updateBrief(id, data),
    onSuccess: () => {
      toast.success("5문장 브리프가 수정되었습니다!");
      queryClient.invalidateQueries({ queryKey: ["brief", taskId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "kpi"] });
      queryClient.invalidateQueries({ queryKey: ["all-briefs"] });
      setOpen(false);
    },
    onError: (error: unknown) => {
      const errorMessage = ((error as any)?.response?.data?.detail) || "브리프 수정에 실패했습니다.";
      toast.error(errorMessage);
      console.error("Error updating brief:", error);
    },
  });

  const deleteBriefMutation = useMutation({
    mutationFn: deleteBrief,
    onSuccess: () => {
      toast.success("5문장 브리프가 삭제되었습니다!");
      queryClient.invalidateQueries({ queryKey: ["brief", taskId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "kpi"] });
      queryClient.invalidateQueries({ queryKey: ["all-briefs"] });
      setOpen(false);
    },
    onError: (error: unknown) => {
      const errorMessage = ((error as any)?.response?.data?.detail) || "브리프 삭제에 실패했습니다.";
      toast.error(errorMessage);
      console.error("Error deleting brief:", error);
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!brief) return;
    updateBriefMutation.mutate({ id: brief.id, data: values });
  };

  const handleDelete = () => {
    if (!brief) return;
    if (window.confirm("정말로 5문장 브리프를 삭제하시겠습니까?")) {
      deleteBriefMutation.mutate(brief.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>5문장 브리프 (5SB) 수정</DialogTitle>
          <DialogDescription>
            작업의 핵심 내용을 5문장으로 요약합니다. 각 항목을 명확하게 작성해주세요.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            <span className="ml-2">브리프를 불러오는 중...</span>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>1. 목적 (Purpose) *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="이 작업의 목적과 배경을 설명하세요"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="success_criteria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>2. 성공 기준 (Success Criteria) *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="어떤 상태가 되면 성공한 것인지 구체적으로 설명하세요"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="constraints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>3. 제약사항 (Constraints) *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="시간, 자원, 기술적 제약사항을 설명하세요"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>4. 우선순위 (Priority) *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="왜 이 작업이 중요한지, 다른 작업과의 우선순위를 설명하세요"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="validation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>5. 검증 방법 (Validation) *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="결과물을 어떻게 검증하고 확인할 것인지 설명하세요"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between pt-4">
                <Button 
                  type="button" 
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteBriefMutation.isPending}
                >
                  {deleteBriefMutation.isPending ? "삭제 중..." : "삭제"}
                </Button>
                
                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setOpen(false)}
                  >
                    취소
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateBriefMutation.isPending}
                  >
                    {updateBriefMutation.isPending ? "수정 중..." : "수정"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}