import { CirclePlus } from 'lucide-react'

import { FieldError } from '#/components/form'
import { Button } from '#/components/ui/button'
import { DeleteIconButton } from '#/components/ui/delete-icon-button'

import { useFeatureFlagFormContext } from '../hooks/use-feature-flag-form-context'

export function MetadataEntriesSection() {
  const form = useFeatureFlagFormContext()

  return (
    <form.Field name="metadata" mode="array">
      {(arrayField) => (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-xl font-bold tracking-tight">Metadata</h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => arrayField.pushValue({ key: '', value: '' })}
            >
              <CirclePlus /> Add metadata
            </Button>
          </div>

          <div className="space-y-3">
            {arrayField.state.value.map((_, index) => (
              <div
                key={index}
                className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-start"
              >
                <form.AppField name={`metadata[${index}].key`}>
                  {(field) => (
                    <field.TextField label="Key" placeholder="team" />
                  )}
                </form.AppField>
                <form.AppField name={`metadata[${index}].value`}>
                  {(field) => (
                    <field.TextField label="Value" placeholder="checkout" />
                  )}
                </form.AppField>
                <DeleteIconButton
                  className="sm:mt-2"
                  onClick={() => arrayField.removeValue(index)}
                  aria-label={`Remove metadata ${index + 1}`}
                />
              </div>
            ))}
          </div>

          <FieldError errors={arrayField.state.meta.errors} />
        </section>
      )}
    </form.Field>
  )
}
