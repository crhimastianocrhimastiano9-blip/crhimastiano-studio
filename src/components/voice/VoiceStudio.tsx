import { useState } from 'react';

export function VoiceStudio() {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <section className="card">
      <div className="toolbar" style={{ marginBottom: 18 }}>
        <div>
          <p style={{ margin: 0, color: '#a5b4fc', letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Voix</p>
          <h2 style={{ margin: '6px 0 0' }}>Studio vocal</h2>
        </div>
        <button type="button" className="primary-btn" onClick={() => setIsRecording((value) => !value)}>
          {isRecording ? 'Stop' : 'Enregistrer'}
        </button>
      </div>

      <div className="mic-wave" style={{ border: isRecording ? '1px solid rgba(34, 197, 94, 0.7)' : '1px solid rgba(148,163,184,0.2)' }} />

      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="card" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <strong>Édition</strong>
          <p style={{ marginBottom: 0 }}>Compensation de ton, réduction du souffle, nettoyage harmonique.</p>
        </div>
        <div className="card" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <strong>Réglages</strong>
          <p style={{ marginBottom: 0 }}>Gain +12 dB • Compresseur 3:1 • Reverb légère</p>
        </div>
      </div>
    </section>
  );
}
