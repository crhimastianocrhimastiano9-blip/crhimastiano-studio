import { useCallback, useEffect, useRef, useState } from 'react';
import { useStudio } from '../../context/StudioContext';

export function VoiceStudio() {
  const { project } = useStudio();
  const [isRecording, setIsRecording] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [recordingName, setRecordingName] = useState('prise-vocale');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Connecte un casque si possible, puis autorise le microphone.');
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([]);
  const [inputId, setInputId] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const monitorContextRef = useRef<AudioContext | null>(null);
  const monitorGainRef = useRef<GainNode | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const refreshInputs = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const microphones = devices.filter((device) => device.kind === 'audioinput');
      setInputs(microphones);
      if (!inputId && microphones[0]) setInputId(microphones[0].deviceId);
    } catch {
      setInputs([]);
    }
  }, [inputId]);

  useEffect(() => {
    void refreshInputs();
    const devices = navigator.mediaDevices;
    devices?.addEventListener?.('devicechange', refreshInputs);
    return () => {
      devices?.removeEventListener?.('devicechange', refreshInputs);
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      void monitorContextRef.current?.close();
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    };
  }, [refreshInputs, recordingUrl]);

  useEffect(() => {
    if (monitorGainRef.current && monitorContextRef.current) {
      monitorGainRef.current.gain.setTargetAtTime(monitoring ? 0.65 : 0, monitorContextRef.current.currentTime, 0.02);
    }
  }, [monitoring]);

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    monitorGainRef.current = null;
    const context = monitorContextRef.current;
    monitorContextRef.current = null;
    if (context && context.state !== 'closed') void context.close();
  };

  const startRecording = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('L’enregistrement n’est pas pris en charge dans cette version Android. Mets l’application à jour ou utilise un navigateur compatible.');
      return;
    }

    try {
      const audioConstraints: MediaTrackConstraints = inputId ? { deviceId: { exact: inputId }, echoCancellation: true, noiseSuppression: true, autoGainControl: true } : { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      streamRef.current = stream;
      await refreshInputs();

      const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (monitoring && AudioCtor) {
        const context = new AudioCtor();
        const source = context.createMediaStreamSource(stream);
        const gain = context.createGain();
        gain.gain.value = 0.65;
        source.connect(gain).connect(context.destination);
        monitorContextRef.current = context;
        monitorGainRef.current = gain;
        await context.resume();
      }

      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        setError('Une erreur a interrompu l’enregistrement. Vérifie le microphone et réessaie.');
        setIsRecording(false);
        stopTracks();
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (recordingUrl) URL.revokeObjectURL(recordingUrl);
        setRecordingUrl(URL.createObjectURL(blob));
        setStatus('Prise terminée. Écoute-la puis télécharge-la sur ton téléphone.');
        stopTracks();
      };
      recorder.start(250);
      recorderRef.current = recorder;
      setIsRecording(true);
      setStatus(monitoring ? 'Enregistrement en cours — contrôle au casque activé.' : 'Enregistrement en cours — monitoring désactivé pour éviter l’écho.');
    } catch (cause) {
      stopTracks();
      setIsRecording(false);
      const name = cause instanceof DOMException ? cause.name : '';
      setError(name === 'NotAllowedError'
        ? 'Autorise l’accès au microphone dans les paramètres Android de l’application, puis réessaie.'
        : name === 'NotFoundError'
          ? 'Aucun microphone compatible n’a été trouvé. Vérifie ton casque et les réglages Android.'
          : 'Impossible d’ouvrir le microphone. Connecte ton casque avant de démarrer et vérifie les autorisations Android.');
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    setIsRecording(false);
    if (recorder?.state === 'recording') recorder.stop();
    else stopTracks();
  };

  const toggleMonitoring = () => {
    setMonitoring((enabled) => !enabled);
    if (!monitoring) {
      setStatus('Le monitoring peut avoir un retard, surtout en Bluetooth. Utilise un casque et baisse le volume pour éviter le larsen.');
    }
  };

  const downloadTake = () => {
    if (!recordingUrl) return;
    const link = document.createElement('a');
    link.href = recordingUrl;
    link.download = `${recordingName.trim().replace(/[^a-z0-9-_]+/gi, '-') || 'prise-vocale'}.${recordingUrl.includes('audio/mp4') ? 'm4a' : 'webm'}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <section className="card">
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div>
          <p className="eyebrow">Studio vocal</p>
          <h2 style={{ margin: '6px 0 0' }}>Enregistrer une voix</h2>
        </div>
        <span className="pill">{project.bpm} BPM</span>
      </div>

      <div className="card" style={{ background: 'rgba(7, 10, 22, .58)', marginBottom: 14 }}>
        <label style={{ display: 'grid', gap: 8 }}>
          <strong>Microphone d’entrée</strong>
          <select aria-label="Sélection du microphone" value={inputId} onChange={(event) => setInputId(event.target.value)} disabled={isRecording}>
            {inputs.length === 0 && <option value="">Microphone par défaut du téléphone</option>}
            {inputs.map((input, index) => <option key={input.deviceId || index} value={input.deviceId}>{input.label || `Microphone ${index + 1}`}</option>)}
          </select>
        </label>
        <label className="monitor-toggle" style={{ marginTop: 14 }}>
          <input type="checkbox" checked={monitoring} onChange={toggleMonitoring} disabled={isRecording} />
          <span>Écouter le micro dans le casque pendant la prise</span>
        </label>
        <p className="status-message">Connecte ton casque Bluetooth dans les réglages rapides/Android avant d’enregistrer. Le téléphone choisit la sortie Bluetooth ; selon Android, le micro du casque peut réduire la qualité et le monitoring peut avoir du retard.</p>
      </div>

      <div className="voice-recorder-panel">
        <div className={`record-indicator ${isRecording ? 'recording' : ''}`} />
        <p aria-live="polite">{status}</p>
        <button type="button" className={isRecording ? 'secondary-btn' : 'primary-btn'} onClick={() => isRecording ? stopRecording() : void startRecording()}>
          {isRecording ? '■ Arrêter la prise' : '● Démarrer l’enregistrement'}
        </button>
      </div>
      {error && <p role="alert" className="photo-error">{error}</p>}

      {recordingUrl && (
        <div className="card" style={{ marginTop: 14 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <strong>Nom de la prise</strong>
            <input value={recordingName} onChange={(event) => setRecordingName(event.target.value)} aria-label="Nom de l’enregistrement" />
          </label>
          <audio ref={audioRef} controls src={recordingUrl} style={{ width: '100%', marginTop: 12 }}>La lecture audio n’est pas prise en charge.</audio>
          <button type="button" className="primary-btn" onClick={downloadTake} style={{ marginTop: 12 }}>Télécharger la prise</button>
          <p className="status-message">La prise est disponible sur cet appareil jusqu’à fermeture de cet écran ; télécharge-la pour la conserver.</p>
        </div>
      )}

      <div className="grid-2" style={{ marginTop: 14 }}>
        <div className="card"><strong>Conseil de prise</strong><p>Un casque filaire offre généralement moins de retard que le Bluetooth pendant l’écoute en direct.</p></div>
        <div className="card"><strong>Limites actuelles</strong><p>Enregistrement mono depuis le microphone choisi par Android. Pas encore d’effets vocaux destructifs ni d’enregistrement multipiste synchronisé.</p></div>
      </div>
    </section>
  );
}
