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
import { Edit, Plus, X } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDoDByTask, updateDoD, deleteDoD } from "@/services/dod";
import { toast } from "sonner";
import { DoDUpdate } from "@/types/dod";

const formSchema = z.object({
  deliverable_formats: z.string().min(1, "결과물 형식을 입력해주세요"),
  mandatory_checks: z.array(z.object({ value: z.string().min(1, "체크 항목을 입력해주세요") })).min(1, "최소 1개의 체크 항목이 필요합니다"),
  quality_bar: z.string().min(1, "품질 기준을 입력해주세요"),
  verification: z.string().min(1, "검증 방법을 입력해주세요"),
  deadline: z.string().optional(),
  version_tag: z.string().min(1, "버전 태그를 입력해주세요"),
});

type FormValues = z.infer<typeof formSchema>;

interface EditDoDDialogProps {
  taskId: number;
  triggerText?: string;
}

export function EditDoDDialog({ 
  taskId, 
  triggerText = "DoD 수정"
}: EditDoDDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: dod, isLoading } = useQuery({
    queryKey: ["dod", taskId],
    queryFn: () => getDoDByTask(taskId),
    enabled: open,
  });

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

  const { fields, append, remove, replace } = useFieldArray<FormValues>({
    control: form.control,
    name: "mandatory_checks",
  });

  useEffect(() => {
    if (dod) {
      form.reset({
        deliverable_formats: dod.deliverable_formats,
        mandatory_checks: dod.mandatory_checks.length > 0 ? dod.mandatory_checks.map(check => ({ value: check })) : [{ value: "" }],
        quality_bar: dod.quality_bar,
        verification: dod.verification,
        deadline: dod.deadline || "",
        version_tag: dod.version_tag,
      });
      replace(dod.mandatory_checks.length > 0 ? dod.mandatory_checks.map(check => ({ value: check })) : [{ value: "" }]);
    }
  }, [dod, form, replace]);

  const updateDoDMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DoDUpdate }) => 
      updateDoD(id, data),
    onSuccess: () => {
      toast.success("DoD가 수정되었습니다!");
      queryClient.invalidateQueries({ queryKey: ["dod", taskId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "kpi"] });
      queryClient.invalidateQueries({ queryKey: ["all-dods"] });
      setOpen(false);
    },
    onError: (error: unknown) => {
      const errorMessage = ((error as any)?.response?.data?.detail) || "DoD 수정에 실패했습니다.";
      toast.error(errorMessage);
      console.error("Error updating DoD:", error);
    },
  });

  const deleteDoDMutation = useMutation({
    mutationFn: deleteDoD,
    onSuccess: () => {
      toast.success("DoD가 삭제되었습니다!");
      queryClient.invalidateQueries({ queryKey: ["dod", taskId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "kpi"] });
      queryClient.invalidateQueries({ queryKey: ["all-dods"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] }); // dod_checked 상태 업데이트
      setOpen(false);
    },
    onError: (error: unknown) => {
      const errorMessage = ((error as any)?.response?.data?.detail) || "DoD 삭제에 실패했습니다.";
      toast.error(errorMessage);
      console.error("Error deleting DoD:", error);
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!dod) return;
    const updateData: DoDUpdate = {
      deliverable_formats: values.deliverable_formats,
      mandatory_checks: values.mandatory_checks.map(check => check.value).filter(value => value.trim() !== ""),
      quality_bar: values.quality_bar,
      verification: values.verification,
      deadline: values.deadline || undefined,
      version_tag: values.version_tag,
    };
    updateDoDMutation.mutate({ id: dod.id, data: updateData });
  };

  const handleDelete = () => {
    if (!dod) return;
    if (window.confirm("정말로 DoD를 삭제하시겠습니까?")) {
      deleteDoDMutation.mutate(dod.id);
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
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>DoD (Definition of Done) 수정</DialogTitle>
          <DialogDescription>
            작업 완료를 위한 명확한 기준과 체크리스트를 수정합니다.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            <span className="ml-2">DoD를 불러오는 중...</span>
          </div>
        ) : (
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
              
              <div className="flex justify-between pt-4">
                <Button 
                  type="button" 
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteDoDMutation.isPending}
                >
                  {deleteDoDMutation.isPending ? "삭제 중..." : "삭제"}
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
                    disabled={updateDoDMutation.isPending}
                  >
                    {updateDoDMutation.isPending ? "수정 중..." : "수정"}
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