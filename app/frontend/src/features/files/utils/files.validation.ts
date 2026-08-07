export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export const ALLOWED_EXTENSIONS = ['pdf', 'md', 'markdown', 'txt', 'docx', 'doc'];

export const FILE_ACCEPT_ATTRIBUTE = '.pdf,.md,.markdown,.txt,.docx,.doc,application/pdf,text/markdown,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateUploadFile(file: File): FileValidationResult {
  if (!file) {
    return { isValid: false, error: 'No file selected.' };
  }

  // 1. Validate file size (20 MB limit)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: 'File exceeds the maximum upload size of 20 MB.',
    };
  }

  // 2. Validate file extension
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      isValid: false,
      error: 'Unsupported file type. Please upload a PDF, Markdown, TXT, or DOCX file.',
    };
  }

  return { isValid: true };
}
