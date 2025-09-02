'use client';

import { useState } from 'react';
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
import { FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBrief } from "@/services/briefs";
import { toast } from "sonner";
import { BriefCreate } from "@/types/brief";

const formSchema = z.object({
  purpose: z.string().min(1, "목적을 입력해주세요"),
  success_criteria: z.string().min(1, "성공 기준을 입력해주세요"),
  constraints: z.string().min(1, "제약사항을 입력해주세요"),
  priority: z.string().min(1, "우선순위를 입력해주세요"),
  validation: z.string().min(1, "검증 방법을 입력해주세요"),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateBriefDialogProps {
  taskId: number;
  triggerText?: string;
}

export function CreateBriefDialog({ 
  taskId, 
  triggerText = "5SB 작성"
}: CreateBriefDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

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

  const createBriefMutation = useMutation({
    mutationFn: createBrief,
    onSuccess: (result) => {
      if (result === null) {
        // 409 에러나 기타 문제로 생성 실패
        toast.error("5문장 브리프 생성에 실패했습니다. (이미 존재하거나 서버 오류)");
        return;
      }
      
      // 생성 성공
      toast.success("5문장 브리프가 생성되었습니다!");
      queryClient.invalidateQueries({ queryKey: ["brief", taskId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "kpi"] });
      queryClient.invalidateQueries({ queryKey: ["all-briefs"] });
      form.reset();
      setOpen(false);
    },
    onError: (error: unknown) => {
      toast.error("브리프 생성 중 오류가 발생했습니다.");
      console.error("Error creating brief:", error);
    },
  });

  const onSubmit = async (values: FormValues) => {
    const briefData: BriefCreate = {
      task_id: taskId,
      ...values,
    };
    createBriefMutation.mutate(briefData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="mr-2 h-4 w-4" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>5문장 브리프 (5SB) 작성</DialogTitle>
          <DialogDescription>
            작업의 핵심 내용을 5문장으로 요약합니다. 각 항목을 명확하게 작성해주세요.
          </DialogDescription>
        </DialogHeader>
        
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
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                취소
              </Button>
              <Button 
                type="submit" 
                disabled={createBriefMutation.isPending}
              >
                {createBriefMutation.isPending ? "생성 중..." : "생성"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}