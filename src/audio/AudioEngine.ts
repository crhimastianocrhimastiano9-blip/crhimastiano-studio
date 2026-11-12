/**
 * CRHIMASTIANO STUDIO — Core Audio Engine
 * Real Web Audio API implementation with synthetic drums, African percussions,
 * synthesizers, track effects routing, microphone recorder, and offline WAV rendering.
 */

import { Track, AudioClip, DrumInstrument, BeatGrid } from '../types/daw';

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  public ctx: AudioContext | null = null;
  public masterGain: GainNode | null = null;
  public masterLimiter: DynamicsCompressorNode | null = null;
  public masterAnalyser: AnalyserNode | null = null;

  // Global reverb impulse response
  private reverbBuffer: AudioBuffer | null = null;
  private reverbConvolver: ConvolverNode | null = null;

  // Track channels: trackId -> channel nodes
  private trackChannels: Map<
    string,
    {
      input: GainNode;
      eqLow: BiquadFilterNode;
      eqMid: BiquadFilterNode;
      eqHigh: BiquadFilterNode;
      drive: WaveShaperNode;
      driveGain: GainNode;
      delay: DelayNode;
      delayFeedback: GainNode;
      delaySend: GainNode;
      reverbSend: GainNode;
      panner: StereoPannerNode;
      fader: GainNode;
      analyser: AnalyserNode;
    }
  > = new Map();

  // Playback state & dynamic references
  public isPlaying = false;
  public isLooping = true;
  public bpm = 112;
  public currentTime = 0; // seconds
  public loopStart = 0; // seconds
  public loopEnd = 16; // seconds
  public metronomeEnabled = false;

  public currentBeatGrid: BeatGrid | null = null;
  public currentTracks: Track[] = [];

  private playbackStartTime = 0;
  private animationFrameId: number | null = null;
  private nextBeatStepTime = 0;
  private currentStep = 0;
  private activeClipSources: { source: AudioBufferSourceNode; clipId: string }[] = [];
  private previewSource: AudioBufferSourceNode | null = null;

  // Microphone recording
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  public isRecording = false;
  public micAnalyser: AnalyserNode | null = null;
  public micStreamSource: MediaStreamAudioSourceNode | null = null;
  public directMonitorGain: GainNode | null = null;
  public directMonitoring = false;

  // Latency & Hardware Timing
  public recordStartTime = 0;
  public latencyCompensationMs = 0; // Negative or positive offset in ms
  public maxRecordingSeconds = 600; // 10 minutes mobile memory safeguard
  private maxRecordTimeoutId: any = null;
  private wakeLockSentinel: any = null;

  // Interruption & Lifecycle listeners
  private stateChangeListeners: ((state: AudioContextState) => void)[] = [];
  private timeUpdateListeners: ((time: number, step: number) => void)[] = [];

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  constructor() {
    // Auto-resume audio when returning from background/tab switch on mobile
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.ctx && this.ctx.state === 'suspended' && this.isPlaying) {
          this.ctx.resume().catch(() => {});
        }
      });
    }
  }

  public onStateChange(cb: (state: AudioContextState) => void) {
    this.stateChangeListeners.push(cb);
  }

  public removeStateChangeListener(cb: (state: AudioContextState) => void) {
    this.stateChangeListeners = this.stateChangeListeners.filter((l) => l !== cb);
  }

  public async initAudio(): Promise<AudioContext> {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx({ latencyHint: 'interactive' });

      // Master bus chain: masterGain -> masterLimiter -> masterAnalyser -> destination
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.9;

      this.masterLimiter = this.ctx.createDynamicsCompressor();
      this.masterLimiter.threshold.value = -0.5;
      this.masterLimiter.knee.value = 3;
      this.masterLimiter.ratio.value = 20;
      this.masterLimiter.attack.value = 0.002;
      this.masterLimiter.release.value = 0.1;

      this.masterAnalyser = this.ctx.createAnalyser();
      this.masterAnalyser.fftSize = 512;
      this.masterAnalyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.masterLimiter);
      this.masterLimiter.connect(this.masterAnalyser);
      this.masterAnalyser.connect(this.ctx.destination);

      // Create procedural reverb impulse response
      this.reverbBuffer = this.createStudioReverbBuffer(2.2, 2.5);
      this.reverbConvolver = this.ctx.createConvolver();
      this.reverbConvolver.buffer = this.reverbBuffer;
      this.reverbConvolver.connect(this.masterGain);

      // Listen to hardware/OS interruptions (phone call, screen lock, audio routing shift)
      this.ctx.onstatechange = () => {
        if (this.ctx) {
          const state = this.ctx.state;
          this.stateChangeListeners.forEach((cb) => cb(state));
        }
      };
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    return this.ctx;
  }

  // Mobile Screen Wake Lock to prevent Android from dimming/sleeping during take
  public async acquireWakeLock(): Promise<void> {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        if (!this.wakeLockSentinel) {
          this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
          this.wakeLockSentinel.addEventListener('release', () => {
            this.wakeLockSentinel = null;
          });
        }
      } catch (e) {
        // Ignored if wake lock is disabled or unsupported
      }
    }
  }

  public releaseWakeLock(): void {
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
      } catch (e) {
        // Ignored
      }
      this.wakeLockSentinel = null;
    }
  }

  // Hardware Latency Diagnostic info
  public getHardwareLatencyInfo(): {
    baseLatencyMs: number;
    outputLatencyMs: number;
    totalEstimatedLatencyMs: number;
    sampleRate: number;
  } {
    const base = ((this.ctx as any)?.baseLatency || 0.005) * 1000;
    const output = ((this.ctx as any)?.outputLatency || 0.02) * 1000;
    return {
      baseLatencyMs: Math.round(base * 10) / 10,
      outputLatencyMs: Math.round(output * 10) / 10,
      totalEstimatedLatencyMs: Math.round((base + output) * 10) / 10,
      sampleRate: this.ctx?.sampleRate || 44100,
    };
  }

  // Procedural Studio Reverb impulse generator (clean decay room/hall)
  private createStudioReverbBuffer(duration: number, decay: number): AudioBuffer {
    const rate = this.ctx?.sampleRate || 44100;
    const length = rate * duration;
    const impulse = this.ctx
      ? this.ctx.createBuffer(2, length, rate)
      : new AudioBuffer({ length, numberOfChannels: 2, sampleRate: rate });
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const factor = Math.exp(-n * decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return impulse;
  }

  // Tube warmth distortion curve
  private makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
    const k = typeof amount === 'number' ? amount : 50;
    const nSamples = 44100;
    const buffer = new ArrayBuffer(nSamples * Float32Array.BYTES_PER_ELEMENT);
    const curve = new Float32Array(buffer);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  // Setup or sync channel for a track
  public syncTrackChannel(track: Track) {
    if (!this.ctx || !this.masterGain || !this.reverbConvolver) return;

    let ch = this.trackChannels.get(track.id);
    if (!ch) {
      const input = this.ctx.createGain();

      // 3-band parametric EQ
      const eqLow = this.ctx.createBiquadFilter();
      eqLow.type = 'lowshelf';
      eqLow.frequency.value = 120;

      const eqMid = this.ctx.createBiquadFilter();
      eqMid.type = 'peaking';
      eqMid.frequency.value = 1200;
      eqMid.Q.value = 1.0;

      const eqHigh = this.ctx.createBiquadFilter();
      eqHigh.type = 'highshelf';
      eqHigh.frequency.value = 8000;

      // Tube drive
      const drive = this.ctx.createWaveShaper();
      drive.curve = this.makeDistortionCurve(0);
      drive.oversample = '2x';
      const driveGain = this.ctx.createGain();

      // Delay node
      const delay = this.ctx.createDelay(1.0);
      delay.delayTime.value = 0.35;
      const delayFeedback = this.ctx.createGain();
      delayFeedback.gain.value = 0.35;
      const delaySend = this.ctx.createGain();

      delay.connect(delayFeedback);
      delayFeedback.connect(delay);

      // Reverb send
      const reverbSend = this.ctx.createGain();

      // Fader & Panner
      const fader = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner();
      const analyser = this.ctx.createAnalyser();
      analyser.fftSize = 256;

      // Chain: input -> eqLow -> eqMid -> eqHigh -> drive -> fader -> panner -> analyser -> masterGain
      input.connect(eqLow);
      eqLow.connect(eqMid);
      eqMid.connect(eqHigh);
      eqHigh.connect(drive);
      drive.connect(fader);

      // Send effects
      eqHigh.connect(delaySend);
      delaySend.connect(delay);
      delay.connect(fader);

      eqHigh.connect(reverbSend);
      reverbSend.connect(this.reverbConvolver);

      fader.connect(panner);
      panner.connect(analyser);
      analyser.connect(this.masterGain);

      ch = {
        input,
        eqLow,
        eqMid,
        eqHigh,
        drive,
        driveGain,
        delay,
        delayFeedback,
        delaySend,
        reverbSend,
        panner,
        fader,
        analyser,
      };
      this.trackChannels.set(track.id, ch);
    }

    // Apply values
    ch.eqLow.gain.value = track.effects.eqLow || 0;
    ch.eqMid.gain.value = track.effects.eqMid || 0;
    ch.eqHigh.gain.value = track.effects.eqHigh || 0;
    ch.reverbSend.gain.value = track.effects.reverb || 0;
    ch.delaySend.gain.value = track.effects.delay || 0;

    if (track.effects.distortion > 0.05) {
      ch.drive.curve = this.makeDistortionCurve(track.effects.distortion * 80);
    } else {
      ch.drive.curve = null;
    }

    ch.panner.pan.value = Math.max(-1, Math.min(1, track.pan));
    const effectiveVolume = track.mute ? 0 : track.volume;
    ch.fader.gain.value = effectiveVolume;
  }

  public getTrackChannelInput(trackId: string): GainNode | null {
    return this.trackChannels.get(trackId)?.input || null;
  }

  public getTrackAnalyser(trackId: string): AnalyserNode | null {
    return this.trackChannels.get(trackId)?.analyser || null;
  }

  /**
   * Finds the best channel destination for drums:
   * routes through the beat track channel if available, so track volume, EQ, and pan affect it!
   */
  private getDrumDestination(): AudioNode {
    if (!this.ctx) throw new Error('AudioContext missing');
    const beatTrack = this.currentTracks.find((t) => t.type === 'beat');
    if (beatTrack) {
      const ch = this.trackChannels.get(beatTrack.id);
      if (ch) return ch.input;
    }
    return this.masterGain || this.ctx.destination;
  }

  /**
   * Finds the best channel destination for synth notes:
   * routes through synth track channel if available!
   */
  private getSynthDestination(preset: string): AudioNode {
    if (!this.ctx) throw new Error('AudioContext missing');
    const synthTrack = this.currentTracks.find((t) => t.type === 'synth');
    if (synthTrack) {
      const ch = this.trackChannels.get(synthTrack.id);
      if (ch) return ch.input;
    }
    return this.masterGain || this.ctx.destination;
  }

  // --- Real Synthesized Drums & African Percussion ---

  public playDrum(inst: DrumInstrument, velocity = 0.85, time?: number) {
    if (!this.ctx) return;
    const now = time ?? this.ctx.currentTime;
    const dest = this.getDrumDestination();

    switch (inst) {
      case 'kick': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.09);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.28);

        gain.gain.setValueAtTime(velocity * 1.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }

      case 'sub808': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(75, now);
        osc.frequency.exponentialRampToValueAtTime(48, now + 0.08);

        gain.gain.setValueAtTime(velocity * 1.1, now);
        gain.gain.linearRampToValueAtTime(velocity * 0.8, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.9);
        break;
      }

      case 'snare': {
        const bufferSize = this.ctx.sampleRate * 0.2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(velocity * 0.9, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(dest);

        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);

        oscGain.gain.setValueAtTime(velocity * 0.8, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(oscGain);
        oscGain.connect(dest);

        whiteNoise.start(now);
        whiteNoise.stop(now + 0.2);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }

      case 'hihat_closed': {
        const noise = this.createNoiseNode(0.05);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7500;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(velocity * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        noise.start(now);
        noise.stop(now + 0.06);
        break;
      }

      case 'hihat_open': {
        const noise = this.createNoiseNode(0.35);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 9000;
        filter.Q.value = 2.0;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(velocity * 0.75, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        noise.start(now);
        noise.stop(now + 0.35);
        break;
      }

      case 'clap': {
        [0, 0.012, 0.024].forEach((offset) => {
          if (!this.ctx) return;
          const noise = this.createNoiseNode(0.04);
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = 1400;
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(velocity * 0.6, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.035);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(dest);
          noise.start(now + offset);
          noise.stop(now + offset + 0.04);
        });

        const tail = this.createNoiseNode(0.15);
        const tailFilter = this.ctx.createBiquadFilter();
        tailFilter.type = 'bandpass';
        tailFilter.frequency.value = 1600;
        const tailGain = this.ctx.createGain();
        tailGain.gain.setValueAtTime(velocity * 0.8, now + 0.035);
        tailGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        tail.connect(tailFilter);
        tailFilter.connect(tailGain);
        tailGain.connect(dest);
        tail.start(now + 0.035);
        tail.stop(now + 0.19);
        break;
      }

      case 'djembe': {
        const skinOsc = this.ctx.createOscillator();
        const skinGain = this.ctx.createGain();
        skinOsc.type = 'sine';
        skinOsc.frequency.setValueAtTime(115, now);
        skinOsc.frequency.exponentialRampToValueAtTime(78, now + 0.12);

        skinGain.gain.setValueAtTime(velocity * 1.3, now);
        skinGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        skinOsc.connect(skinGain);
        skinGain.connect(dest);

        const slapNoise = this.createNoiseNode(0.05);
        const slapFilter = this.ctx.createBiquadFilter();
        slapFilter.type = 'bandpass';
        slapFilter.frequency.value = 2200;
        slapFilter.Q.value = 3;
        const slapGain = this.ctx.createGain();
        slapGain.gain.setValueAtTime(velocity * 0.8, now);
        slapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.045);

        slapNoise.connect(slapFilter);
        slapFilter.connect(slapGain);
        slapGain.connect(dest);

        skinOsc.start(now);
        skinOsc.stop(now + 0.4);
        slapNoise.start(now);
        slapNoise.stop(now + 0.05);
        break;
      }

      case 'talking_drum': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.linearRampToValueAtTime(260, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);

        gain.gain.setValueAtTime(velocity * 1.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.26);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.28);
        break;
      }

      case 'shekere': {
        const noise = this.createNoiseNode(0.12);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 4500;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(velocity * 0.75, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        noise.start(now);
        noise.stop(now + 0.12);
        break;
      }
    }
  }

  private createNoiseNode(duration: number): AudioBufferSourceNode {
    if (!this.ctx) throw new Error('AudioContext missing');
    const bufferSize = Math.max(256, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  // --- Real Synthesizer Instruments (Lead, Rhodes E-Piano, Bass) ---

  public playSynthNote(
    freq: number,
    duration = 0.5,
    preset: 'lead' | 'rhodes' | 'bass' | 'pluck' = 'lead',
    velocity = 0.85
  ) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const dest = this.getSynthDestination(preset);

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    if (preset === 'lead') {
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 1.004, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.frequency.exponentialRampToValueAtTime(800, now + duration);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(velocity * 0.4, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    } else if (preset === 'rhodes') {
      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 2, now);

      filter.type = 'lowpass';
      filter.frequency.value = 3500;

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(velocity * 0.5, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(velocity * 0.2, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration * 1.5);
    } else if (preset === 'bass') {
      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(freq / 2, now);
      osc2.frequency.setValueAtTime(freq / 2, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + duration);

      gain.gain.setValueAtTime(velocity * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    } else {
      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 1.002, now);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3000, now);
      filter.frequency.exponentialRampToValueAtTime(500, now + 0.15);

      gain.gain.setValueAtTime(velocity * 0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    }

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration * 1.6);
    osc2.stop(now + duration * 1.6);
  }

  // Metronome synthesis
  private playMetronomeClick(isDownbeat: boolean) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isDownbeat ? 1400 : 900, now);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Audition single audio clip
  public playSingleClip(clip: AudioClip) {
    if (!this.ctx || !clip.audioBuffer) return;
    this.stopSingleClip();

    const src = this.ctx.createBufferSource();
    src.buffer = clip.audioBuffer;
    const gain = this.ctx.createGain();
    gain.gain.value = clip.gain || 1.0;
    src.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);
    src.start(0);
    this.previewSource = src;
  }

  public stopSingleClip() {
    if (this.previewSource) {
      try {
        this.previewSource.stop();
        this.previewSource.disconnect();
      } catch (e) {
        // ignore
      }
      this.previewSource = null;
    }
  }

  // --- Transport, Playback & Scheduling ---

  public onTimeUpdate(cb: (time: number, step: number) => void) {
    this.timeUpdateListeners.push(cb);
  }

  public removeTimeUpdateListener(cb: (time: number, step: number) => void) {
    this.timeUpdateListeners = this.timeUpdateListeners.filter((l) => l !== cb);
  }

  public async startPlayback(beatGrid: BeatGrid, tracks: Track[]) {
    await this.initAudio();
    if (!this.ctx) return;

    await this.acquireWakeLock();

    this.currentBeatGrid = beatGrid;
    this.currentTracks = tracks;
    this.isPlaying = true;
    this.playbackStartTime = this.ctx.currentTime - this.currentTime;
    this.nextBeatStepTime = this.ctx.currentTime;
    this.currentStep = Math.floor((this.currentTime / (60 / this.bpm / 4)) % 16);

    // Sync all track channels
    tracks.forEach((t) => this.syncTrackChannel(t));

    // Schedule active clips
    this.scheduleClips(tracks, this.currentTime);

    // Run high-precision scheduler loop
    this.runTransportLoop();
  }

  public updateLivePlaybackState(beatGrid: BeatGrid, tracks: Track[]) {
    this.currentBeatGrid = beatGrid;
    this.currentTracks = tracks;
    tracks.forEach((t) => this.syncTrackChannel(t));
  }

  private scheduleClips(tracks: Track[], fromTime: number) {
    if (!this.ctx) return;
    this.stopClips();

    tracks.forEach((track) => {
      if (track.mute) return;
      const channel = this.trackChannels.get(track.id);
      const destination = channel ? channel.input : this.masterGain || this.ctx!.destination;

      track.clips.forEach((clip) => {
        if (!clip.audioBuffer || !this.ctx) return;
        const clipEnd = clip.startTime + clip.duration;
        if (clipEnd <= fromTime) return;

        const source = this.ctx.createBufferSource();
        source.buffer = clip.audioBuffer;

        const clipGain = this.ctx.createGain();
        clipGain.gain.value = clip.gain || 1.0;
        source.connect(clipGain);
        clipGain.connect(destination);

        const whenToPlay = Math.max(0, clip.startTime - fromTime);
        const offset = Math.max(0, fromTime - clip.startTime);

        const playAtCtxTime = this.ctx.currentTime + whenToPlay;
        source.start(playAtCtxTime, offset);

        this.activeClipSources.push({ source, clipId: clip.id });
      });
    });
  }

  private stopClips() {
    this.activeClipSources.forEach((entry) => {
      try {
        entry.source.stop();
        entry.source.disconnect();
      } catch (e) {
        // ignore already stopped
      }
    });
    this.activeClipSources = [];
  }

  public pausePlayback() {
    this.isPlaying = false;
    this.releaseWakeLock();
    this.stopClips();
    this.stopSingleClip();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public stopPlayback() {
    this.isPlaying = false;
    this.releaseWakeLock();
    this.currentTime = 0;
    this.currentStep = 0;
    this.stopClips();
    this.stopSingleClip();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.timeUpdateListeners.forEach((cb) => cb(0, 0));
  }

  public seek(seconds: number, beatGrid?: BeatGrid, tracks?: Track[]) {
    this.currentTime = Math.max(0, seconds);
    if (this.ctx && this.isPlaying) {
      this.playbackStartTime = this.ctx.currentTime - this.currentTime;
      if (tracks) {
        this.scheduleClips(tracks, this.currentTime);
      }
    }
    const stepDuration = 60 / this.bpm / 4;
    this.currentStep = Math.floor((this.currentTime / stepDuration) % 16);
    this.timeUpdateListeners.forEach((cb) => cb(this.currentTime, this.currentStep));
  }

  private runTransportLoop() {
    if (!this.isPlaying || !this.ctx) return;

    const secondsPerBeat = 60 / this.bpm;
    const secondsPer16th = secondsPerBeat / 4;
    const lookahead = 0.08;

    const activeGrid = this.currentBeatGrid;

    // Schedule beat events ahead of current AudioContext time
    while (this.nextBeatStepTime < this.ctx.currentTime + lookahead) {
      const stepIndex = this.currentStep % 16;

      // Metronome
      if (this.metronomeEnabled && stepIndex % 4 === 0) {
        const isDownbeat = stepIndex === 0;
        this.playMetronomeClick(isDownbeat);
      }

      // Drum pattern triggers
      if (activeGrid) {
        (Object.keys(activeGrid) as DrumInstrument[]).forEach((inst) => {
          const steps = activeGrid[inst];
          if (steps && steps[stepIndex]?.active) {
            this.playDrum(inst, steps[stepIndex].velocity || 0.85, this.nextBeatStepTime);
          }
        });
      }

      this.nextBeatStepTime += secondsPer16th;
      this.currentStep = (this.currentStep + 1) % 16;
    }

    // Update transport time
    this.currentTime = this.ctx.currentTime - this.playbackStartTime;

    // Handle loop
    const barSeconds = secondsPerBeat * 4;
    const totalLoopDuration = this.loopEnd > 0 ? this.loopEnd : barSeconds * 8;

    if (this.isLooping && this.currentTime >= totalLoopDuration) {
      this.currentTime = this.loopStart;
      this.playbackStartTime = this.ctx.currentTime - this.loopStart;
      this.scheduleClips(this.currentTracks, this.loopStart);
    }

    this.timeUpdateListeners.forEach((cb) => cb(this.currentTime, this.currentStep));

    this.animationFrameId = requestAnimationFrame(() => this.runTransportLoop());
  }

  // --- Real Microphone Recording & Waveform Extraction ---

  public async startMicrophoneMonitoring(options?: {
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
    autoGainControl?: boolean;
  }): Promise<AnalyserNode> {
    await this.initAudio();
    if (!this.ctx) throw new Error('AudioContext non initialisé');

    try {
      if (!this.mediaStream) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: options?.echoCancellation ?? false,
            noiseSuppression: options?.noiseSuppression ?? false,
            autoGainControl: options?.autoGainControl ?? false,
          },
        });
      }

      if (!this.micAnalyser) {
        this.micAnalyser = this.ctx.createAnalyser();
        this.micAnalyser.fftSize = 1024;
        this.micStreamSource = this.ctx.createMediaStreamSource(this.mediaStream);
        this.micStreamSource.connect(this.micAnalyser);

        // Direct monitoring channel (gain defaults to 0 to prevent Bluetooth delay feedback)
        this.directMonitorGain = this.ctx.createGain();
        this.directMonitorGain.gain.value = this.directMonitoring ? 0.75 : 0.0;
        this.micStreamSource.connect(this.directMonitorGain);
        this.directMonitorGain.connect(this.masterGain || this.ctx.destination);
      }

      return this.micAnalyser;
    } catch (err: any) {
      const msg =
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? "Permission d'accès au microphone refusée dans votre navigateur."
          : "Microphone inaccessible ou aucun périphérique détecté.";
      throw new Error(msg);
    }
  }

  public setDirectMonitoring(enabled: boolean) {
    this.directMonitoring = enabled;
    if (this.directMonitorGain && this.ctx) {
      this.directMonitorGain.gain.setValueAtTime(enabled ? 0.75 : 0.0, this.ctx.currentTime);
    }
  }

  public async startRecording(onMaxLimitReached?: () => void): Promise<void> {
    await this.startMicrophoneMonitoring();
    if (!this.mediaStream) throw new Error('Microphone inaccessible');

    this.recordedChunks = [];
    this.recordStartTime = this.currentTime;
    await this.acquireWakeLock();

    // Safe cross-browser mimeType selection
    let mimeType = '';
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];
    for (const c of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) {
        mimeType = c;
        break;
      }
    }

    this.mediaRecorder = mimeType
      ? new MediaRecorder(this.mediaStream, { mimeType })
      : new MediaRecorder(this.mediaStream);

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };

    // Auto-stop timeout safety (10 min safeguard for mobile devices)
    if (this.maxRecordTimeoutId) clearTimeout(this.maxRecordTimeoutId);
    this.maxRecordTimeoutId = setTimeout(() => {
      if (this.isRecording && onMaxLimitReached) {
        onMaxLimitReached();
      }
    }, this.maxRecordingSeconds * 1000);

    this.mediaRecorder.start(50);
    this.isRecording = true;
  }

  public async stopRecording(trackId: string, trackName: string): Promise<AudioClip> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.ctx) {
        return reject(new Error('Enregistreur inactif'));
      }

      this.mediaRecorder.onstop = async () => {
        this.isRecording = false;
        if (this.maxRecordTimeoutId) {
          clearTimeout(this.maxRecordTimeoutId);
          this.maxRecordTimeoutId = null;
        }
        this.releaseWakeLock();

        try {
          const type = this.mediaRecorder?.mimeType || 'audio/webm';
          const blob = new Blob(this.recordedChunks, { type });
          const arrayBuffer = await blob.arrayBuffer();
          const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);

          // Extract waveform peaks
          const peaks = this.extractWaveformPeaks(audioBuffer, 120);

          // Compute latency compensated start time
          const latencySec = (this.latencyCompensationMs || 0) / 1000;
          const compensatedStart = Math.max(0, this.recordStartTime - latencySec);

          const clip: AudioClip = {
            id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            trackId,
            name: `${trackName} - Prise #${Math.floor(Math.random() * 900 + 100)}`,
            startTime: compensatedStart,
            duration: audioBuffer.duration,
            audioBuffer,
            waveformData: peaks,
            gain: 1.0,
          };

          resolve(clip);
        } catch (err) {
          reject(err);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  // Extract normalized waveform peaks for canvas rendering
  public extractWaveformPeaks(buffer: AudioBuffer, numPeaks = 100): number[] {
    const channelData = buffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / numPeaks);
    const peaks: number[] = [];

    for (let i = 0; i < numPeaks; i++) {
      let max = 0;
      const start = i * blockSize;
      const end = Math.min(start + blockSize, channelData.length);
      for (let j = start; j < end; j++) {
        const val = Math.abs(channelData[j]);
        if (val > max) max = val;
      }
      peaks.push(Math.min(1.0, max));
    }
    return peaks;
  }

  // Helper to load external audio file (drag and drop / upload)
  public async loadAudioFile(file: File, trackId: string): Promise<AudioClip> {
    await this.initAudio();
    if (!this.ctx) throw new Error('AudioContext missing');

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    const peaks = this.extractWaveformPeaks(audioBuffer, 150);

    return {
      id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      trackId,
      name: file.name.replace(/\.[^/.]+$/, ''),
      startTime: 0,
      duration: audioBuffer.duration,
      audioBuffer,
      waveformData: peaks,
      gain: 1.0,
    };
  }

  // --- Real Stereo Mixdown WAV Rendering (OfflineAudioContext) ---

  public async renderProjectToWav(
    projectDurationSec: number,
    tracks: Track[],
    beatGrid: BeatGrid
  ): Promise<Blob> {
    const sampleRate = 44100;
    const length = Math.ceil(sampleRate * projectDurationSec);
    const offlineCtx = new OfflineAudioContext(2, length, sampleRate);

    const masterGain = offlineCtx.createGain();
    masterGain.gain.value = 0.95;
    masterGain.connect(offlineCtx.destination);

    // Track channels map in offline context
    const offlineTrackChannels: Map<string, { gain: GainNode; panner: StereoPannerNode }> = new Map();

    tracks.forEach((track) => {
      if (track.mute) return;
      const trackGain = offlineCtx.createGain();
      trackGain.gain.value = track.volume;
      const trackPanner = offlineCtx.createStereoPanner();
      trackPanner.pan.value = track.pan;

      trackGain.connect(trackPanner);
      trackPanner.connect(masterGain);

      offlineTrackChannels.set(track.id, { gain: trackGain, panner: trackPanner });
    });

    // Destination for drums: beat track or master
    const beatTrack = tracks.find((t) => t.type === 'beat' && !t.mute);
    const beatDestination = beatTrack && offlineTrackChannels.get(beatTrack.id)
      ? offlineTrackChannels.get(beatTrack.id)!.gain
      : masterGain;

    // Render beat grid
    const secondsPerBeat = 60 / this.bpm;
    const secondsPer16th = secondsPerBeat / 4;
    const totalSteps = Math.floor(projectDurationSec / secondsPer16th);

    for (let step = 0; step < totalSteps; step++) {
      const stepIdx = step % 16;
      const stepTime = step * secondsPer16th;

      (Object.keys(beatGrid) as DrumInstrument[]).forEach((inst) => {
        const stepData = beatGrid[inst]?.[stepIdx];
        if (stepData?.active) {
          this.renderDrumOffline(offlineCtx, beatDestination, inst, stepData.velocity || 0.85, stepTime);
        }
      });
    }

    // Render audio clips
    tracks.forEach((track) => {
      if (track.mute) return;
      const ch = offlineTrackChannels.get(track.id);
      if (!ch) return;

      track.clips.forEach((clip) => {
        if (!clip.audioBuffer) return;
        const src = offlineCtx.createBufferSource();
        src.buffer = clip.audioBuffer;
        const clipGain = offlineCtx.createGain();
        clipGain.gain.value = clip.gain || 1.0;
        src.connect(clipGain);
        clipGain.connect(ch.gain);
        src.start(clip.startTime);
      });
    });

    const renderedBuffer = await offlineCtx.startRendering();
    return this.audioBufferToWavBlob(renderedBuffer);
  }

  // Offline rendering supporting all 9 drum instruments
  private renderDrumOffline(
    ctx: OfflineAudioContext,
    destination: AudioNode,
    inst: DrumInstrument,
    velocity: number,
    time: number
  ) {
    switch (inst) {
      case 'kick': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, time);
        osc.frequency.exponentialRampToValueAtTime(45, time + 0.09);
        osc.frequency.exponentialRampToValueAtTime(30, time + 0.28);

        gain.gain.setValueAtTime(velocity * 1.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);

        osc.connect(gain);
        gain.connect(destination);
        osc.start(time);
        osc.stop(time + 0.35);
        break;
      }

      case 'sub808': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(75, time);
        osc.frequency.exponentialRampToValueAtTime(48, time + 0.08);

        gain.gain.setValueAtTime(velocity * 1.1, time);
        gain.gain.linearRampToValueAtTime(velocity * 0.8, time + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.85);

        osc.connect(gain);
        gain.connect(destination);
        osc.start(time);
        osc.stop(time + 0.9);
        break;
      }

      case 'snare': {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, time);
        osc.frequency.exponentialRampToValueAtTime(90, time + 0.1);
        oscGain.gain.setValueAtTime(velocity * 0.8, time);
        oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);
        osc.connect(oscGain);
        oscGain.connect(destination);
        osc.start(time);
        osc.stop(time + 0.15);
        break;
      }

      case 'hihat_closed': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(7800, time);
        gain.gain.setValueAtTime(velocity * 0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        osc.connect(gain);
        gain.connect(destination);
        osc.start(time);
        osc.stop(time + 0.06);
        break;
      }

      case 'hihat_open': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(8500, time);
        gain.gain.setValueAtTime(velocity * 0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);
        osc.connect(gain);
        gain.connect(destination);
        osc.start(time);
        osc.stop(time + 0.35);
        break;
      }

      case 'clap': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1400, time);
        gain.gain.setValueAtTime(velocity * 0.7, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        osc.connect(gain);
        gain.connect(destination);
        osc.start(time);
        osc.stop(time + 0.16);
        break;
      }

      case 'djembe': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(115, time);
        osc.frequency.exponentialRampToValueAtTime(78, time + 0.12);
        gain.gain.setValueAtTime(velocity * 1.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);
        osc.connect(gain);
        gain.connect(destination);
        osc.start(time);
        osc.stop(time + 0.4);
        break;
      }

      case 'talking_drum': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130, time);
        osc.frequency.linearRampToValueAtTime(260, time + 0.08);
        osc.frequency.exponentialRampToValueAtTime(140, time + 0.22);
        gain.gain.setValueAtTime(velocity * 1.1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.26);
        osc.connect(gain);
        gain.connect(destination);
        osc.start(time);
        osc.stop(time + 0.28);
        break;
      }

      case 'shekere': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(4500, time);
        gain.gain.setValueAtTime(velocity * 0.6, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        osc.connect(gain);
        gain.connect(destination);
        osc.start(time);
        osc.stop(time + 0.11);
        break;
      }
    }
  }

  // Convert AudioBuffer to true 16-bit PCM WAV Blob
  public audioBufferToWavBlob(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const left = buffer.getChannelData(0);
    const right = numChannels > 1 ? buffer.getChannelData(1) : left;
    const numSamples = buffer.length;

    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;

    const arrayBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(arrayBuffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');

    // FMT sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // DATA sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Interleave left and right channels
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      let sampleL = Math.max(-1, Math.min(1, left[i]));
      view.setInt16(offset, sampleL < 0 ? sampleL * 0x8000 : sampleL * 0x7fff, true);
      offset += 2;

      let sampleR = Math.max(-1, Math.min(1, right[i]));
      view.setInt16(offset, sampleR < 0 ? sampleR * 0x8000 : sampleR * 0x7fff, true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // --- MIDI File (.mid) Generator for Beat Patterns ---
  public exportMidiFile(beatGrid: BeatGrid): Blob {
    const header = [
      0x4d, 0x54, 0x68, 0x64, // 'MThd'
      0x00, 0x00, 0x00, 0x06, // length 6
      0x00, 0x00, // format 0 (single track)
      0x00, 0x01, // 1 track
      0x01, 0xe0, // 480 division ticks per quarter note
    ];

    const trackEvents: number[] = [];

    // Set tempo event (BPM to microseconds per beat)
    const microSecPerBeat = Math.round(60000000 / this.bpm);
    trackEvents.push(
      0x00, 0xff, 0x51, 0x03,
      (microSecPerBeat >> 16) & 0xff,
      (microSecPerBeat >> 8) & 0xff,
      microSecPerBeat & 0xff
    );

    const midiMap: Record<DrumInstrument, number> = {
      kick: 36, // Bass Drum 1
      sub808: 35, // Acoustic Bass Drum
      snare: 38, // Acoustic Snare
      hihat_closed: 42, // Closed Hi-Hat
      hihat_open: 46, // Open Hi-Hat
      clap: 39, // Hand Clap
      djembe: 60, // Hi Bongo / Djembe equivalent
      talking_drum: 67, // High Agogo / Tama
      shekere: 70, // Maracas / Shekere
    };

    const ticksPer16th = 120; // 480 / 4 = 120 ticks per 16th step
    const noteDuration = 60; // 60 ticks note length

    let deltaCarry = 0;

    for (let step = 0; step < 16; step++) {
      // Find all instruments active on this step
      const activeInsts: { noteNumber: number; velocityByte: number }[] = [];

      (Object.keys(beatGrid) as DrumInstrument[]).forEach((inst) => {
        const stepData = beatGrid[inst]?.[step];
        if (stepData?.active) {
          activeInsts.push({
            noteNumber: midiMap[inst] || 38,
            velocityByte: Math.round((stepData.velocity || 0.85) * 127),
          });
        }
      });

      if (activeInsts.length > 0) {
        // First Note On uses deltaCarry
        activeInsts.forEach((item, idx) => {
          const delta = idx === 0 ? deltaCarry : 0;
          trackEvents.push(...this.toVarLen(delta));
          trackEvents.push(0x99, item.noteNumber, item.velocityByte);
        });

        // First Note Off triggers after noteDuration (60 ticks)
        activeInsts.forEach((item, idx) => {
          const delta = idx === 0 ? noteDuration : 0;
          trackEvents.push(...this.toVarLen(delta));
          trackEvents.push(0x89, item.noteNumber, 0);
        });

        // The remaining ticks in this 16th step are carried over to the next step
        deltaCarry = ticksPer16th - noteDuration;
      } else {
        // Empty step: accumulate full step duration
        deltaCarry += ticksPer16th;
      }
    }

    // End of track meta event
    trackEvents.push(...this.toVarLen(deltaCarry), 0xff, 0x2f, 0x00);

    const trackLength = trackEvents.length;
    const trackHeader = [
      0x4d, 0x54, 0x72, 0x6b, // 'MTrk'
      (trackLength >> 24) & 0xff,
      (trackLength >> 16) & 0xff,
      (trackLength >> 8) & 0xff,
      trackLength & 0xff,
    ];

    const fullMidi = new Uint8Array([...header, ...trackHeader, ...trackEvents]);
    return new Blob([fullMidi], { type: 'audio/midi' });
  }

  private toVarLen(value: number): number[] {
    const bytes: number[] = [];
    let buffer = value & 0x7f;
    while ((value >>= 7) > 0) {
      buffer <<= 8;
      buffer |= 0x80;
      buffer += value & 0x7f;
    }
    while (true) {
      bytes.push(buffer & 0xff);
      if (buffer & 0x80) buffer >>= 8;
      else break;
    }
    return bytes;
  }
}
