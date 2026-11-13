import { useRef, useState } from 'react';
import { useStudio } from '../../context/StudioContext';

const PHOTO_KEY = 'crhimastiano-studio-cover';
const MAX_IMAGE_SIDE = 1440;

function resizePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossible de lire cette image.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Ce format d’image ne peut pas être ouvert.'));
      image.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) return reject(new Error('Le traitement de la photo a échoué.'));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function readSavedPhoto() {
  try { return localStorage.getItem(PHOTO_KEY) ?? ''; } catch { return ''; }
}

export function StudioHeader() {
  const { project } = useStudio();
  const [photo, setPhoto] = useState(readSavedPhoto);
  const [photoError, setPhotoError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePhoto = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Choisis un fichier photo (JPG, PNG ou WebP).');
      return;
    }
    try {
      const image = await resizePhoto(file);
      localStorage.setItem(PHOTO_KEY, image);
      setPhoto(image);
      setPhotoError('');
    } catch {
      setPhotoError('La photo n’a pas pu être enregistrée. Choisis une image plus petite ou libère de l’espace sur le téléphone.');
    }
  };

  const removePhoto = () => {
    try { localStorage.removeItem(PHOTO_KEY); } catch { /* Photo may be memory-only. */ }
    setPhoto('');
    setPhotoError('');
  };

  return (
    <header className="studio-hero" style={photo ? { backgroundImage: `linear-gradient(90deg, rgba(7, 10, 22, .94) 0%, rgba(7, 10, 22, .72) 55%, rgba(7, 10, 22, .28) 100%), url("${photo}")` } : undefined}>
      <div className="studio-hero-content">
        <p className="eyebrow">Studio musical mobile</p>
        <h1>{project.name}</h1>
        <p className="studio-hero-caption">Crée · Enregistre · Arrange · Mixe</p>
        <div className="studio-photo-actions">
          <input ref={inputRef} className="sr-only" type="file" accept="image/*" aria-label="Choisir une photo pour le fond du studio" onChange={(event) => { void handlePhoto(event.target.files?.[0]); event.currentTarget.value = ''; }} />
          <button type="button" className="secondary-btn photo-button" onClick={() => inputRef.current?.click()}>
            {photo ? 'Changer ma photo' : '＋ Ajouter ma photo'}
          </button>
          {photo && <button type="button" className="secondary-btn photo-button" onClick={removePhoto}>Retirer</button>}
        </div>
        {photoError && <p role="alert" className="photo-error">{photoError}</p>}
      </div>
      <div className="studio-hero-badge" aria-label="Tempo du projet">{project.bpm} <span>BPM</span></div>
    </header>
  );
}
