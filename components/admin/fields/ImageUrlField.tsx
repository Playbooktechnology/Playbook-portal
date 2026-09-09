'use client';

// A URL TextField plus a direct upload button, for any image field that
// used to require the TipTap body-editor workaround: drop an image into the
// article body to get a Blob URL, copy it, paste it here, then delete it
// from the body again. That workaround existed because this field was a
// bare URL box with no upload path of its own -- this component is the
// fix, reusing the exact mechanism TipTapEditor.tsx already wires to
// /api/admin/upload-image (see that file's uploadImageFile for the
// original). Picking a file here writes straight to `onChange`, no body
// edit involved.
import { useCallback, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import { TextField } from './TextField';

type Props = {
  label: string;
  help?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean | (() => boolean);
};

export function ImageUrlField({ label, help, value, onChange, required }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;
      setUploading(true);
      setUploadError(null);
      try {
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/admin/upload-image',
        });
        onChange(blob.url);
      } catch (err) {
        console.error('[ImageUrlField] image upload failed:', err);
        setUploadError((err as Error).message || 'No se pudo subir la imagen.');
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  const pickFile = useCallback(() => fileInputRef.current?.click(), []);

  const onFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset so picking the same filename twice in a row still fires onChange.
      e.target.value = '';
      if (file) void uploadFile(file);
    },
    [uploadFile],
  );

  return (
    <div className="image-url-field">
      <TextField label={label} help={help} type="url" required={required} value={value} onChange={onChange} />
      <div className="image-url-field-actions">
        <button type="button" className="btn-mini" onClick={pickFile} disabled={uploading}>
          {uploading ? 'Subiendo…' : 'Subir imagen'}
        </button>
        {value && !uploading && (
          <a href={value} target="_blank" rel="noopener noreferrer" className="image-url-field-view-link">
            Ver imagen actual
          </a>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileSelected}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </div>
      {uploadError && (
        <p className="field-error" role="alert">
          {uploadError}
        </p>
      )}
    </div>
  );
}
