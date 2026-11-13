import { useEffect, useRef, useState } from 'react';
import { useStudio } from '../../context/StudioContext';

const PHOTO_STORAGE_KEY = 'crhimastiano-studio-photo';

export function StudioHeader() {
  const { project } = useStudio();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photo, setPhoto] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      setPhoto(localStorage.getItem(PHOTO_STORAGE_KEY) ?? '');
    } catch {
      setPhoto('');
    }
  }, []);

  const resizePhoto = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          const maxSide = 1400;
          const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Impossible de traiter la photo.'));
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          try {
            localStorage.setItem(PHOTO_STORAGE_KEY, dataUrl);
          } catch {
            // ignore storage limitations
          }
          resolve(dataUrl);
        };
        image.onerror = () => reject(new Error('Cette image est invalide.'));
        image.src = String(reader.result);
      };
      reader.onerror = () => reject(new Error('Lecture de la photo impossible.'));
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choisis une image JPG, PNG ou WebP.');
      return;
    }

    try {
      const imageData = await resizePhoto(file);
      setPhoto(imageData);
      setError('');
    } catch {
      setError('La photo n’a pas pu être enregistrée. Choisis une image plus petite.');
    } finally {
      event.target.value = '';
    }
  };

  const clearPhoto = () => {
    try {
      localStorage.removeItem(PHOTO_STORAGE_KEY);
    } catch {
      // ignore
    }
    setPhoto('');
    setError('');
  };

  const heroStyle = photo
    ? ({ backgroundImage: `linear-gradient(90deg, rgba(7,10,20,0.75), rgba(7,10,20,0.4)), url("${photo}")` } as React.CSSProperties)
    : undefined;

  return (
    <header className="studio-hero" style={heroStyle}>
      <div className="studio-hero-content">
        <p className="eyebrow">Crhimastiano</p>
        <h1>{project.name}</h1>
        <p className="studio-hero-caption">Production mobile • création • mix • performance</p>

        <div className="studio-photo-actions">
          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            accept="image/*"
            aria-label="Choisir une photo pour le fond du studio"
            onChange={handlePhotoChange}
          />
          <button type="button" className="secondary-btn photo-button" onClick={() => fileInputRef.current?.click()}>
            {photo ? 'Changer ma photo' : 'Ajouter ma photo'}
          </button>
          {photo && (
            <button type="button" className="secondary-btn photo-button" onClick={clearPhoto}>
              Retirer
            </button>
          )}
        </div>

        {error && <p className="photo-error" role="alert">{error}</p>}
      </div>

      <div className="studio-hero-badge" aria-label={`Tempo du projet ${project.bpm} bpm`}>
        {project.bpm}
        <span>BPM</span>
      </div>
    </header>
  );
}
