import api from "./api";

export const exportProjectToMarkdown = async (projectId: number): Promise<Blob> => {
  const res = await api.get(`/exports/project/${projectId}/md`, {
    responseType: 'blob',
  });
  return res.data;
};

export const downloadMarkdownFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};