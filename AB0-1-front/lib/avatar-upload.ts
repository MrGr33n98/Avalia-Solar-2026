  import type { User } from './api';
import { buildApiUrl, getApiRequestHeaders } from './api-config';
import { ApiError, getApiErrorMessage } from './api-error';

const MAX_AVATAR_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1280;
const MIN_IMAGE_DIMENSION = 320;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'] as const;

type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export type AvatarUploadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

export type UploadUserAvatarOptions = {
  retries?: number;
  timeoutMs?: number;
  onProgress?: (progress: AvatarUploadProgress) => void;
};

export type UploadUserAvatarResult = {
  user: User;
  avatarUrl: string | null;
  attempts: number;
};

export class AvatarUploadClientError extends Error {
  code: string;

  constructor(message: string, code = 'AVATAR_UPLOAD_CLIENT_ERROR') {
    super(message);
    this.name = 'AvatarUploadClientError';
    this.code = code;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isAllowedMimeType = (mimeType: string): mimeType is AllowedMimeType =>
  (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);

const loadImageFromFile = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new AvatarUploadClientError(
          'Não foi possível ler a imagem selecionada. Escolha outro arquivo.',
          'AVATAR_IMAGE_READ_ERROR'
        )
      );
    };
    image.src = objectUrl;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new AvatarUploadClientError(
              'Falha ao processar a imagem para upload. Tente outra imagem.',
              'AVATAR_IMAGE_PROCESSING_ERROR'
            )
          );
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });

const clampDimension = (value: number) =>
  Math.max(MIN_IMAGE_DIMENSION, Math.floor(value));

const buildCompressedFileName = (originalName: string, mimeType: AllowedMimeType) => {
  const baseName = originalName.replace(/\.[^/.]+$/, '') || 'avatar';
  const extension = mimeType === 'image/png' ? 'png' : 'jpg';
  return `${baseName}.${extension}`;
};

const createApiErrorFromXhr = (xhr: XMLHttpRequest, url: string): ApiError => {
  const status = xhr.status;
  let payload: any = null;

  try {
    payload = xhr.responseText ? JSON.parse(xhr.responseText) : null;
  } catch {
    payload = null;
  }

  const details = Array.isArray(payload?.details) ? payload.details : null;
  const detailMessage = details && details.length > 0 ? details.join(' | ') : null;
  const payloadMessage =
    payload?.message || payload?.error || payload?.details?.message || payload?.details?.error;

  let message = detailMessage || payloadMessage || 'Falha ao enviar avatar.';
  if (status === 401) {
    message = 'Sua sessão expirou. Faça login novamente para enviar a foto.';
  } else if (status === 403) {
    message = 'Você não tem permissão para alterar esta foto de perfil.';
  } else if (status === 413) {
    message = 'Arquivo muito grande. O limite permitido é 5MB.';
  } else if (status >= 500) {
    message = 'Erro interno no servidor ao enviar a foto. Tente novamente em instantes.';
  }

  return new ApiError(message, {
    status,
    code: payload?.code,
    url,
    method: 'PUT',
    details: payload,
  });
};

const drawImage = (
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  canvas.width = width;
  canvas.height = height;
  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
};

export const validateAvatarFile = (file: File) => {
  if (!file) {
    throw new AvatarUploadClientError(
      'Nenhum arquivo selecionado para upload.',
      'AVATAR_FILE_REQUIRED'
    );
  }

  if (!isAllowedMimeType(file.type)) {
    throw new AvatarUploadClientError(
      'Formato inválido. Envie apenas imagens JPG ou PNG.',
      'AVATAR_INVALID_FORMAT'
    );
  }

  if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
    throw new AvatarUploadClientError(
      'Arquivo muito grande. O tamanho máximo permitido é 5MB.',
      'AVATAR_FILE_TOO_LARGE'
    );
  }
};

