import { FieldError } from '#/components/form'

import {
  PercentageRolloutEditor,
  ProgressiveRolloutEditor,
} from './rollout-editors'
import {
  createServeOptions,
  getServeSelectValue,
  parseServeSelectValue,
} from './serve-options'
import { useFeatureFlagFormContext } from '../hooks/use-feature-flag-form-context'

const labelClass = 'mb-1.5 block text-sm font-medium text-foreground'

export function DefaultRuleSection() {
  const form = useFeatureFlagFormContext()
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <form.AppField name="defaultVariation">
        {(field) => (
          <label>
            <span className={labelClass}>Default variation</span>
            <p className="mb-3 text-xs text-muted-foreground">
              Used when no targeting rule matches.
            </p>
            <form.Subscribe
              selector={(state) => ({
                variations: state.values.variations,
                serveMode: state.values.defaultServeMode,
                percentages: state.values.defaultRolloutPercentages,
                progressiveRollout: state.values.defaultProgressiveRollout,
              })}
            >
              {({ variations, serveMode, percentages, progressiveRollout }) => (
                <>
                  <field.SelectField
                    label="Default variation"
                    value={getServeSelectValue(
                      serveMode,
                      field.state.value,
                    )}
                    options={createServeOptions(variations)}
                    onValueChange={(value) => {
                      const selected = parseServeSelectValue(String(value))
                      if (!selected) return

                      form.setFieldValue('defaultServeMode', selected.mode)
                      if (selected.mode === 'variation') {
                        field.handleChange(selected.variation)
                      }
                    }}
                  />
                  {serveMode === 'percentage' ? (
                    <PercentageRolloutEditor
                      variations={variations}
                      percentages={percentages}
                      onChange={(nextPercentages) =>
                        form.setFieldValue(
                          'defaultRolloutPercentages',
                          nextPercentages,
                        )
                      }
                    />
                  ) : null}
                  {serveMode === 'progressive' ? (
                    <ProgressiveRolloutEditor
                      variations={variations}
                      value={progressiveRollout}
                      onChange={(nextProgressiveRollout) =>
                        form.setFieldValue(
                          'defaultProgressiveRollout',
                          nextProgressiveRollout,
                        )
                      }
                    />
                  ) : null}
                </>
              )}
            </form.Subscribe>
            <FieldError errors={field.state.meta.errors} />
          </label>
        )}
      </form.AppField>
    </section>
  )
}
