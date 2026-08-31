import { SelectField } from '#/components/form'
import { Input } from '#/components/ui/input'

import type { ProgressiveRollout } from '../schema'

type Variation = { name: string; value: string }

export function ProgressiveRolloutEditor({
  variations,
  value,
  onChange,
}: {
  variations: Variation[]
  value: ProgressiveRollout
  onChange: (value: ProgressiveRollout) => void
}) {
  const variationOptions = variations.map((variation, index) => ({
    value: variation.name,
    label: `● ${variation.name || `Variation ${index + 1}`}`,
  }))
  const update = <TKey extends keyof ProgressiveRollout>(
    key: TKey,
    nextValue: ProgressiveRollout[TKey],
  ) => onChange({ ...value, [key]: nextValue })

  return (
    <div className="mt-4 space-y-4 rounded-xl bg-muted/40 p-4">
      <p className="text-sm italic text-muted-foreground">
        A progressive rollout allows you to increase the percentage of your flag
        over time. Select a release ramp between the start and end date.
      </p>
      <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(190px,1fr)_auto_minmax(170px,0.9fr)_auto_100px_auto]">
        <span>Start on the</span>
        <Input
          type="datetime-local"
          className="h-10 bg-background"
          value={value.startDate}
          onChange={(event) => update('startDate', event.target.value)}
        />
        <span>and serve</span>
        <SelectField
          label="Start variation"
          value={value.startVariation}
          options={variationOptions}
          onValueChange={(variation) => update('startVariation', variation)}
        />
        <span>to</span>
        <Input
          type="number"
          min={0}
          max={100}
          className="h-10 bg-background text-base md:text-base"
          value={value.startPercentage}
          onChange={(event) =>
            update(
              'startPercentage',
              Math.min(100, Math.max(0, event.target.valueAsNumber || 0)),
            )
          }
        />
        <span>%</span>
        <span>Stop on the</span>
        <Input
          type="datetime-local"
          className="h-10 bg-background"
          value={value.endDate}
          onChange={(event) => update('endDate', event.target.value)}
        />
        <span>and serve</span>
        <SelectField
          label="End variation"
          value={value.endVariation}
          options={variationOptions}
          onValueChange={(variation) => update('endVariation', variation)}
        />
        <span>to</span>
        <Input
          type="number"
          min={0}
          max={100}
          className="h-10 bg-background text-base md:text-base"
          value={value.endPercentage}
          onChange={(event) =>
            update(
              'endPercentage',
              Math.min(100, Math.max(0, event.target.valueAsNumber || 0)),
            )
          }
        />
        <span>%</span>
      </div>
      {new Date(value.endDate) <= new Date(value.startDate) ? (
        <p className="text-xs text-destructive">
          End date must be after start date.
        </p>
      ) : null}
    </div>
  )
}

export function PercentageRolloutEditor({
  variations,
  percentages,
  onChange,
}: {
  variations: Variation[]
  percentages: number[]
  onChange: (percentages: number[]) => void
}) {
  const total = percentages.reduce(
    (sum, percentage, index) =>
      index < variations.length ? sum + percentage : sum,
    0,
  )
  const updatePercentage = (index: number, percentage: number) => {
    const next = variations.map(
      (_, variationIndex) => percentages[variationIndex] ?? 0,
    )
    next[index] = Math.min(100, Math.max(0, percentage || 0))
    onChange(next)
  }

  return (
    <div className="mt-4 space-y-4 rounded-xl bg-muted/40 p-4">
      <p className="text-sm italic text-muted-foreground">
        A percentage rollout divides users into stable buckets and serves each
        bucket a selected variation.
      </p>
      <div className="space-y-2">
        {variations.map((variation, index) => (
          <label
            key={`${variation.name}-${index}`}
            className="flex items-center gap-2"
          >
            <span aria-hidden="true">•</span>
            <Input
              type="number"
              min={0}
              max={100}
              className="h-10 w-24 bg-background text-base md:text-base"
              aria-label={`${variation.name || `Variation ${index + 1}`} percentage`}
              value={percentages[index] ?? 0}
              onChange={(event) =>
                updatePercentage(index, event.target.valueAsNumber)
              }
            />
            <span>%</span>
            <span
              className={`size-4 rounded-full ${
                variation.value.trim() === 'true'
                  ? 'bg-emerald-500'
                  : variation.value.trim() === 'false'
                    ? 'bg-orange-500'
                    : 'bg-rose-500'
              }`}
              aria-hidden="true"
            />
            <span className="font-medium">
              {variation.name || `Variation ${index + 1}`}
            </span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={`h-full transition-[width,background-color] ${total > 100 ? 'bg-destructive' : 'bg-sky-500'}`}
            style={{ width: `${Math.min(total, 100)}%` }}
          />
        </div>
        <span
          className={`min-w-12 text-right text-sm font-medium ${total > 100 ? 'text-destructive' : ''}`}
        >
          {total}%
        </span>
      </div>
      {total !== 100 ? (
        <p className="text-xs text-destructive">
          Percentages must add up to 100%.
        </p>
      ) : null}
    </div>
  )
}
