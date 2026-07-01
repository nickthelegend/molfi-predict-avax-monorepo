import successMp3 from "@/assets/success.mp3";

let successAudio: HTMLAudioElement | null = null;
let playTimer: ReturnType<typeof setTimeout> | null = null;
let actionDepth = 0;

const PLAY_DEBOUNCE_MS = 200;

function getSuccessAudio(): HTMLAudioElement {
  if (!successAudio) {
    successAudio = new Audio(successMp3);
    successAudio.volume = 1;
  }
  return successAudio;
}

function playSuccessSoundNow() {
  const audio = getSuccessAudio();
  audio.volume = 1;
  audio.currentTime = 0;
  void audio.play().catch(() => {});
}

/** Unlock playback during a user gesture (call synchronously from click/submit). */
export function primeSuccessSound() {
  const audio = getSuccessAudio();
  const volume = audio.volume;
  audio.volume = 0;
  void audio
    .play()
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = volume;
    })
    .catch(() => {
      audio.volume = volume;
    });
}

/**
 * Mark the start of a multi-step user action. Primes autoplay once; success
 * sound plays only after {@link endSuccessSoundAction} drops depth back to 0.
 */
export function beginSuccessSoundAction() {
  if (actionDepth === 0) primeSuccessSound();
  actionDepth++;
}

/** Drop a primed step without playing (e.g. mutation failed after begin). */
export function cancelSuccessSoundAction() {
  actionDepth = Math.max(0, actionDepth - 1);
}

/** Complete one step of a batched action; plays sound only on the last step. */
export function endSuccessSoundAction() {
  actionDepth = Math.max(0, actionDepth - 1);
  if (actionDepth === 0) playSuccessSound();
}

/**
 * Play the success chime. Rapid calls within a short window are coalesced so
 * only the last success in a multi-tx action plays once.
 */
export function playSuccessSound() {
  if (actionDepth > 0) return;

  if (playTimer) clearTimeout(playTimer);
  playTimer = setTimeout(() => {
    playTimer = null;
    playSuccessSoundNow();
  }, PLAY_DEBOUNCE_MS);
}
