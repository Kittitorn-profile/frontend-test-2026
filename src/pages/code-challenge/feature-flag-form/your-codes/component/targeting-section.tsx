import { Braces, Plus } from 'lucide-react'

import { FieldError } from '#/components/form'
import { Button } from '#/components/ui/button'
import { DeleteIconButton } from '#/components/ui/delete-icon-button'

import type {
  ConditionGroup,
  ProgressiveRollout,
  TargetingRule,
} from '../schema'
import {
  PercentageRolloutEditor,
  ProgressiveRolloutEditor,
} from './rollout-editors'
import { RuleBuilder } from './rule-builder'
import {
  createServeOptions,
  getServeSelectValue,
  parseServeSelectValue,
} from './serve-options'
import { useFeatureFlagFormContext } from '../hooks/use-feature-flag-form-context'

const labelClass = 'mb-1.5 block text-sm font-medium text-foreground'

function createRootGroup(): ConditionGroup {
  const id = globalThis.crypto.randomUUID()
  return {
    id,
    type: 'group',
    combinator: 'AND',
    children: [
      {
        id: `${id}-condition`,
        type: 'condition',
        attribute: 'custom',
        customAttribute: '',
        operator: 'equals',
        value: '',
      },
    ],
  }
}

function toDateTimeInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function createProgressiveRollout(variation: string): ProgressiveRollout {
  const startDate = new Date()
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 10)
  return {
    startDate: toDateTimeInputValue(startDate),
    endDate: toDateTimeInputValue(endDate),
    startVariation: variation,
    endVariation: variation,
    startPercentage: 0,
    endPercentage: 100,
  }
}

export function TargetingSection() {
  const form = useFeatureFlagFormContext()
  return (
    <form.Field name="targeting" mode="array">
      {(arrayField) => (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold tracking-tight">
                Target specific users
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Build rule groups with AND/OR and serve a matching variation.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const firstVariation = form.getFieldValue('variations[0].name')
                arrayField.pushValue({
                  name: `Rule ${arrayField.state.value.length + 1}`,
                  conditions: createRootGroup(),
                  serveMode: 'variation',
                  percentage: 100,
                  rolloutPercentages: form
                    .getFieldValue('variations')
                    .map((_, variationIndex) =>
                      variationIndex === 0 ? 100 : 0,
                    ),
                  progressiveRollout: createProgressiveRollout(firstVariation),
                  variation: firstVariation,
                })
              }}
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
            <div className="space-y-4">
              {(arrayField.state.value as TargetingRule[]).map(
                (rule, index) => (
                  <article
                    key={rule.conditions.id}
                    className="rounded-xl border border-teal-400/70 bg-background p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <form.AppField name={`targeting[${index}].name`}>
                        {(field) => (
                          <div className="w-full max-w-sm">
                            <field.TextField
                              label="Rule name"
                              placeholder={`Rule ${index + 1}`}
                            />
                          </div>
                        )}
                      </form.AppField>
                      <DeleteIconButton
                        className="mt-2"
                        onClick={() => arrayField.removeValue(index)}
                        aria-label={`Remove targeting rule ${index + 1}`}
                      />
                    </div>

                    <form.Subscribe
                      selector={(state) => state.submissionAttempts > 0}
                    >
                      {(showErrors) => (
                        <RuleBuilder
                          value={rule.conditions}
                          showErrors={showErrors}
                          onChange={(conditions) => {
                            const targeting = [
                              ...(arrayField.state.value as TargetingRule[]),
                            ]
                            targeting[index] = { ...rule, conditions }
                            arrayField.handleChange(targeting)
                          }}
                        />
                      )}
                    </form.Subscribe>

                    <div className="mt-4 border-t border-border pt-4">
                      <form.AppField name={`targeting[${index}].variation`}>
                        {(field) => (
                          <label>
                            <span className={labelClass}>Serve</span>
                            <form.Subscribe
                              selector={(state) => ({
                                variations: state.values.variations,
                                serveMode:
                                  state.values.targeting[index].serveMode,
                              })}
                            >
                              {({ variations, serveMode }) => (
                                <field.SelectField
                                  label="Serve"
                                  value={getServeSelectValue(
                                    serveMode,
                                    field.state.value,
                                  )}
                                  options={createServeOptions(variations)}
                                  onValueChange={(value) => {
                                    const selected = parseServeSelectValue(
                                      String(value),
                                    )
                                    if (!selected) return

                                    form.setFieldValue(
                                      `targeting[${index}].serveMode`,
                                      selected.mode,
                                    )
                                    if (selected.mode === 'variation') {
                                      field.handleChange(selected.variation)
                                    }
                                  }}
                                />
                              )}
                            </form.Subscribe>
                            <FieldError errors={field.state.meta.errors} />
                          </label>
                        )}
                      </form.AppField>
                      <form.Subscribe
                        selector={(state) => ({
                          variations: state.values.variations,
                          currentRule: state.values.targeting[index],
                          showErrors: state.submissionAttempts > 0,
                        })}
                      >
                        {({ variations, currentRule, showErrors }) => (
                          <>
                            {currentRule.serveMode === 'percentage' ? (
                              <PercentageRolloutEditor
                                variations={variations}
                                percentages={currentRule.rolloutPercentages}
                                showErrors={showErrors}
                                onChange={(rolloutPercentages) => {
                                  const targeting = [
                                    ...form.getFieldValue('targeting'),
                                  ]
                                  targeting[index] = {
                                    ...currentRule,
                                    rolloutPercentages,
                                  }
                                  arrayField.handleChange(targeting)
                                }}
                              />
                            ) : null}
                            {currentRule.serveMode === 'progressive' ? (
                              <ProgressiveRolloutEditor
                                variations={variations}
                                value={currentRule.progressiveRollout}
                                showErrors={showErrors}
                                onChange={(progressiveRollout) => {
                                  const targeting = [
                                    ...form.getFieldValue('targeting'),
                                  ]
                                  targeting[index] = {
                                    ...currentRule,
                                    progressiveRollout,
                                  }
                                  arrayField.handleChange(targeting)
                                }}
                              />
                            ) : null}
                          </>
                        )}
                      </form.Subscribe>
                    </div>
                    <FieldError errors={arrayField.state.meta.errors} />
                  </article>
                ),
              )}
            </div>
          )}
        </section>
      )}
    </form.Field>
  )
}
