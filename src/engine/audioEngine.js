import { Howl } from 'howler';

class AudioManager {
  constructor() {
    this.bgm = { current: null, volume: 1.0 };
    this.bgs = { current: null, volume: 1.0 };
    this.sfx = { volume: 1.0 };
    this.masterVolume = { bgm: 1.0, bgs: 1.0, sfx: 1.0 };
    this.systemSFX = { cursor: null, confirm: null, buzzer: null, lettersound: null };
    this.letterSoundEnabled = true;
  }

  setMasterVolume(channel, volume) {
    this.masterVolume[channel] = Math.max(0, Math.min(1, volume));
    if (channel === 'bgm' && this.bgm.current) {
      this.bgm.current.volume(this.bgm.volume * this.masterVolume.bgm);
    }
    if (channel === 'bgs' && this.bgs.current) {
      this.bgs.current.volume(this.bgs.volume * this.masterVolume.bgs);
    }
  }

  loadSystemSFX(type, src) {
    this.systemSFX[type] = new Howl({ src: [src], volume: this.masterVolume.sfx });
  }

  playSystemSFX(type) {
    if (type === 'lettersound' && !this.letterSoundEnabled) return;
    if (this.systemSFX[type]) this.systemSFX[type].play();
  }

  playBGM(src, volume = 1.0, pitch = 1.0, loop = true) {
    this.stopBGM();
    this.bgm.volume = volume;
    this.bgm.current = new Howl({
      src: [src],
      loop: loop,
      volume: volume * this.masterVolume.bgm,
      rate: pitch
    });
    this.bgm.current.play();
  }

  stopBGM() {
    if (this.bgm.current) {
      this.bgm.current.stop();
      this.bgm.current = null;
    }
  }

  fadeBGM(duration, targetVolume = 0) {
    if (this.bgm.current) {
      const finalVolume = targetVolume * this.masterVolume.bgm;
      this.bgm.current.fade(this.bgm.current.volume(), finalVolume, duration);
      if (targetVolume === 0) {
        setTimeout(() => this.stopBGM(), duration);
      }
    }
  }

  playBGS(src, volume = 1.0, pitch = 1.0, loop = true) {
    this.stopBGS();
    this.bgs.volume = volume;
    this.bgs.current = new Howl({
      src: [src],
      loop: loop,
      volume: volume * this.masterVolume.bgs,
      rate: pitch
    });
    this.bgs.current.play();
  }

  stopBGS() {
    if (this.bgs.current) {
      this.bgs.current.stop();
      this.bgs.current = null;
    }
  }

  fadeBGS(duration, targetVolume = 0) {
    if (this.bgs.current) {
      const finalVolume = targetVolume * this.masterVolume.bgs;
      this.bgs.current.fade(this.bgs.current.volume(), finalVolume, duration);
      if (targetVolume === 0) {
        setTimeout(() => this.stopBGS(), duration);
      }
    }
  }

  playSFX(src, volume = 1.0, pitch = 1.0, pan = 0) {
    const sfx = new Howl({
      src: [src],
      volume: volume * this.masterVolume.sfx,
      rate: pitch,
      stereo: pan
    });
    sfx.play();
  }

  stopAllSFX() {
    Howler.stop();
  }

  stopAll() {
    this.stopBGM();
    this.stopBGS();
    Howler.stop();
  }

}

export const audioManager = new AudioManager();

export const exportAudioEngine = () => {
  return `
    class AudioManager {
      constructor() {
        this.bgm = { current: null, volume: 1.0 };
        this.bgs = { current: null, volume: 1.0 };
        this.sfx = { volume: 1.0 };
        this.masterVolume = { bgm: 1.0, bgs: 1.0, sfx: 1.0 };
        this.systemSFX = { cursor: null, confirm: null, buzzer: null, lettersound: null };
        this.letterSoundEnabled = true;
      }
      setMasterVolume(channel, volume) {
        this.masterVolume[channel] = Math.max(0, Math.min(1, volume));
        if (channel === 'bgm' && this.bgm.current) this.bgm.current.volume(this.bgm.volume * this.masterVolume.bgm);
        if (channel === 'bgs' && this.bgs.current) this.bgs.current.volume(this.bgs.volume * this.masterVolume.bgs);
      }
      loadSystemSFX(type, src) {
        this.systemSFX[type] = new Howl({ src: [src], volume: this.masterVolume.sfx });
      }
      playSystemSFX(type) {
        if (type === 'lettersound' && !this.letterSoundEnabled) return;
        if (this.systemSFX[type]) this.systemSFX[type].play();
      }
      playBGM(src, volume = 1.0, pitch = 1.0, loop = true) {
        this.stopBGM();
        this.bgm.volume = volume;
        this.bgm.current = new Howl({ src: [src], loop: loop, volume: volume * this.masterVolume.bgm, rate: pitch });
        this.bgm.current.play();
      }
      stopBGM() {
        if (this.bgm.current) { this.bgm.current.stop(); this.bgm.current = null; }
      }
      fadeBGM(duration, targetVolume = 0) {
        if (this.bgm.current) {
          const finalVolume = targetVolume * this.masterVolume.bgm;
          this.bgm.current.fade(this.bgm.current.volume(), finalVolume, duration);
          if (targetVolume === 0) setTimeout(() => this.stopBGM(), duration);
        }
      }
      playBGS(src, volume = 1.0, pitch = 1.0, loop = true) {
        this.stopBGS();
        this.bgs.volume = volume;
        this.bgs.current = new Howl({ src: [src], loop: loop, volume: volume * this.masterVolume.bgs, rate: pitch });
        this.bgs.current.play();
      }
      stopBGS() {
        if (this.bgs.current) { this.bgs.current.stop(); this.bgs.current = null; }
      }
      fadeBGS(duration, targetVolume = 0) {
        if (this.bgs.current) {
          const finalVolume = targetVolume * this.masterVolume.bgs;
          this.bgs.current.fade(this.bgs.current.volume(), finalVolume, duration);
          if (targetVolume === 0) setTimeout(() => this.stopBGS(), duration);
        }
      }
      playSFX(src, volume = 1.0, pitch = 1.0, pan = 0) {
        const sfx = new Howl({ src: [src], volume: volume * this.masterVolume.sfx, rate: pitch, stereo: pan });
        sfx.play();
      }
      stopAllSFX() { Howler.stop(); }
    }
    const audioManager = new AudioManager();
  `;
};