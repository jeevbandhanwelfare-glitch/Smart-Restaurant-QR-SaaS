type Alarm = {
  context: AudioContext;
  timer: number;
  gain: GainNode;
};

/**
 * Browser-only alarm controller for the kitchen display.
 * AudioContext creation is intentionally deferred until arm(), which should
 * be called from the Start Shift click handler to satisfy autoplay policies.
 */
class KitchenAlarm {
  private audio: AudioContext | null = null;
  private alarms = new Map<string, Alarm>();

  arm() {
    if (!this.audio) this.audio = new AudioContext();
    if (this.audio.state === "suspended") void this.audio.resume();
  }

  ring(orderId: string) {
    this.arm();
    if (this.alarms.has(orderId) || !this.audio) return;
    const context = this.audio;
    const gain = context.createGain();
    gain.gain.value = 0.0001;
    gain.connect(context.destination);
    const chime = () => {
      const now = context.currentTime;
      [660, 880, 990].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        oscillator.connect(gain);
        oscillator.start(now + index * 0.08);
        oscillator.stop(now + index * 0.08 + 0.18);
      });
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.24, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    };
    chime();
    const timer = window.setInterval(chime, 1000);
    this.alarms.set(orderId, { context, timer, gain });
  }

  acknowledge(orderId: string) {
    const alarm = this.alarms.get(orderId);
    if (!alarm) return;
    window.clearInterval(alarm.timer);
    alarm.gain.gain.setTargetAtTime(0.0001, alarm.context.currentTime, 0.04);
    alarm.gain.disconnect();
    this.alarms.delete(orderId);
  }
}

export const kitchenAlarm = new KitchenAlarm();