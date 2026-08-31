import { CirclePlus, Trash2 } from 'lucide-react'

import { FieldError } from '#/components/form'
import { Button } from '#/components/ui/button'

import { useFeatureFlagFormContext } from '../hooks/use-feature-flag-form-context'

export function VariationsSection() {
  const form = useFeatureFlagFormContext()
  return (
    <form.Field name="variations" mode="array">
      {(arrayField) => (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Variations</h3>
              <p className="text-xs text-muted-foreground">
                Values returned when this flag is evaluated.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                arrayField.pushValue({
                  name: `variation-${arrayField.state.value.length + 1}`,
                  value: '',
                })
              }
            >
              <CirclePlus /> Add variation
            </Button>
          </div>
          <div className="space-y-3">
            {arrayField.state.value.map((_, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-xl border border-border bg-muted/30 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-start"
              >
                <form.AppField name={`variations[${index}].name`}>
                  {(field) => (
                    <label>
                      <field.TextField label="Name" />
                    </label>
                  )}
                </form.AppField>
                <form.AppField name={`variations[${index}].value`}>
                  {(field) => (
                    <label>
                      <field.TextField label="Flag Value" />
                    </label>
                  )}
                </form.AppField>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive sm:mt-6"
                  disabled={arrayField.state.value.length <= 2}
                  onClick={() => arrayField.removeValue(index)}
                  aria-label={`Remove variation ${index + 1}`}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
          <FieldError errors={arrayField.state.meta.errors} />
        </section>
      )}
    </form.Field>
  )
}
