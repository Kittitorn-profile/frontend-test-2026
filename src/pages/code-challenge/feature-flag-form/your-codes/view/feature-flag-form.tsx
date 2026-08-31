import { useCallback, useEffect, useRef, useState } from 'react'
import { Flag, Plus, RotateCcw, Save } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { DeleteIconButton } from '#/components/ui/delete-icon-button'
import { useAppForm } from '#/components/form'

import type { FeatureFlagFormValues, TargetingRule } from '../schema'
import {
  defaultValues,
  featureFlagSchema,
  toFeatureFlagOutput,
} from '../schema'
import { JsonPreview } from './json-preview'
import { MetadataSection } from '../component/metadata-section'
import { VariationsSection } from '../component/variations-section'
import { TargetingSection } from '../component/targeting-section'
import { DefaultRuleSection } from '../component/default-rule-section'
import { MetadataEntriesSection } from '../component/metadata-entries-section'
import '../styles/feature-flag-form.css'

type FeatureFlagFormState = Omit<FeatureFlagFormValues, 'targeting'> & {
  targeting: Array<
    Omit<TargetingRule, 'conditions'> & {
      conditions: unknown
    }
  >
}

function validateFeatureFlag({ value }: { value: FeatureFlagFormState }) {
  const result = featureFlagSchema.safeParse(value)
  return result.success ? undefined : result.error
}

const createNewFlag = (key: string): FeatureFlagFormState => ({
  ...structuredClone(defaultValues),
  key,
  description: '',
  variations: [
    { name: 'Variation_1', value: 'true' },
    { name: 'Variation_2', value: 'false' },
  ],
  targeting: [],
  defaultServeMode: 'variation',
  defaultRolloutPercentages: [50, 50],
  defaultProgressiveRollout: {
    ...structuredClone(defaultValues.defaultProgressiveRollout),
    startVariation: 'Variation_1',
    endVariation: 'Variation_1',
  },
  defaultVariation: 'Variation_1',
})

function useFeatureFlagForm(
  initialValues: FeatureFlagFormState,
  onSubmitValues: (value: FeatureFlagFormValues) => void = () => undefined,
) {
  return useAppForm({
    defaultValues: initialValues,
    validators: {
      onChange: validateFeatureFlag,
      onSubmit: validateFeatureFlag,
    },
    onSubmit: ({ value }) => {
      onSubmitValues(featureFlagSchema.parse(value) as FeatureFlagFormValues)
    },
  })
}

export type FeatureFlagFormApi = ReturnType<typeof useFeatureFlagForm>

type FlagEditorEntry = {
  id: number
  initialValues: FeatureFlagFormState
  values: FeatureFlagFormState
}

function FlagValueObserver({
  id,
  values,
  onChange,
}: {
  id: number
  values: FeatureFlagFormState
  onChange: (id: number, values: FeatureFlagFormState) => void
}) {
  useEffect(() => onChange(id, values), [id, onChange, values])
  return null
}

function FlagEditor({
  entry,
  index,
  canRemove,
  onChange,
  onFormReady,
  onRemove,
}: {
  entry: FlagEditorEntry
  index: number
  canRemove: boolean
  onChange: (id: number, values: FeatureFlagFormState) => void
  onFormReady: (id: number, form: FeatureFlagFormApi | null) => void
  onRemove: (id: number) => void
}) {
  const [initialValues] = useState(() =>
    structuredClone(entry.initialValues),
  )
  const form = useFeatureFlagForm(initialValues)

  useEffect(() => {
    onFormReady(entry.id, form)
    return () => onFormReady(entry.id, null)
  }, [entry.id, form, onFormReady])

  return (
    <section className="flagCard" data-disabled={entry.values.disable}>
      <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
        <h3 className="font-semibold">Flag {index + 1}</h3>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            <RotateCcw /> Reset
          </Button>
          {canRemove ? (
            <DeleteIconButton
              onClick={() => onRemove(entry.id)}
              aria-label={`Remove flag ${index + 1}`}
            />
          ) : null}
        </div>
      </div>

      <form.AppForm>
        <div className="space-y-5">
          <MetadataSection />
          <VariationsSection />
          <TargetingSection />
          <DefaultRuleSection />
          <MetadataEntriesSection />

          <form.Subscribe selector={(state) => state.values}>
            {(values) => (
              <FlagValueObserver
                id={entry.id}
                values={values}
                onChange={onChange}
              />
            )}
          </form.Subscribe>

        </div>
      </form.AppForm>
    </section>
  )
}

export function FeatureFlagForm() {
  const nextId = useRef(1)
  const formApis = useRef(new Map<number, FeatureFlagFormApi>())
  const [flags, setFlags] = useState<FlagEditorEntry[]>(() => {
    const values = structuredClone(defaultValues as FeatureFlagFormState)
    return [{ id: 0, initialValues: values, values }]
  })

  const updateFlag = useCallback(
    (id: number, values: FeatureFlagFormState) => {
      setFlags((current) =>
        current.map((flag) =>
          flag.id === id && flag.values !== values
            ? { ...flag, values }
            : flag,
        ),
      )
    },
    [],
  )

  const addFlag = () => {
    const usedKeys = new Set(flags.map((flag) => flag.values.key))
    let nextNumber = 1
    while (usedKeys.has(`new-flag-${nextNumber}`)) nextNumber += 1

    const values = createNewFlag(`new-flag-${nextNumber}`)
    setFlags((current) => [
      ...current,
      { id: nextId.current++, initialValues: values, values },
    ])
  }

  const removeFlag = useCallback((id: number) => {
    setFlags((current) => current.filter((flag) => flag.id !== id))
  }, [])

  const registerForm = useCallback(
    (id: number, form: FeatureFlagFormApi | null) => {
      if (form) formApis.current.set(id, form)
      else formApis.current.delete(id)
    },
    [],
  )

  const preview = Object.assign(
    {},
    ...flags.map((flag) =>
      toFeatureFlagOutput(flag.values as FeatureFlagFormValues),
    ),
  )

  const saveAllFlags = async () => {
    const hasInvalidFlag = flags.some(
      (flag) => !featureFlagSchema.safeParse(flag.values).success,
    )

    if (hasInvalidFlag) {
      await Promise.all(
        Array.from(formApis.current.values()).map((form) =>
          form.handleSubmit(),
        ),
      )
      return
    }

    console.info('Feature flags saved >>>', preview)
  }

  return (
    <section className="rounded-3xl border border-border bg-muted/30 p-4 sm:p-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
            <Flag className="size-4" /> FEATURE FLAG BUILDER
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Configure your rollout
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Define variations and target the right audience without editing
            JSON.
          </p>
        </div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
        <div className="space-y-6">
          {flags.map((entry, index) => (
            <FlagEditor
              key={entry.id}
              entry={entry}
              index={index}
              canRemove={flags.length > 1}
              onChange={updateFlag}
              onFormReady={registerForm}
              onRemove={removeFlag}
            />
          ))}

          <Button type="button" variant="outline" onClick={addFlag}>
            <Plus /> Add another flag
          </Button>

          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={() => void saveAllFlags()}
          >
            <Save /> Save all flags
          </Button>
        </div>

        <JsonPreview value={preview} />
      </div>
    </section>
  )
}