export const compressAvatarImage = async (file: File): Promise<File> => {
  validateAvatarFile(file);

  const image = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new AvatarUploadClientError(
      'Não foi possível preparar a imagem para upload.',
      'AVATAR_CANVAS_UNAVAILABLE'
    );
  }

  const originalWidth = image.naturalWidth || image.width || MAX_IMAGE_DIMENSION;
  const originalHeight = image.naturalHeight || image.height || MAX_IMAGE_DIMENSION;
  const maxCurrent = Math.max(originalWidth, originalHeight);
  const initialScale = maxCurrent > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / maxCurrent : 1;

  let width = clampDimension(originalWidth * initialScale);
  let height = clampDimension(originalHeight * initialScale);
  let outputType: AllowedMimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  let quality = outputType === 'image/jpeg' ? 0.9 : undefined;

  drawImage(image, canvas, context, width, height);

  let blob = await canvasToBlob(canvas, outputType, quality);

  // PNG can remain large even after resizing; switch to JPEG as fallback for avatars.
  if (blob.size > MAX_AVATAR_FILE_SIZE_BYTES && outputType === 'image/png') {
    outputType = 'image/jpeg';
    quality = 0.9;
    blob = await canvasToBlob(canvas, outputType, quality);
  }

  for (let attempt = 0; attempt < 8 && blob.size > MAX_AVATAR_FILE_SIZE_BYTES; attempt += 1) {
    if (outputType === 'image/jpeg' && quality && quality > 0.45) {
      quality = Math.max(0.45, quality - 0.1);
      blob = await canvasToBlob(canvas, outputType, quality);
      continue;
    }

    const nextWidth = clampDimension(width * 0.85);
    const nextHeight = clampDimension(height * 0.85);
    if (nextWidth === width && nextHeight === height) break;

    width = nextWidth;
    height = nextHeight;
    drawImage(image, canvas, context, width, height);
    blob = await canvasToBlob(canvas, outputType, quality);
  }

  if (blob.size > MAX_AVATAR_FILE_SIZE_BYTES) {
    throw new AvatarUploadClientError(
      'Não foi possível comprimir a imagem para o limite de 5MB. Tente outra foto.',
      'AVATAR_COMPRESSION_LIMIT'
    );
  }

  return new File([blob], buildCompressedFileName(file.name, outputType), {
    type: outputType,
    lastModified: Date.now(),
  });
};

export const prepareAvatarFileForUpload = async (file: File): Promise<File> => {
  validateAvatarFile(file);
  return compressAvatarImage(file);
};

const uploadAvatarOnce = (
  userId: number,
  file: File,
  options: UploadUserAvatarOptions
): Promise<User> => {
  const url = buildApiUrl(`/users/${userId}`);
  const timeoutMs = Number.isFinite(options.timeoutMs) ? Number(options.timeoutMs) : 60_000;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.withCredentials = true;
    xhr.timeout = timeoutMs;

    const headers = getApiRequestHeaders({ Accept: 'application/json' });
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.min(100, Math.max(0, Math.round((event.loaded / event.total) * 100)));
      options.onProgress?.({
        loaded: event.loaded,
        total: event.total,
        percent,
      });
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        let payload: any = null;
        try {
          payload = xhr.responseText ? JSON.parse(xhr.responseText) : null;
        } catch {
          payload = null;
        }

        const userPayload = payload?.user || payload;
        if (!userPayload || typeof userPayload !== 'object') {
          reject(
            new ApiError('Resposta inválida do servidor após upload da foto.', {
              status: xhr.status,
              code: 'INVALID_UPLOAD_RESPONSE',
              url,
              method: 'PUT',
              details: payload,
            })
          );
          return;
        }

        options.onProgress?.({ loaded: file.size, total: file.size, percent: 100 });
        resolve(userPayload as User);
        return;
      }

      reject(createApiErrorFromXhr(xhr, url));
    };

    xhr.onerror = () => {
      reject(
        new ApiError('Falha de rede durante o envio da foto.', {
          status: 0,
          code: 'NETWORK_ERROR',
          url,
          method: 'PUT',
          isNetworkError: true,
        })
      );
    };

    xhr.ontimeout = () => {
      reject(
        new ApiError('Tempo limite excedido durante o upload da foto.', {
          status: 0,
          code: 'UPLOAD_TIMEOUT',
          url,
          method: 'PUT',
          isNetworkError: true,
          isTimeout: true,
        })
      );
    };

    xhr.onabort = () => {
      reject(
        new ApiError('Upload cancelado.', {
          status: 0,
          code: 'UPLOAD_ABORTED',
          url,
          method: 'PUT',
          isNetworkError: true,
        })
      );
    };

    const formData = new FormData();
    formData.append('user[avatar]', file);
    xhr.send(formData);
  });
};

const shouldRetryNetworkError = (error: unknown) => {
  if (!(error instanceof ApiError)) return false;
  return Boolean(error.isNetworkError || error.status === 0);
};

export const uploadUserAvatar = async (
  userId: number,
  file: File,
  options: UploadUserAvatarOptions = {}
): Promise<UploadUserAvatarResult> => {
  const maxRetries = Number.isFinite(options.retries) ? Number(options.retries) : 2;
  const retries = Math.max(0, maxRetries);
  const preparedFile = await prepareAvatarFileForUpload(file);

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      options.onProgress?.({ loaded: 0, total: preparedFile.size, percent: 0 });
      const user = await uploadAvatarOnce(userId, preparedFile, options);
      return {
        user,
        avatarUrl: user.avatar_url || null,
        attempts: attempt + 1,
      };
    } catch (error) {
      lastError = error;
      if (!shouldRetryNetworkError(error) || attempt === retries) {
        throw error;
      }

      const backoffMs = 600 * Math.pow(2, attempt);
      await sleep(backoffMs);
    }
  }

  throw new AvatarUploadClientError(
    getApiErrorMessage(lastError, 'Falha ao enviar foto de perfil.'),
    'AVATAR_UPLOAD_FAILED'
  );
};

