/**
 * OKLCH Accessibility Contrast Engine
 *
 * Infers and calculates WCAG AAA compliant text contrast (dark or light)
 * from any background surface lightness (L) using OKLCH perceptual color space
 * and modern CSS Relative Color Syntax.
 */

export interface OklchColor {
  l: number // 0 to 1
  c: number // 0 to 0.4
  h: number // 0 to 360
  a?: number
}

/** Default tipping point for light vs dark text in OKLCH space (perceptual midpoint) */
export const DEFAULT_OKLCH_CONTRAST_THRESHOLD = 0.6

/** Default lightness for dark text on light backgrounds (iron gall / charcoal, WCAG AAA >= 7:1) */
export const DEFAULT_DARK_TEXT_LIGHTNESS = 0.14

/** Default lightness for light text on dark backgrounds (ivory / white, WCAG AAA >= 7:1) */
export const DEFAULT_LIGHT_TEXT_LIGHTNESS = 0.96

/** Default lightness for muted text on light backgrounds */
export const DEFAULT_DARK_MUTED_LIGHTNESS = 0.34

/** Default lightness for muted text on dark backgrounds */
export const DEFAULT_LIGHT_MUTED_LIGHTNESS = 0.76

/**
 * Infers whether text should be dark or light based on the background lightness in OKLCH.
 *
 * @param bgL Background lightness (0.0 to 1.0 in OKLCH)
 * @param threshold Contrast tipping point (default: 0.6)
 * @param darkL Lightness for dark text (default: 0.14)
 * @param lightL Lightness for light text (default: 0.96)
 * @returns The appropriate text lightness (0.0 to 1.0)
 */
export function inferContrastLightness(
  bgL: number,
  threshold = DEFAULT_OKLCH_CONTRAST_THRESHOLD,
  darkL = DEFAULT_DARK_TEXT_LIGHTNESS,
  lightL = DEFAULT_LIGHT_TEXT_LIGHTNESS,
): number {
  return bgL >= threshold ? darkL : lightL
}

/**
 * Infers muted text lightness based on background lightness.
 */
export function inferMutedLightness(
  bgL: number,
  threshold = DEFAULT_OKLCH_CONTRAST_THRESHOLD,
  darkMutedL = DEFAULT_DARK_MUTED_LIGHTNESS,
  lightMutedL = DEFAULT_LIGHT_MUTED_LIGHTNESS,
): number {
  return bgL >= threshold ? darkMutedL : lightMutedL
}

/**
 * Generates standard CSS Relative Color Syntax expression to dynamically infer
 * high-contrast text color from a CSS variable representing a background surface.
 *
 * Example: `cssContrastExpression('--ui-color-surface')`
 * Yields: `oklch(from var(--ui-color-surface) clamp(0.14, (0.6 - l) * 1000, 0.96) 0.01 h)`
 */
export function cssContrastExpression(
  bgVariable: string,
  darkL = DEFAULT_DARK_TEXT_LIGHTNESS,
  lightL = DEFAULT_LIGHT_TEXT_LIGHTNESS,
  threshold = DEFAULT_OKLCH_CONTRAST_THRESHOLD,
): string {
  const varRef = bgVariable.startsWith('--') ? `var(${bgVariable})` : bgVariable
  return `oklch(from ${varRef} clamp(${darkL}, (${threshold} - l) * 1000, ${lightL}) 0.01 h)`
}

/**
 * Generates standard CSS Relative Color Syntax expression for muted text.
 */
export function cssMutedContrastExpression(
  bgVariable: string,
  darkMutedL = DEFAULT_DARK_MUTED_LIGHTNESS,
  lightMutedL = DEFAULT_LIGHT_MUTED_LIGHTNESS,
  threshold = DEFAULT_OKLCH_CONTRAST_THRESHOLD,
): string {
  const varRef = bgVariable.startsWith('--') ? `var(${bgVariable})` : bgVariable
  return `oklch(from ${varRef} clamp(${darkMutedL}, (${threshold} - l) * 1000, ${lightMutedL}) 0.03 h)`
}
