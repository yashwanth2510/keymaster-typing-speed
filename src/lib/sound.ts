// Web Audio API Synthesizer for mechanical key sounds, audio feedback, and focus background ambience

export type AmbienceSoundType = 'forest' | 'crickets' | 'stream' | 'rain' | 'waves' | 'fireplace' | 'typing' | 'cafe' | 'off';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private profile: 'cherry-blue' | 'cherry-red' | 'tactile' | 'typewriter' | 'pop' | 'silent' = 'cherry-blue';

  // Ambience audio properties
  private ambienceEnabled: boolean = false;
  private ambienceSound: AmbienceSoundType = 'rain';
  private ambienceVolume: number = 0.35;
  private ambienceGainNode: GainNode | null = null;
  private activeAmbienceNodes: AudioNode[] = [];
  private ambienceInterval: any = null;
  private stopTimeoutId: any = null;
  private hasInteractionListener: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const handleFirstInteraction = () => {
        this.initCtx();
        if (this.ambienceEnabled && this.ambienceSound !== 'off' && !this.ambienceGainNode) {
          this.startAmbience();
        }
      };
      window.addEventListener('pointerdown', handleFirstInteraction, { passive: true });
      window.addEventListener('keydown', handleFirstInteraction, { passive: true });
      window.addEventListener('mousemove', handleFirstInteraction, { passive: true });
      this.hasInteractionListener = true;

      // Browsers suspend WebAudio while a tab is hidden. When the user returns,
      // re-connect the context so typing sounds and ambience keep working.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.initCtx();
          if (this.ambienceEnabled && this.ambienceSound !== 'off' && !this.ambienceGainNode) {
            this.startAmbience();
          }
        }
      });
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public setProfile(profile: 'cherry-blue' | 'cherry-red' | 'tactile' | 'typewriter' | 'pop' | 'silent') {
    this.profile = profile;
  }

  public updateAmbience(enabled: boolean, sound: AmbienceSoundType, volume: number) {
    const prevEnabled = this.ambienceEnabled;
    const prevSound = this.ambienceSound;

    this.ambienceEnabled = enabled;
    this.ambienceSound = sound;
    this.ambienceVolume = Math.max(0, Math.min(1, volume));

    if (!enabled || sound === 'off') {
      this.stopAmbience();
      return;
    }

    this.initCtx();
    if (!this.ctx) return;

    if (this.ambienceGainNode) {
      try {
        this.ambienceGainNode.gain.setValueAtTime(this.ambienceVolume, this.ctx.currentTime);
      } catch (e) {}
    }

    // Restart ambience nodes if sound type changed or turned on or no active gain node
    if (!prevEnabled || prevSound !== sound || !this.ambienceGainNode) {
      this.startAmbience();
    }
  }

  private stopAmbience(immediate: boolean = false) {
    if (this.ambienceInterval) {
      clearInterval(this.ambienceInterval);
      this.ambienceInterval = null;
    }

    if (this.stopTimeoutId) {
      clearTimeout(this.stopTimeoutId);
      this.stopTimeoutId = null;
    }

    const nodesToStop = [...this.activeAmbienceNodes];
    const gainToStop = this.ambienceGainNode;

    this.activeAmbienceNodes = [];
    this.ambienceGainNode = null;

    if (immediate || !this.ctx) {
      nodesToStop.forEach(node => {
        try {
          if ('stop' in node && typeof (node as any).stop === 'function') {
            (node as any).stop();
          }
          node.disconnect();
        } catch (e) {}
      });
      if (gainToStop) {
        try { gainToStop.disconnect(); } catch (e) {}
      }
    } else {
      if (gainToStop) {
        try {
          gainToStop.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        } catch (e) {}
      }
      this.stopTimeoutId = setTimeout(() => {
        this.stopTimeoutId = null;
        nodesToStop.forEach(node => {
          try {
            if ('stop' in node && typeof (node as any).stop === 'function') {
              (node as any).stop();
            }
            node.disconnect();
          } catch (e) {}
        });
        if (gainToStop) {
          try { gainToStop.disconnect(); } catch (e) {}
        }
      }, 250);
    }
  }

  private startAmbience() {
    // Immediately stop any old ambience nodes without delayed timer interference
    this.stopAmbience(true);
    this.initCtx();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(this.ambienceVolume, now + 0.3);
    masterGain.connect(this.ctx.destination);
    this.ambienceGainNode = masterGain;

    if (this.ambienceSound === 'forest') {
      this.createForestBirdsSound(masterGain);
    } else if (this.ambienceSound === 'crickets') {
      this.createNightCricketsSound(masterGain);
    } else if (this.ambienceSound === 'stream') {
      this.createMountainStreamSound(masterGain);
    } else if (this.ambienceSound === 'fireplace') {
      this.createFireplaceSound(masterGain);
    } else if (this.ambienceSound === 'rain') {
      this.createRainSound(masterGain);
    } else if (this.ambienceSound === 'waves') {
      this.createOceanWavesSound(masterGain);
    } else if (this.ambienceSound === 'typing') {
      this.createTypingClatterSound(masterGain);
    } else if (this.ambienceSound === 'cafe') {
      this.createCafeHumSound(masterGain);
    }
  }

  private createForestBirdsSound(outputNode: GainNode) {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Soft breeze through leaves (filtered pink/brown noise blend)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      data[i] = (b0 + b1 + b2 + b3) * 0.03;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const breezeFilter = this.ctx.createBiquadFilter();
    breezeFilter.type = 'lowpass';
    breezeFilter.frequency.setValueAtTime(450, this.ctx.currentTime);

    // LFO to sway the forest wind
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(250, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(breezeFilter.frequency);
    noise.connect(breezeFilter);
    breezeFilter.connect(outputNode);

    lfo.start();
    noise.start();
    this.activeAmbienceNodes.push(noise, breezeFilter, lfo, lfoGain);

    // Random songbird chirps interval
    this.ambienceInterval = setInterval(() => {
      if (!this.ctx || !this.ambienceEnabled || this.ambienceSound !== 'forest') return;
      const t = this.ctx.currentTime;

      // Generate a bird chirp motif (2 to 4 quick trilling notes)
      const noteCount = Math.floor(Math.random() * 3) + 2;
      const baseFreq = 2200 + Math.random() * 1800;

      for (let n = 0; n < noteCount; n++) {
        const noteStart = t + n * 0.07;
        const birdOsc = this.ctx.createOscillator();
        const birdGain = this.ctx.createGain();

        birdOsc.type = 'sine';
        const startFreq = baseFreq + (n % 2 === 0 ? 300 : -200) + Math.random() * 200;
        birdOsc.frequency.setValueAtTime(startFreq, noteStart);
        birdOsc.frequency.exponentialRampToValueAtTime(startFreq + 500, noteStart + 0.04);
        birdOsc.frequency.exponentialRampToValueAtTime(startFreq - 300, noteStart + 0.065);

        birdGain.gain.setValueAtTime(0.001, noteStart);
        birdGain.gain.linearRampToValueAtTime(0.02, noteStart + 0.015);
        birdGain.gain.exponentialRampToValueAtTime(0.0002, noteStart + 0.065);

        birdOsc.connect(birdGain);
        birdGain.connect(outputNode);

        birdOsc.start(noteStart);
        birdOsc.stop(noteStart + 0.07);
      }
    }, 1400);
  }

  private createNightCricketsSound(outputNode: GainNode) {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;

    // Soothing warm night breeze background
    const bufferSize = sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.008;
    }

    const roomNoise = this.ctx.createBufferSource();
    roomNoise.buffer = buffer;
    roomNoise.loop = true;

    const roomFilter = this.ctx.createBiquadFilter();
    roomFilter.type = 'lowpass';
    roomFilter.frequency.setValueAtTime(300, this.ctx.currentTime);

    roomNoise.connect(roomFilter);
    roomFilter.connect(outputNode);
    roomNoise.start();
    this.activeAmbienceNodes.push(roomNoise, roomFilter);

    // Rhythmic Cricket chirps interval
    this.ambienceInterval = setInterval(() => {
      if (!this.ctx || !this.ambienceEnabled || this.ambienceSound !== 'crickets') return;
      const t = this.ctx.currentTime;

      const chirpFreq = 4200 + Math.random() * 600;
      const pulses = Math.floor(Math.random() * 3) + 3; // 3 to 5 rapid chirps

      for (let p = 0; p < pulses; p++) {
        const pStart = t + p * 0.04;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(chirpFreq, pStart);

        gain.gain.setValueAtTime(0.001, pStart);
        gain.gain.linearRampToValueAtTime(0.018, pStart + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0003, pStart + 0.035);

        osc.connect(gain);
        gain.connect(outputNode);

        osc.start(pStart);
        osc.stop(pStart + 0.038);
      }
    }, 850);
  }

  private createMountainStreamSound(outputNode: GainNode) {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Continuous flowing water pink noise
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      data[i] = (b0 + b1 + b2 + b3) * 0.04;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Dual bandpass filters for stream resonance
    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(750, this.ctx.currentTime);
    filter1.Q.setValueAtTime(1.2, this.ctx.currentTime);

    const filter2 = this.ctx.createBiquadFilter();
    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(1850, this.ctx.currentTime);
    filter2.Q.setValueAtTime(1.8, this.ctx.currentTime);

    const gain1 = this.ctx.createGain();
    const gain2 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.7, this.ctx.currentTime);
    gain2.gain.setValueAtTime(0.4, this.ctx.currentTime);

    noise.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(outputNode);

    noise.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(outputNode);

    noise.start();
    this.activeAmbienceNodes.push(noise, filter1, filter2, gain1, gain2);

    // Water bubble pop sparkles
    this.ambienceInterval = setInterval(() => {
      if (!this.ctx || !this.ambienceEnabled || this.ambienceSound !== 'stream') return;
      const t = this.ctx.currentTime;
      const popOsc = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();

      popOsc.type = 'sine';
      popOsc.frequency.setValueAtTime(1200 + Math.random() * 1600, t);
      popOsc.frequency.exponentialRampToValueAtTime(400, t + 0.02);

      popGain.gain.setValueAtTime(0.012, t);
      popGain.gain.exponentialRampToValueAtTime(0.0002, t + 0.02);

      popOsc.connect(popGain);
      popGain.connect(outputNode);
      popOsc.start(t);
      popOsc.stop(t + 0.022);
    }, 150);
  }

  private createFireplaceSound(outputNode: GainNode) {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;

    // Low wood fire hum
    const bufferSize = sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 0.6;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const fireFilter = this.ctx.createBiquadFilter();
    fireFilter.type = 'lowpass';
    fireFilter.frequency.setValueAtTime(280, this.ctx.currentTime);

    noise.connect(fireFilter);
    fireFilter.connect(outputNode);
    noise.start();
    this.activeAmbienceNodes.push(noise, fireFilter);

    // Wood crackle pop triggers
    this.ambienceInterval = setInterval(() => {
      if (!this.ctx || !this.ambienceEnabled || this.ambienceSound !== 'fireplace') return;
      if (Math.random() < 0.65) {
        const t = this.ctx.currentTime;
        const clickBuf = this.ctx.createBuffer(1, sampleRate * 0.012, sampleRate);
        const clickData = clickBuf.getChannelData(0);
        for (let i = 0; i < clickData.length; i++) {
          clickData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.003));
        }

        const clickSrc = this.ctx.createBufferSource();
        clickSrc.buffer = clickBuf;

        const clickFilter = this.ctx.createBiquadFilter();
        clickFilter.type = 'highpass';
        clickFilter.frequency.setValueAtTime(1500 + Math.random() * 2500, t);

        const clickGain = this.ctx.createGain();
        clickGain.gain.setValueAtTime(0.035, t);
        clickGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.012);

        clickSrc.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(outputNode);

        clickSrc.start(t);
        clickSrc.stop(t + 0.015);
      }
    }, 70);
  }

  private createRainSound(outputNode: GainNode) {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate Pink Noise for soothing rain rumble
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(outputNode);
    noise.start();
    this.activeAmbienceNodes.push(noise, filter);

    // Random raindrops interval
    this.ambienceInterval = setInterval(() => {
      if (!this.ctx || !this.ambienceEnabled || this.ambienceSound !== 'rain') return;
      const t = this.ctx.currentTime;
      const dropOsc = this.ctx.createOscillator();
      const dropGain = this.ctx.createGain();
      dropOsc.type = 'sine';
      dropOsc.frequency.setValueAtTime(1400 + Math.random() * 1200, t);
      dropOsc.frequency.exponentialRampToValueAtTime(300, t + 0.015);

      dropGain.gain.setValueAtTime(0.015, t);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);

      dropOsc.connect(dropGain);
      dropGain.connect(outputNode);
      dropOsc.start(t);
      dropOsc.stop(t + 0.02);
    }, 120);
  }

  private createTypingClatterSound(outputNode: GainNode) {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    
    // Low room background rumble
    const bufferSize = sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.01;
    }

    const roomNoise = this.ctx.createBufferSource();
    roomNoise.buffer = buffer;
    roomNoise.loop = true;

    const roomFilter = this.ctx.createBiquadFilter();
    roomFilter.type = 'lowpass';
    roomFilter.frequency.setValueAtTime(350, this.ctx.currentTime);

    roomNoise.connect(roomFilter);
    roomFilter.connect(outputNode);
    roomNoise.start();
    this.activeAmbienceNodes.push(roomNoise, roomFilter);

    // Ambient keystroke clatter interval mimicking nearby typing
    this.ambienceInterval = setInterval(() => {
      if (!this.ctx || !this.ambienceEnabled || this.ambienceSound !== 'typing') return;
      const t = this.ctx.currentTime;
      const isSpace = Math.random() < 0.15;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = isSpace ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isSpace ? 400 : 900 + Math.random() * 800, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.025);

      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.025);

      // Noise click snap
      const clickBuf = this.ctx.createBuffer(1, sampleRate * 0.01, sampleRate);
      const clickData = clickBuf.getChannelData(0);
      for (let i = 0; i < clickData.length; i++) {
        clickData[i] = Math.random() * 2 - 1;
      }
      const clickSrc = this.ctx.createBufferSource();
      clickSrc.buffer = clickBuf;

      const clickFilter = this.ctx.createBiquadFilter();
      clickFilter.type = 'bandpass';
      clickFilter.frequency.setValueAtTime(2000, t);
      clickFilter.Q.setValueAtTime(1.5, t);

      const clickGain = this.ctx.createGain();
      clickGain.gain.setValueAtTime(0.025, t);
      clickGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.01);

      clickSrc.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(outputNode);

      osc.connect(gain);
      gain.connect(outputNode);

      osc.start(t);
      clickSrc.start(t);
      osc.stop(t + 0.03);
      clickSrc.stop(t + 0.015);
    }, 180);
  }

  private createOceanWavesSound(outputNode: GainNode) {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Brown noise for deep ocean swell
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 0.8;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, this.ctx.currentTime);

    // LFO to sweep cutoff frequency up and down for ocean waves
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8 second wave cycle
    lfoGain.gain.setValueAtTime(220, this.ctx.currentTime); // sweep range

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(outputNode);

    lfo.start();
    noise.start();
    this.activeAmbienceNodes.push(noise, filter, lfo, lfoGain);
  }

  private createCafeHumSound(outputNode: GainNode) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Soft warm dual drone
    const drone1 = this.ctx.createOscillator();
    const drone2 = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();

    drone1.type = 'sine';
    drone1.frequency.setValueAtTime(110, now); // A2
    drone2.type = 'sine';
    drone2.frequency.setValueAtTime(164.81, now); // E3

    droneGain.gain.setValueAtTime(0.03, now);

    drone1.connect(droneGain);
    drone2.connect(droneGain);

    // Pink noise background room tone
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.02;
    }

    const roomNoise = this.ctx.createBufferSource();
    roomNoise.buffer = buffer;
    roomNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);

    roomNoise.connect(filter);
    filter.connect(outputNode);
    droneGain.connect(outputNode);

    drone1.start();
    drone2.start();
    roomNoise.start();

    this.activeAmbienceNodes.push(drone1, drone2, droneGain, roomNoise, filter);
  }

  public playKeyPress(key: string = '', overrideEnabled: boolean = false) {
    if ((!this.enabled && !overrideEnabled) || (this.profile === 'silent' && !overrideEnabled)) return;
    this.initCtx();
    if (!this.ctx) return;

    // Browsers start AudioContext suspended (autoplay policy). Only schedule
    // oscillators once the context is actually running, otherwise the sound is
    // silently dropped (e.g. the loading-screen keystroke sounds).
    if (this.ctx.state !== 'running') {
      this.ctx.resume().then(() => this.doKeyPress(key)).catch(() => {});
      return;
    }
    this.doKeyPress(key);
  }

  private doKeyPress(key: string = '') {
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Space key has a deeper thump sound
    const isSpace = key === ' ' || key === 'Space';

    if (this.profile === 'cherry-blue') {
      // High click + metallic resonance
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isSpace ? 800 : 1200 + Math.random() * 200, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      // Noise burst for mechanical click snap
      const bufferSize = this.ctx.sampleRate * 0.015;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

      whiteNoise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      whiteNoise.start(now);
      osc.stop(now + 0.05);
      whiteNoise.stop(now + 0.02);

    } else if (this.profile === 'cherry-red') {
      // Soft linear thock sound
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isSpace ? 300 : 450 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.035);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);

    } else if (this.profile === 'pop') {
      // Bubble pop sound
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime( explainsFreq(isSpace, key), now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.03);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);

    } else if (this.profile === 'typewriter') {
      // Classic metallic clack
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(isSpace ? 600 : 950 + Math.random() * 100, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);

    } else {
      // Tactile default
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isSpace ? 500 : 850, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.03);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    }
  }

  public playError() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.setValueAtTime(120, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playSuccess(overrideEnabled: boolean = false) {
    if (!this.enabled && !overrideEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    if (this.ctx.state !== 'running') {
      this.ctx.resume().then(() => this.doPlaySuccess()).catch(() => {});
      return;
    }
    this.doPlaySuccess();
  }

  private doPlaySuccess() {
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);

      gain.gain.setValueAtTime(0.1, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.2);
    });
  }

  public playExplosion() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.2);
  }

  public playCarriageReturnBell(overrideEnabled: boolean = false) {
    if (!this.enabled && !overrideEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bellOsc = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();

    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(2093, now);

    bellGain.gain.setValueAtTime(0.25, now);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

    bellOsc.connect(bellGain);
    bellGain.connect(this.ctx.destination);

    bellOsc.start(now);
    bellOsc.stop(now + 0.8);

    setTimeout(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const t = this.ctx.currentTime;
      const clackOsc = this.ctx.createOscillator();
      const clackGain = this.ctx.createGain();

      clackOsc.type = 'triangle';
      clackOsc.frequency.setValueAtTime(320, t);
      clackOsc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

      clackGain.gain.setValueAtTime(0.2, t);
      clackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      clackOsc.connect(clackGain);
      clackGain.connect(this.ctx.destination);

      clackOsc.start(t);
      clackOsc.stop(t + 0.08);
    }, 150);
  }
}

function explainsFreq(isSpace: boolean, key: string): number {
  if (isSpace) return 250;
  const code = key.charCodeAt(0) || 65;
  return 300 + (code % 20) * 15;
}

export const soundEngine = new SoundEngine();
