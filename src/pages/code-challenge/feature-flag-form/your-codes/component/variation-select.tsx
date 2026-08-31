import { SelectField } from '#/components/form'

export function VariationSelect({
  variations,
  value,
  serveMode = 'variation',
  onChange,
  onServeModeChange,
}: {
  variations: Array<{ name: string; value: string }>
  value: string
  serveMode?: 'variation' | 'percentage' | 'progressive'
  onChange: (value: string) => void
  onServeModeChange?: (
    value: 'variation' | 'percentage' | 'progressive',
  ) => void
}) {
  const selectValue =
    serveMode === 'variation' ? `variation:${value}` : `rollout:${serveMode}`

  return (
    <SelectField
      label="Serve"
      value={selectValue}
      onValueChange={(nextValue) => {
        if (nextValue.startsWith('variation:')) {
          onServeModeChange?.('variation')
          onChange(nextValue.slice('variation:'.length))
          return
        }

        onServeModeChange?.(
          nextValue.slice('rollout:'.length) as 'percentage' | 'progressive',
        )
      }}
      options={[
        ...variations.map((variation, index) => ({
          value: `variation:${variation.name}`,
          label: `● ${variation.name || `Variation ${index + 1}`}`,
        })),
        { value: 'rollout:percentage', label: '↗ Percentage rollout' },
        { value: 'rollout:progressive', label: '↗ Progressive rollout' },
      ]}
    />
  )
}
