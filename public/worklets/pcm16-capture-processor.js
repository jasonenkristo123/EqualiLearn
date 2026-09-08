/* biome-ignore-all lint/correctness/noUndeclaredVariables: AudioWorklet globals are supplied by the browser runtime. */

const OUTPUT_BUFFER_SIZE = 2048;

class Pcm16CaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.targetSampleRate = options.processorOptions?.targetSampleRate ?? 16000;
    this.phase = 0;
    this.sampleSum = 0;
    this.sampleCount = 0;
    this.output = new Int16Array(OUTPUT_BUFFER_SIZE);
    this.outputIndex = 0;

    this.port.onmessage = (event) => {
      if (event.data?.type !== "flush") return;
      this.writePendingSample();
      this.emitAudio();
      this.port.postMessage({ type: "flushed" });
    };
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;

    for (let index = 0; index < input.length; index += 1) {
      this.sampleSum += input[index];
      this.sampleCount += 1;
      this.phase += this.targetSampleRate;

      if (this.phase >= sampleRate) {
        this.writePendingSample();
        this.phase -= sampleRate;
      }
    }

    return true;
  }

  writePendingSample() {
    if (this.sampleCount === 0) return;

    const sample = Math.max(-1, Math.min(1, this.sampleSum / this.sampleCount));
    this.output[this.outputIndex] =
      sample < 0 ? Math.round(sample * 32768) : Math.round(sample * 32767);
    this.outputIndex += 1;
    this.sampleSum = 0;
    this.sampleCount = 0;

    if (this.outputIndex === this.output.length) this.emitAudio();
  }

  emitAudio() {
    if (this.outputIndex === 0) return;

    const chunk = this.output.slice(0, this.outputIndex);
    this.port.postMessage({ type: "audio", buffer: chunk.buffer }, [
      chunk.buffer,
    ]);
    this.outputIndex = 0;
  }
}

registerProcessor("pcm16-capture-processor", Pcm16CaptureProcessor);
