import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Photo } from '@/types';
import { upload, save, deletePhoto } from '@/services/photos';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Star, Camera, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PhotoUploaderProps {
  photos: Photo[];
  ownerType: 'human' | 'pet';
  ownerId: string;
  onPhotosChange: (photos: Photo[]) => void;
  maxPhotos?: number;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  error?: string;
}

export const PhotoUploader = ({ 
  photos, 
  ownerType, 
  ownerId, 
  onPhotosChange, 
  maxPhotos = 6 
}: PhotoUploaderProps) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return 'Please upload JPG, PNG, or WebP images only';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    return null;
  };

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    const newUploadingFiles: UploadingFile[] = [];

    // Validate files
    for (const file of fileArray) {
      if (photos.length + newUploadingFiles.length >= maxPhotos) {
        toast({
          title: 'Too many photos',
          description: `Maximum ${maxPhotos} photos allowed`,
          variant: 'destructive',
        });
        break;
      }

      const error = validateFile(file);
      if (error) {
        toast({
          title: 'Invalid file',
          description: error,
          variant: 'destructive',
        });
        continue;
      }

      newUploadingFiles.push({
        id: Math.random().toString(36).substring(2),
        file,
        progress: 0,
      });
    }

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Upload files
    for (const uploadingFile of newUploadingFiles) {
      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => 
            prev.map(f => 
              f.id === uploadingFile.id 
                ? { ...f, progress: Math.min(f.progress + 10, 90) }
                : f
            )
          );
        }, 200);

        const uploadResult = await upload(uploadingFile.file);
        clearInterval(progressInterval);

        if (uploadResult.error) {
          setUploadingFiles(prev => 
            prev.map(f => 
              f.id === uploadingFile.id 
                ? { ...f, error: uploadResult.error }
                : f
            )
          );
          continue;
        }

        if (uploadResult.path) {
          const saveResult = await save({
            ownerType,
            ownerId,
            path: uploadResult.path,
            isPrimary: photos.length === 0, // First photo is primary
          });

          if (saveResult.photo) {
            onPhotosChange([...photos, saveResult.photo]);
            setUploadingFiles(prev => prev.filter(f => f.id !== uploadingFile.id));
            
            toast({
              title: 'Photo uploaded',
              description: 'Your photo has been added successfully',
            });
          } else {
            setUploadingFiles(prev => 
              prev.map(f => 
                f.id === uploadingFile.id 
                  ? { ...f, error: saveResult.error || 'Save failed' }
                  : f
              )
            );
          }
        }
      } catch (error) {
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === uploadingFile.id 
              ? { ...f, error: 'Upload failed' }
              : f
          )
        );
      }
    }
  }, [photos, ownerType, ownerId, onPhotosChange, maxPhotos, toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await deletePhoto(photoId);
      onPhotosChange(photos.filter(p => p.id !== photoId));
      toast({
        title: 'Photo deleted',
        description: 'Photo has been removed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete photo',
        variant: 'destructive',
      });
    }
  };

  const handleSetPrimary = (photoId: string) => {
    const updatedPhotos = photos.map(photo => ({
      ...photo,
      isPrimary: photo.id === photoId
    }));
    onPhotosChange(updatedPhotos);
  };

  const canUploadMore = photos.length + uploadingFiles.length < maxPhotos;

  return (
    <div className="space-y-4">
      {/* Upload area */}
      {canUploadMore && (
        <Card 
          className={`border-2 border-dashed transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Camera className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              Drop photos here or click to upload
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              JPG, PNG, or WebP (max 10MB)
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Choose Photos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />
          </CardContent>
        </Card>
      )}

      {/* Photo grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <AnimatePresence>
          {photos.map((photo) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group aspect-square"
            >
              <img
                src={photo.path.startsWith('/') ? `/api/placeholder/400/400?text=${encodeURIComponent(photo.path)}` : photo.path}
                alt="Uploaded photo"
                className="w-full h-full object-cover rounded-lg"
              />
              
              {/* Primary indicator */}
              {photo.isPrimary && (
                <div className="absolute top-2 left-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                </div>
              )}

              {/* Actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg" />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                {!photo.isPrimary && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSetPrimary(photo.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ))}

          {/* Uploading files */}
          {uploadingFiles.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square bg-muted rounded-lg flex flex-col items-center justify-center p-4"
            >
              {file.error ? (
                <>
                  <X className="h-8 w-8 text-destructive mb-2" />
                  <p className="text-xs text-center text-destructive">{file.error}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setUploadingFiles(prev => prev.filter(f => f.id !== file.id))}
                    className="mt-2"
                  >
                    Remove
                  </Button>
                </>
              ) : (
                <>
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p className="text-xs text-center mb-2">Uploading...</p>
                  <Progress value={file.progress} className="w-full" />
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <p className="text-xs text-muted-foreground">
        {photos.length}/{maxPhotos} photos • First photo will be your primary photo
      </p>
    </div>
  );
};