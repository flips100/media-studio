export type FilterId =
  | 'none'
  | 'grayscale'
  | 'sepia'
  | 'invert'
  | 'warm'
  | 'cool'
  | 'vintage'
  | 'sharpen'

export const FILTERS: { id: FilterId; label: string; css: string }[] = [
  { id: 'none', label: 'None', css: 'none' },
  { id: 'grayscale', label: 'Grayscale', css: 'grayscale(1)' },
  { id: 'sepia', label: 'Sepia', css: 'sepia(0.85)' },
  { id: 'invert', label: 'Invert', css: 'invert(1)' },
  { id: 'warm', label: 'Warm', css: 'sepia(0.35) saturate(1.3) hue-rotate(-10deg)' },
  { id: 'cool', label: 'Cool', css: 'saturate(0.9) hue-rotate(20deg) brightness(1.05)' },
  { id: 'vintage', label: 'Vintage', css: 'sepia(0.5) contrast(0.9) brightness(1.05)' },
  { id: 'sharpen', label: 'Contrast+', css: 'contrast(1.35) saturate(1.1)' },
]

export function buildCssFilter(
  brightness: number,
  contrast: number,
  saturation: number,
  filterId: FilterId,
): string {
  const base = FILTERS.find((f) => f.id === filterId)?.css ?? 'none'
  const adjust = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
  if (base === 'none') return adjust
  return `${adjust} ${base}`
}
