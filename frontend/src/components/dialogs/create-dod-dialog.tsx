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
import { Target, Plus, X } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDoD } from "@/services/dod";
import { toast } from "sonner";
import { DoDCreate } from "@/types/dod";

const formSchema = z.object({
  deliverable_formats: z.string().min(1, "결과물 형식을 입력해주세요"),
  mandatory_checks: z.array(z.object({ value: z.string().min(1, "체크 항목을 입력해주세요") })).min(1, "최소 1개의 체크 항목이 필요합니다"),
  quality_bar: z.string().min(1, "품질 기준을 입력해주세요"),
  verification: z.string().min(1, "검증 방법을 입력해주세요"),
  deadline: z.string().optional(),
  version_tag: z.string().min(1, "버전 태그를 입력해주세요"),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateDoDDialogProps {
  taskId: number;
  triggerText?: string;
}

export function CreateDoDDialog({ 
  taskId, 
  triggerText = "DoD 작성"
}: CreateDoDDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deliverable_formats: "",
      mandatory_checks: [{ value: "" }],
      quality_bar: "",
      verification: "",
      deadline: "",
      version_tag: "v0.1",
    },
  });

  const { fields, append, remove } = useFieldArray<FormValues>({
    control: form.control,
    name: "mandatory_checks",
  });

  const createDoDMutation = useMutation({
    mutationFn: createDoD,
    onSuccess: (result) => {
      if (result === null) {
        toast.error("DoD 생성에 실패했습니다. (이미 존재하거나 서버 오류)");
        return;
      }
      
      toast.success("DoD가 생성되었습니다!");
      queryClient.invalidateQueries({ queryKey: ["dod", taskId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "kpi"] });
      queryClient.invalidateQueries({ queryKey: ["all-dods"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] }); // dod_checked 상태 업데이트
      form.reset();
      setOpen(false);
    },
    onError: (error: unknown) => {
      toast.error("DoD 생성 중 오류가 발생했습니다.");
      console.error("Error creating DoD:", error);
    },
  });

  const onSubmit = async (values: FormValues) => {
    const dodData: DoDCreate = {
      task_id: taskId,
      deliverable_formats: values.deliverable_formats,
      mandatory_checks: values.mandatory_checks.map(check => check.value).filter(value => value.trim() !== ""),
      quality_bar: values.quality_bar,
      verification: values.verification,
      deadline: values.deadline || undefined,
      version_tag: values.version_tag,
    };
    createDoDMutation.mutate(dodData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Target className="mr-2 h-4 w-4" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>DoD (Definition of Done) 작성</DialogTitle>
          <DialogDescription>
            작업 완료를 위한 명확한 기준과 체크리스트를 정의합니다.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="deliverable_formats"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>결과물 형식 *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="예: MD, PDF, PPTX, Code Repository"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>필수 체크 항목 *</FormLabel>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`mandatory_checks.${index}.value` as const}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              placeholder={`체크 항목 ${index + 1}`}
                              {...field}
                            />
                          </FormControl>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => remove(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ value: "" })}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  체크 항목 추가
                </Button>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="quality_bar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>품질 기준 *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="예: 오타율 0%, 최소 2명 리뷰 완료, 모든 테스트 통과"
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
              name="verification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>검증 방법 *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="예: 10% 샘플링 검토, 동료 리뷰, 자동 테스트"
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>마감일</FormLabel>
                    <FormControl>
                      <Input 
                        type="date"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="version_tag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>버전 태그 *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="v0.1"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
                disabled={createDoDMutation.isPending}
              >
                {createDoDMutation.isPending ? "생성 중..." : "생성"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}