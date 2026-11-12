import { useEffect, useRef, useState } from 'react';

export function VoiceStudio() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [error, setError] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => () => {
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
  }, [recordingUrl]);

  const startRecording = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('L’enregistrement audio n’est pas pris en charge par cet appareil ou navigateur.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (recordingUrl) URL.revokeObjectURL(recordingUrl);
        setRecordingUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setError('Accorde l’autorisation du microphone pour commencer l’enregistrement.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    recorderRef.current = null;
    setIsRecording(false);
  };

  return (
    <section className="card">
      <div className="toolbar" style={{ marginBottom: 18 }}>
        <div>
          <p style={{ margin: 0, color: '#a5b4fc', letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Voix</p>
          <h2 style={{ margin: '6px 0 0' }}>Enregistrement vocal</h2>
        </div>
        <button type="button" className="primary-btn" onClick={() => (isRecording ? stopRecording() : void startRecording())}>
          {isRecording ? '■ Arrêter' : '● Enregistrer'}
        </button>
      </div>
      <div className="mic-wave" aria-label={isRecording ? 'Enregistrement en cours' : 'Microphone prêt'} style={{ border: isRecording ? '1px solid rgba(34, 197, 94, 0.7)' : '1px solid rgba(148,163,184,0.2)' }} />
      <p aria-live="polite">{isRecording ? 'Enregistrement en cours…' : 'Appuie sur Enregistrer et autorise le microphone.'}</p>
      {error && <p role="alert" className="status-message">{error}</p>}
      {recordingUrl && (
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <strong>Prise enregistrée</strong>
          <audio controls src={recordingUrl}>La lecture audio n’est pas prise en charge.</audio>
          <a className="secondary-btn" href={recordingUrl} download="prise-vocale.webm" style={{ width: 'fit-content', textDecoration: 'none' }}>Télécharger l’enregistrement</a>
        </div>
      )}
      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="card" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <strong>Édition</strong>
          <p style={{ marginBottom: 0 }}>La prise enregistrée peut être écoutée ou téléchargée.</p>
        </div>
        <div className="card" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <strong>Réglages</strong>
          <p style={{ marginBottom: 0 }}>Le navigateur demandera l’accès au microphone.</p>
        </div>
      </div>
    </section>
  );
}
