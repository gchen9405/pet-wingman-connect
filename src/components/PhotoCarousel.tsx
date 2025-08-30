import { useState } from 'react';
import { Photo } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPublicUrl } from '@/services/photos';

interface PhotoCarouselProps {
  photos: Photo[];
}

export const PhotoCarousel = ({ photos }: PhotoCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos.length) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <span className="text-muted-foreground">No photos</span>
      </div>
    );
  }

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const currentPhoto = photos[currentIndex];

  return (
    <div className="relative w-full h-full overflow-hidden rounded-t-lg">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          <img
            src={getPublicUrl(currentPhoto.path)}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {photos.length > 1 && (
        <>
          {/* Navigation buttons */}
          <button
            onClick={prevPhoto}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/20 text-white rounded-full p-2 hover:bg-black/40 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <button
            onClick={nextPhoto}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/20 text-white rounded-full p-2 hover:bg-black/40 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Dots indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};