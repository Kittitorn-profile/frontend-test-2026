import type { FormEventHandler } from 'react'
import { Flag, RotateCcw, Save } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { useAppForm } from '#/components/form'

import type { FeatureFlagFormValues } from '../schema'
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

type FeatureFlagFormState = Omit<FeatureFlagFormValues, 'targeting'> & {
  targeting: Array<{
    name: string
    conditions: unknown
    percentage: number
    variation: string
  }>
}

function validateFeatureFlag({ value }: { value: FeatureFlagFormState }) {
  const result = featureFlagSchema.safeParse(value)
  return result.success ? undefined : result.error
}

// Call API
async function submitFeatureFlag({ value }: { value: FeatureFlagFormState }) {
  const validatedValues = featureFlagSchema.parse(
    value,
  ) as FeatureFlagFormValues
  const payload = toFeatureFlagOutput(validatedValues)

  console.info('Feature flag saved >>>', payload)
}

function useFeatureFlagForm() {
  return useAppForm({
    defaultValues: defaultValues as FeatureFlagFormState,
    validators: {
      onChange: validateFeatureFlag,
      onSubmit: validateFeatureFlag,
    },
    onSubmit: submitFeatureFlag,
  })
}

export type FeatureFlagFormApi = ReturnType<typeof useFeatureFlagForm>

export function FeatureFlagForm() {
  const form = useFeatureFlagForm()

  const onSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    event.stopPropagation()
    void form.handleSubmit()
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
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          <RotateCcw /> Reset example
        </Button>
      </header>

      <form
        onSubmit={onSubmit}
        className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]"
      >
        <form.AppForm>
          <div className="space-y-5">
            <MetadataSection />
            <VariationsSection />
            <TargetingSection />
            <DefaultRuleSection />

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={!canSubmit || isSubmitting}
                >
                  <Save /> {isSubmitting ? 'Saving…' : 'Save'}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form.AppForm>

        <form.Subscribe selector={(state) => state.values}>
          {(values) => (
            <JsonPreview
              value={toFeatureFlagOutput(values as FeatureFlagFormValues)}
            />
          )}
        </form.Subscribe>
      </form>
    </section>
  )
}
