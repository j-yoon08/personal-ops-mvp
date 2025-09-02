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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUpdateProject, useDeleteProject } from "@/hooks/use-projects";
import { toast } from "sonner";
import { Project } from "@/types";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(1, "프로젝트 이름을 입력해주세요"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditProjectDialogProps {
  project: Project;
}

export function EditProjectDialog({ project }: EditProjectDialogProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();
  
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: project.name,
      description: project.description || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await updateProject.mutateAsync({
        id: project.id!,
        data: {
          name: values.name,
          description: values.description || undefined,
        }
      });
      toast.success("프로젝트가 수정되었습니다!");
      setEditOpen(false);
    } catch (error) {
      toast.error("프로젝트 수정에 실패했습니다.");
      console.error("Error updating project:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProject.mutateAsync(project.id!);
      toast.success("프로젝트가 삭제되었습니다!");
      setDeleteOpen(false);
      router.push('/projects');
    } catch (error) {
      toast.error("프로젝트 삭제에 실패했습니다.");
      console.error("Error deleting project:", error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            프로젝트 수정
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setDeleteOpen(true)}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            프로젝트 삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 수정 다이얼로그 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>프로젝트 수정</DialogTitle>
            <DialogDescription>
              프로젝트 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>프로젝트 이름 *</FormLabel>
                    <FormControl>
                      <Input placeholder="프로젝트 이름" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>설명 (선택)</FormLabel>
                    <FormControl>
                      <Input placeholder="프로젝트 설명" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditOpen(false)}
                >
                  취소
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateProject.isPending}
                >
                  {updateProject.isPending ? "수정 중..." : "수정"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>프로젝트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 <strong>&quot;{project.name}&quot;</strong> 프로젝트를 삭제하시겠습니까?
              <br />
              <br />
              <span className="text-red-600 font-medium">
                이 작업은 되돌릴 수 없으며, 프로젝트와 관련된 모든 작업도 함께 삭제됩니다.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteProject.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteProject.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}