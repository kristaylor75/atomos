/**
 * Singleton radio player — persists across page navigation.
 * Manages the Audio element, AudioContext, AnalyserNode, and GainNode.
 */

const player = {
  audio: null,
  audioCtx: null,
  analyser: null,
  gainNode: null,
  sourceNode: null,
  volume: 0.8,
  muted: false,
  currentStation: null,
  _listeners: [],

  _notify() {
    this._listeners.forEach(fn => fn());
  },

  subscribe(fn) {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter(l => l !== fn); };
  },

  _initAudioContext() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.value = this.muted ? 0 : this.volume;
    this.gainNode.connect(this.audioCtx.destination);

    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 128;
    this.analyser.smoothingTimeConstant = 0.8;
    this.analyser.connect(this.gainNode);
  },

  play(station) {
    // Same station already playing — do nothing
    if (this.currentStation?.url === station.url && this.audio && !this.audio.paused) return;

    this.stop();
    this._initAudioContext();

    this.currentStation = station;
    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    this.audio.src = station.url;
    this.audio.preload = 'none';

    try {
      this.sourceNode = this.audioCtx.createMediaElementSource(this.audio);
      this.sourceNode.connect(this.analyser);
    } catch {
      // If source already connected or CORS blocks Web Audio, fall back to direct playback
    }

    this.gainNode.gain.value = this.muted ? 0 : this.volume;
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    this.audio.play().catch(() => {});
    this._notify();
  },

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch {}
      this.sourceNode = null;
    }
    this.currentStation = null;
    this._notify();
  },

  setVolume(v) {
    this.volume = v;
    if (this.gainNode && !this.muted) this.gainNode.gain.value = v;
    this._notify();
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.gainNode) this.gainNode.gain.value = this.muted ? 0 : this.volume;
    this._notify();
  },

  isPlaying() {
    return this.audio && !this.audio.paused;
  },

  getFrequencyData() {
    if (!this.analyser) return new Uint8Array(64).fill(0);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  },
};

export default player;