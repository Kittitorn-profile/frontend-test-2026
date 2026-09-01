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
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
        <form.AppField name="key">
          {(field) => (
            <field.TextField label="Flag Name" placeholder="new-checkout" />
          )}
        </form.AppField>
        <form.AppField name="disable">
          {(field) => (
            <div className="flex min-w-36 items-center justify-between rounded-xl border border-border px-4 py-3 lg:mt-1">
              <field.SwitchField label="Disable" />
            </div>
          )}
        </form.AppField>
        <form.AppField name="trackEvents">
          {(field) => (
            <div className="flex min-w-40 items-center justify-between rounded-xl border border-border px-4 py-3 lg:mt-1">
              <field.SwitchField label="Track event" />
            </div>
          )}
        </form.AppField>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <form.AppField name="flagType">
          {(field) => (
            <field.SelectField
              label="Flag type"
              options={[
                { value: 'boolean', label: '☑ boolean' },
                { value: 'string', label: '🔤 string' },
                { value: 'number', label: '🔢 number' },
                { value: 'json', label: '▣ JSON' },
              ]}
            />
          )}
        </form.AppField>
        <form.AppField name="version">
          {(field) => (
            <field.TextField label="Version" placeholder="1.0.0" />
          )}
        </form.AppField>
      </div>
      <form.AppField name="description">
        {(field) => (
          <div className="mt-4">
            <field.TextField
              label="Description"
              placeholder="What does this flag control?"
              trailingText={`${field.state.value.length}/160`}
            />
          </div>
        )}
      </form.AppField>
    </section>
  )
}
