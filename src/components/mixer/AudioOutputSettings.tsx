import { useStudio } from '../../context/StudioContext';
import { AudioEngine } from '../../audio/AudioEngine';

const engine = new AudioEngine();

export function AudioOutputSettings() {
  const { project, updateMasterVolume } = useStudio();
  const volume = Math.round(project.masterVolume * 100);

  return (
    <section className="card" aria-labelledby="audio-output-heading">
      <p className="eyebrow">Écoute & casque</p>
      <h2 id="audio-output-heading" style={{ margin: '6px 0 12px' }}>Sortie audio</h2>
      <p>Branche ou connecte ton casque dans les réglages Android. Android choisit alors la sortie du téléphone pour toute l’application.</p>
      <p className="status-message">La sélection directe d’un casque n’est pas disponible de façon fiable dans cette version mobile.</p>
      <label className="master-volume-control">
        <span>Volume général : {volume} %</span>
        <input type="range" min={0} max={100} value={volume} onChange={(event) => {
          const nextVolume = Number(event.target.value) / 100;
          updateMasterVolume(nextVolume);
          engine.setMasterVolume(nextVolume);
        }} />
      </label>
    </section>
  );
}
