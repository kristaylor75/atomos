/**
 * Haptic feedback utility — uses Vibration API where available, silently no-ops elsewhere.
 */

const supported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

export const haptics = {
  /** Light tap — digit/function buttons */
  tap: () => supported && navigator.vibrate(8),

  /** Medium click — operators, nav items */
  click: () => supported && navigator.vibrate(15),

  /** Success pulse — equals / result */
  success: () => supported && navigator.vibrate([10, 30, 20]),

  /** Error buzz */
  error: () => supported && navigator.vibrate([20, 10, 20, 10, 40]),

  /** Hub open/close */
  menu: () => supported && navigator.vibrate(12),
};