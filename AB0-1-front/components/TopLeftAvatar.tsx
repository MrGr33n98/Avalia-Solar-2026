'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  initialUrl?: string | null;
  onUpload?: (file: File) => Promise<void>;
};

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const IMAGE_MIME_PREFIX = 'image/';

const fallbackSvg =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">
      <rect width="100%" height="100%" fill="#eee"/>
      <circle cx="48" cy="36" r="18" fill="#bbb"/>
      <rect x="20" y="60" width="56" height="24" rx="12" fill="#bbb"/>
    </svg>`
  );

export default function TopLeftAvatar({ initialUrl, onUpload }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string>(initialUrl || fallbackSvg);
  const [error, setError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) return;

    if (!file.type.startsWith(IMAGE_MIME_PREFIX)) {
      setError('Apenas imagens são permitidas.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('Tamanho máximo de 2MB excedido.');
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPreviewUrl(url);

    try {
      if (onUpload) {
        await onUpload(file);
      }
    } catch {
      setError('Falha ao enviar o avatar.');
    }
  };

  return (
    <div
      style={{ position: 'absolute', top: 20, left: 20, zIndex: 100 }}
      aria-label="Avatar do usuário"
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: '0 0 0 2px #e5e7eb, 0 0 0 4px #ffffff, 0 8px 12px rgba(16,24,40,0.08)',
          background: '#fff',
        }}
      >
        <img
          src={previewUrl || fallbackSvg}
          alt="Avatar"
          width={64}
          height={64}
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setPreviewUrl(fallbackSvg)}
        />
      </div>

      <div style={{ marginTop: 8 }}>
        <label
          htmlFor="avatar-upload"
          style={{
            display: 'inline-block',
            padding: '6px 10px',
            borderRadius: 8,
            background: '#f5f5f5',
            border: '1px solid #e5e5e5',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Alterar Avatar
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: 6,
            fontSize: 12,
            color: '#b00020',
            background: '#ffe6e6',
            padding: '6px 8px',
            borderRadius: 6,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
