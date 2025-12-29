import { useState, useRef } from 'react';
import api from '../services/api';
import { Upload, X } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
  allowedTypes?: string[];
}

const ImageUpload = ({ value, onChange, label = "Media", accept = "image/*,video/*", allowedTypes }: ImageUploadProps) => {
  const [uploading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type if allowedTypes is specified
    if (allowedTypes && allowedTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const mimeType = file.type.toLowerCase();
      
      const isValidType = allowedTypes.some(type => {
        const normalizedType = type.toLowerCase();
        return fileExtension === normalizedType || 
               mimeType === `image/${normalizedType}` ||
               mimeType === `image/${normalizedType === 'jpg' ? 'jpeg' : normalizedType}`;
      });

      if (!isValidType) {
        alert(`Invalid file type. Please upload only: ${allowedTypes.join(', ').toUpperCase()}`);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      onChange(response.data.url);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload media');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isVideo = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    return ['mp4', 'webm', 'ogg', 'mov'].includes(ext || '');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      {value ? (
        <div className="relative w-full h-48 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden group">
          {isVideo(value) ? (
            <video 
              src={value} 
              className="w-full h-full object-cover"
              controls
            />
          ) : (
            <img 
              src={value} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center pointer-events-none">
            <button
              type="button"
              onClick={() => onChange('')}
              className="bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110 pointer-events-auto"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`
            w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors
            ${uploading ? 'bg-gray-50 border-gray-300' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'}
          `}
        >
          {uploading ? (
            <div className="flex flex-col items-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <span className="text-sm">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-500">
              <Upload size={24} className="mb-2" />
              <span className="text-sm font-medium">Click to upload media</span>
              <span className="text-xs text-gray-400 mt-1">
                {allowedTypes && allowedTypes.length > 0 
                  ? `Images only (${allowedTypes.map(t => t.toUpperCase()).join(', ')})`
                  : 'Images or Video (MP4, WebM)'}
              </span>
            </div>
          )}
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleFileSelect}
      />
    </div>
  );
};

export default ImageUpload;

