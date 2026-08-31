import { Flag } from 'lucide-react'

import { SectionTitle } from './section-title'
import { useFeatureFlagFormContext } from '../hooks/use-feature-flag-form-context'

export function MetadataSection() {
  const form = useFeatureFlagFormContext()

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <SectionTitle
        icon={<Flag className="size-5" />}
        title="Flag metadata"
        description="Identify the flag and control its global status."
      />
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <form.AppField name="key">
          {(field) => (
            <label>
              <field.TextField label="Flag key" placeholder="new-checkout" />
            </label>
          )}
        </form.AppField>
        <form.AppField name="enabled">
          {(field) => (
            <label className="flex min-w-32 cursor-pointer items-center justify-between gap-3 rounded-xl border border-border px-4 py-2.5 sm:mt-6">
              <field.CheckboxField label="Enabled" />
            </label>
          )}
        </form.AppField>
      </div>
      <form.AppField name="description">
        {(field) => (
          <label className="mt-4 block">
            <field.TextField
              label="Description"
              placeholder="What does this flag control?"
              trailingText={`${field.state.value.length}/160`}
            />
          </label>
        )}
      </form.AppField>
    </section>
  )
}
