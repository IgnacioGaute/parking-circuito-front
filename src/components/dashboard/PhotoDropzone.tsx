'use client';

import { Camera } from 'lucide-react';
import { useRef, useState } from 'react';
import { colors } from '@/styles/theme';

interface PhotoDropzoneProps {
  onFileSelected: (file: File | null) => void;
}

export function PhotoDropzone({ onFileSelected }: PhotoDropzoneProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const setFile = (file: File | null) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
    onFileSelected(file);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        const file = event.dataTransfer.files?.[0] ?? null;
        setFile(file);
      }}
      style={{
        width: '100%',
        height: 140,
        border: `1px dashed ${dragOver ? colors.accent : colors.borderDashed}`,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
        background: colors.bgInput,
        position: 'relative',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Foto del vehículo"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: colors.textDim,
            padding: '0 16px',
            textAlign: 'center',
          }}
        >
          <Camera size={22} strokeWidth={2} />
          Arrastrá una foto del vehículo
        </span>
      )}
    </div>
  );
}
