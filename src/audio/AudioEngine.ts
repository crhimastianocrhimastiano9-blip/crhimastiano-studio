export class AudioEngine {
  private context: AudioContext | null = null;

  init() {
    if (!this.context) {
      this.context = new AudioContext();
    }

    if (this.context.state === 'suspended') {
      void this.context.resume();
    }
  }

  getContext() {
    if (!this.context) {
      this.context = new AudioContext();
    }

    return this.context;
  }

  destroy() {
    void this.context?.close();
    this.context = null;
  }
}
