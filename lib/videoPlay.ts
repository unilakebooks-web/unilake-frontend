/** True when the browser refused to play with sound (it wants a recent click). */
export function isSoundRefused(error: unknown): boolean {
  return error instanceof DOMException && error.name === "NotAllowedError";
}

/**
 * Plays with the sound the visitor expects. A browser may refuse sound (NotAllowedError, for example
 * when the click was too long ago); then it plays muted and `onMuted` lets the player show the mute
 * button. Resolves true when the video is playing and false when it could not play at all. Any other
 * failure (an AbortError means someone paused it on purpose) is left alone: it must not restart the
 * video.
 */
export async function playOrFallBackToMuted(
  video: HTMLVideoElement,
  onMuted: () => void
): Promise<boolean> {
  try {
    await video.play();
    return true;
  } catch (error) {
    // Already muted: the refusal is not about sound, so a muted retry would fail the same way.
    if (!isSoundRefused(error) || video.muted) return false;
  }
  video.muted = true;
  onMuted();
  try {
    await video.play();
    return true;
  } catch {
    return false;
  }
}
