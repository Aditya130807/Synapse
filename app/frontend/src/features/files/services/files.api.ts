import api from '@/lib/api';
import type {
  ListFilesParams,
  ListFilesResponse,
  UploadFileResponse,
  PreviewContentResponse,
  KnowledgeFile,
} from '../types/files.types';

export async function uploadFileApi(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadFileResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<UploadFileResponse>('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });

  return response.data;
}

export async function listFilesApi(params?: ListFilesParams): Promise<ListFilesResponse> {
  const response = await api.get<ListFilesResponse>('/files', { params });
  return response.data;
}

export async function getFileApi(id: string): Promise<{ status: string; data: KnowledgeFile }> {
  const response = await api.get<{ status: string; data: KnowledgeFile }>(`/files/${id}`);
  return response.data;
}

export async function getFilePreviewTextApi(id: string): Promise<PreviewContentResponse> {
  const response = await api.get<PreviewContentResponse>(`/files/${id}/preview`);
  return response.data;
}

export async function getFilePreviewBlobApi(id: string): Promise<Blob> {
  const response = await api.get<Blob>(`/files/${id}/preview`, {
    responseType: 'blob',
  });
  return response.data;
}

export async function downloadFileApi(id: string, filename: string): Promise<void> {
  const response = await api.get(`/files/${id}/download`, {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function uploadConversationFileApi(
  conversationId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadFileResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<UploadFileResponse>(`/chat/${conversationId}/files`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });

  return response.data;
}

export async function attachExistingFileApi(
  conversationId: string,
  fileId: string
): Promise<{ status: string; data: any; attached: boolean }> {
  const response = await api.post(`/chat/${conversationId}/files/attach`, { fileId });
  return response.data;
}

export async function detachConversationFileApi(
  conversationId: string,
  fileId: string
): Promise<{ status: string; data: any }> {
  const response = await api.delete(`/chat/${conversationId}/files/${fileId}`);
  return response.data;
}

export async function listConversationFilesApi(
  conversationId: string
): Promise<{ status: string; data: any[] }> {
  const response = await api.get(`/chat/${conversationId}/files`);
  return response.data;
}

export async function getAvailableKnowledgeFilesApi(
  conversationId?: string
): Promise<{ status: string; data: KnowledgeFile[] }> {
  const response = await api.get(`/knowledge/available`, {
    params: { conversationId },
  });
  return response.data;
}

export async function updateFileApi(id: string, filename: string): Promise<{ status: string; data: KnowledgeFile }> {
  const response = await api.patch<{ status: string; data: KnowledgeFile }>(`/files/${id}`, { filename });
  return response.data;
}

export async function deleteFileApi(id: string): Promise<{ status: string; message: string }> {
  const response = await api.delete<{ status: string; message: string }>(`/files/${id}`);
  return response.data;
}

