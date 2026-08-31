import { useForm } from '@tanstack/react-form'
import {
  Braces,
  CirclePlus,
  Flag,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'

import { JsonPreview } from './json-preview'
import { defaultValues, featureFlagSchema, toFeatureFlagOutput } from './schema'

const labelClass = 'mb-1.5 block text-sm font-medium text-foreground'
const selectClass =
  'h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

function FieldError({ errors }: { errors: unknown[] }) {
  if (errors.length === 0) return null
  return (
    <p className="mt-1 text-xs text-destructive" role="alert">
      {errors
        .map((error) =>
          typeof error === 'string'
            ? error
            : ((error as { message?: string }).message ?? 'Invalid value'),
        )
        .join(', ')}
    </p>
  )
}

function YourCode() {
  const form = useForm({
    defaultValues,
    validators: { onChange: featureFlagSchema, onSubmit: featureFlagSchema },
    onSubmit: ({ value }) =>
      console.info('Feature flag saved', toFeatureFlagOutput(value)),
  })

  return (
    <section className="rounded-3xl border border-border bg-muted/30 p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void form.handleSubmit()
        }}
        className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]"
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <SectionTitle
              icon={<Flag className="size-5" />}
              title="Flag metadata"
              description="Identify the flag and control its global status."
            />
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <form.Field name="key">
                {(field) => (
                  <label>
                    <span className={labelClass}>Flag key</span>
                    <Input
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      onBlur={field.handleBlur}
                      aria-invalid={field.state.meta.errors.length > 0}
                      placeholder="new-checkout"
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </label>
                )}
              </form.Field>
              <form.Field name="enabled">
                {(field) => (
                  <label className="flex min-w-32 cursor-pointer items-center justify-between gap-3 rounded-xl border border-border px-4 py-2.5 sm:mt-6">
                    <span className="text-sm font-medium">Enabled</span>
                    <input
                      type="checkbox"
                      checked={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.checked)
                      }
                      className="size-4 accent-blue-600"
                    />
                  </label>
                )}
              </form.Field>
            </div>
            <form.Field name="description">
              {(field) => (
                <label className="mt-4 block">
                  <span className={labelClass}>Description</span>
                  <Input
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    aria-invalid={field.state.meta.errors.length > 0}
                    placeholder="What does this flag control?"
                  />
                  <div className="flex justify-between">
                    <FieldError errors={field.state.meta.errors} />
                    <span className="ml-auto mt-1 text-xs text-muted-foreground">
                      {field.state.value.length}/160
                    </span>
                  </div>
                </label>
              )}
            </form.Field>
          </div>

          <form.Field name="variations" mode="array">
            {(arrayField) => (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
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
                        value: false,
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
                      className="grid gap-3 rounded-xl border border-border bg-muted/30 p-3 sm:grid-cols-[1fr_150px_auto] sm:items-start"
                    >
                      <form.Field name={`variations[${index}].name`}>
                        {(field) => (
                          <label>
                            <span className={labelClass}>Name</span>
                            <Input
                              value={field.state.value}
                              onChange={(event) =>
                                field.handleChange(event.target.value)
                              }
                              onBlur={field.handleBlur}
                              aria-invalid={field.state.meta.errors.length > 0}
                            />
                            <FieldError errors={field.state.meta.errors} />
                          </label>
                        )}
                      </form.Field>
                      <form.Field name={`variations[${index}].value`}>
                        {(field) => (
                          <label>
                            <span className={labelClass}>Value</span>
                            <select
                              className={selectClass}
                              value={String(field.state.value)}
                              onChange={(event) =>
                                field.handleChange(
                                  event.target.value === 'true',
                                )
                              }
                            >
                              <option value="true">true</option>
                              <option value="false">false</option>
                            </select>
                          </label>
                        )}
                      </form.Field>
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
              </div>
            )}
          </form.Field>

          <form.Field name="targeting" mode="array">
            {(arrayField) => (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Targeting rules</h3>
                    <p className="text-xs text-muted-foreground">
                      Rules are evaluated from top to bottom.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      arrayField.pushValue({
                        attribute: 'group',
                        operator: 'equals',
                        value: '',
                        percentage: 100,
                        variation: form.getFieldValue('variations[0].name'),
                      })
                    }
                  >
                    <Plus /> Add rule
                  </Button>
                </div>
                {arrayField.state.value.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center">
                    <Braces className="mx-auto mb-2 size-6 text-muted-foreground" />
                    <p className="text-sm font-medium">No targeting rules</p>
                    <p className="text-xs text-muted-foreground">
                      All users will receive the default variation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {arrayField.state.value.map((_, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-border bg-muted/30 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="rounded-md bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-600">
                            RULE {index + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => arrayField.removeValue(index)}
                            aria-label={`Remove targeting rule ${index + 1}`}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                        <div className="grid gap-3 md:grid-cols-3">
                          <form.Field name={`targeting[${index}].attribute`}>
                            {(field) => (
                              <label>
                                <span className={labelClass}>Attribute</span>
                                <Input
                                  value={field.state.value}
                                  onChange={(event) =>
                                    field.handleChange(event.target.value)
                                  }
                                  onBlur={field.handleBlur}
                                  aria-invalid={
                                    field.state.meta.errors.length > 0
                                  }
                                  placeholder="group"
                                />
                                <FieldError errors={field.state.meta.errors} />
                              </label>
                            )}
                          </form.Field>
                          <form.Field name={`targeting[${index}].operator`}>
                            {(field) => (
                              <label>
                                <span className={labelClass}>Operator</span>
                                <select
                                  className={selectClass}
                                  value={field.state.value}
                                  onChange={(event) =>
                                    field.handleChange(
                                      event.target
                                        .value as typeof field.state.value,
                                    )
                                  }
                                >
                                  <option value="equals">equals</option>
                                  <option value="not_equals">not equals</option>
                                  <option value="contains">contains</option>
                                  <option value="starts_with">
                                    starts with
                                  </option>
                                </select>
                              </label>
                            )}
                          </form.Field>
                          <form.Field name={`targeting[${index}].value`}>
                            {(field) => (
                              <label>
                                <span className={labelClass}>Target value</span>
                                <Input
                                  value={field.state.value}
                                  onChange={(event) =>
                                    field.handleChange(event.target.value)
                                  }
                                  onBlur={field.handleBlur}
                                  aria-invalid={
                                    field.state.meta.errors.length > 0
                                  }
                                  placeholder="beta"
                                />
                                <FieldError errors={field.state.meta.errors} />
                              </label>
                            )}
                          </form.Field>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <form.Field name={`targeting[${index}].percentage`}>
                            {(field) => (
                              <label>
                                <span className={labelClass}>
                                  Rollout: {field.state.value}%
                                </span>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={field.state.value}
                                  onChange={(event) =>
                                    field.handleChange(
                                      event.target.valueAsNumber,
                                    )
                                  }
                                  className="h-9 w-full accent-blue-600"
                                />
                              </label>
                            )}
                          </form.Field>
                          <form.Field name={`targeting[${index}].variation`}>
                            {(field) => (
                              <label>
                                <span className={labelClass}>
                                  Serve variation
                                </span>
                                <form.Subscribe
                                  selector={(state) => state.values.variations}
                                >
                                  {(variations) => (
                                    <VariationSelect
                                      variations={variations}
                                      value={field.state.value}
                                      onChange={field.handleChange}
                                    />
                                  )}
                                </form.Subscribe>
                                <FieldError errors={field.state.meta.errors} />
                              </label>
                            )}
                          </form.Field>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </form.Field>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <form.Field name="defaultVariation">
              {(field) => (
                <label>
                  <span className={labelClass}>Default variation</span>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Used when no targeting rule matches.
                  </p>
                  <form.Subscribe selector={(state) => state.values.variations}>
                    {(variations) => (
                      <VariationSelect
                        variations={variations}
                        value={field.state.value}
                        onChange={field.handleChange}
                      />
                    )}
                  </form.Subscribe>
                  <FieldError errors={field.state.meta.errors} />
                </label>
              )}
            </form.Field>
          </div>

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
                <Save /> {isSubmitting ? 'Saving…' : 'Save feature flag'}
              </Button>
            )}
          </form.Subscribe>
        </div>
        <form.Subscribe selector={(state) => state.values}>
          {(values) => <JsonPreview value={toFeatureFlagOutput(values)} />}
        </form.Subscribe>
      </form>
    </section>
  )
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600">{icon}</div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function VariationSelect({
  variations,
  value,
  onChange,
}: {
  variations: Array<{ name: string; value: boolean }>
  value: string
  onChange: (value: string) => void
}) {
  return (
    <select
      className={selectClass}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {variations.map((variation, index) => (
        <option key={`${variation.name}-${index}`} value={variation.name}>
          {variation.name || `Variation ${index + 1}`}
        </option>
      ))}
    </select>
  )
}

export default YourCode
