import type { SelectOption } from '#/components/form'

export type ServeMode = 'variation' | 'percentage' | 'progressive'

type Variation = { name: string; value: string }

export function createServeOptions(
  variations: Variation[],
): Array<SelectOption<string>> {
  return [
    ...variations.map((variation, index) => ({
      value: `variation:${variation.name}`,
      label: `● ${variation.name || `Variation ${index + 1}`}`,
    })),
    { value: 'rollout:percentage', label: '↗ Percentage rollout' },
    { value: 'rollout:progressive', label: '↗ Progressive rollout' },
  ]
}

export function getServeSelectValue(mode: ServeMode, variation: string) {
  return mode === 'variation'
    ? `variation:${variation}`
    : `rollout:${mode}`
}

export function parseServeSelectValue(value: string):
  | { mode: 'variation'; variation: string }
  | { mode: 'percentage' | 'progressive' }
  | null {
  if (value.startsWith('variation:')) {
    return {
      mode: 'variation',
      variation: value.slice('variation:'.length),
    }
  }

  if (value === 'rollout:percentage') return { mode: 'percentage' }
  if (value === 'rollout:progressive') return { mode: 'progressive' }
  return null
}

