import { z } from 'zod'

export const variationSchema = z.object({
  name: z.string().trim().min(1, 'Variation name is required'),
  value: z.string().trim().min(1, 'Flag value is required'),
})

export type ConditionAttribute =
  | 'group'
  | 'role'
  | 'email'
  | 'country'
  | 'custom'
export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'less_than'
  | 'greater_than'
  | 'less_than_or_equal'
  | 'greater_than_or_equal'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'in_list'
  | 'present'
  | 'not'

export type ConditionNode = {
  id: string
  type: 'condition'
  attribute: ConditionAttribute
  customAttribute: string
  operator: ConditionOperator
  value: string
}

export type ConditionGroup = {
  id: string
  type: 'group'
  combinator: 'AND' | 'OR'
  children: RuleNode[]
}

export type RuleNode = ConditionNode | ConditionGroup

export const conditionSchema: z.ZodType<ConditionNode> = z
  .object({
    id: z.string().min(1),
    type: z.literal('condition'),
    attribute: z.enum(['group', 'role', 'email', 'country', 'custom']),
    customAttribute: z.string(),
    operator: z.enum([
      'equals',
      'not_equals',
      'less_than',
      'greater_than',
      'less_than_or_equal',
      'greater_than_or_equal',
      'contains',
      'starts_with',
      'ends_with',
      'in_list',
      'present',
      'not',
    ]),
    value: z.string(),
  })
  .superRefine((condition, context) => {
    if (condition.attribute === 'custom' && !condition.customAttribute.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['customAttribute'],
        message: 'Custom attribute is required',
      })
    }
    if (
      condition.operator !== 'present' &&
      condition.operator !== 'not' &&
      !condition.value.trim()
    ) {
      context.addIssue({
        code: 'custom',
        path: ['value'],
        message: 'Target value is required',
      })
    }
  })

export const ruleNodeSchema: z.ZodType<RuleNode> = z.lazy(() =>
  z.union([conditionSchema, conditionGroupSchema]),
)

export const conditionGroupSchema: z.ZodType<ConditionGroup> = z.object({
  id: z.string().min(1),
  type: z.literal('group'),
  combinator: z.enum(['AND', 'OR']),
  children: z.array(ruleNodeSchema).min(1, 'Add at least one condition'),
})

export const targetingRuleSchema = z.object({
  name: z.string().trim().min(1, 'Rule name is required'),
  conditions: conditionGroupSchema,
  serveMode: z.enum(['variation', 'percentage', 'progressive']),
  percentage: z.number().min(0).max(100),
  rolloutPercentages: z.array(z.number().min(0).max(100)),
  progressiveRollout: z.object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    startVariation: z.string().min(1, 'Select a start variation'),
    endVariation: z.string().min(1, 'Select an end variation'),
    startPercentage: z.number().min(0).max(100),
    endPercentage: z.number().min(0).max(100),
  }),
  variation: z.string().trim().min(1, 'Select a variation'),
})

export type ProgressiveRollout = {
  startDate: string
  endDate: string
  startVariation: string
  endVariation: string
  startPercentage: number
  endPercentage: number
}

export type TargetingRule = {
  name: string
  conditions: ConditionGroup
  serveMode: 'variation' | 'percentage' | 'progressive'
  percentage: number
  rolloutPercentages: number[]
  progressiveRollout: ProgressiveRollout
  variation: string
}

export const featureFlagSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(1, 'Flag key is required')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Use lowercase letters, numbers, and hyphens only',
      ),
    description: z.string().trim().max(160, 'Maximum 160 characters'),
    enabled: z.boolean(),
    variations: z.array(variationSchema).min(2, 'Add at least 2 variations'),
    targeting: z.array(targetingRuleSchema),
    defaultServeMode: z.enum(['variation', 'percentage', 'progressive']),
    defaultRolloutPercentages: z.array(z.number().min(0).max(100)),
    defaultProgressiveRollout: targetingRuleSchema.shape.progressiveRollout,
    defaultVariation: z.string().trim().min(1, 'Select a default variation'),
  })
  .superRefine((data, context) => {
    const names = data.variations.map((variation) => variation.name)
    const duplicateName = names.find(
      (name, index) => names.indexOf(name) !== index,
    )

    if (duplicateName) {
      context.addIssue({
        code: 'custom',
        path: ['variations'],
        message: `Variation name “${duplicateName}” must be unique`,
      })
    }

    if (!names.includes(data.defaultVariation)) {
      context.addIssue({
        code: 'custom',
        path: ['defaultVariation'],
        message: 'Default variation must match an existing variation',
      })
    }
    if (
      data.defaultServeMode === 'percentage' &&
      data.defaultRolloutPercentages
        .slice(0, names.length)
        .reduce((sum, value) => sum + value, 0) !== 100
    ) {
      context.addIssue({
        code: 'custom',
        path: ['defaultRolloutPercentages'],
        message: 'Rollout percentages must add up to 100%',
      })
    }
    if (data.defaultServeMode === 'progressive') {
      if (!names.includes(data.defaultProgressiveRollout.startVariation)) {
        context.addIssue({
          code: 'custom',
          path: ['defaultProgressiveRollout', 'startVariation'],
          message: 'Select an existing variation',
        })
      }
      if (!names.includes(data.defaultProgressiveRollout.endVariation)) {
        context.addIssue({
          code: 'custom',
          path: ['defaultProgressiveRollout', 'endVariation'],
          message: 'Select an existing variation',
        })
      }
      if (
        new Date(data.defaultProgressiveRollout.endDate) <=
        new Date(data.defaultProgressiveRollout.startDate)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['defaultProgressiveRollout', 'endDate'],
          message: 'End date must be after start date',
        })
      }
    }

    data.targeting.forEach((rule, index) => {
      if (!names.includes(rule.variation)) {
        context.addIssue({
          code: 'custom',
          path: ['targeting', index, 'variation'],
          message: 'Select an existing variation',
        })
      }
      if (
        rule.serveMode === 'percentage' &&
        rule.rolloutPercentages
          .slice(0, names.length)
          .reduce((sum, value) => sum + value, 0) !== 100
      ) {
        context.addIssue({
          code: 'custom',
          path: ['targeting', index, 'rolloutPercentages'],
          message: 'Rollout percentages must add up to 100%',
        })
      }
      if (rule.serveMode === 'progressive') {
        if (!names.includes(rule.progressiveRollout.startVariation)) {
          context.addIssue({
            code: 'custom',
            path: ['targeting', index, 'progressiveRollout', 'startVariation'],
            message: 'Select an existing variation',
          })
        }
        if (!names.includes(rule.progressiveRollout.endVariation)) {
          context.addIssue({
            code: 'custom',
            path: ['targeting', index, 'progressiveRollout', 'endVariation'],
            message: 'Select an existing variation',
          })
        }
        if (
          new Date(rule.progressiveRollout.endDate) <=
          new Date(rule.progressiveRollout.startDate)
        ) {
          context.addIssue({
            code: 'custom',
            path: ['targeting', index, 'progressiveRollout', 'endDate'],
            message: 'End date must be after start date',
          })
        }
      }
    })
  })

export type FeatureFlagFormValues = {
  key: string
  description: string
  enabled: boolean
  variations: Array<{ name: string; value: string }>
  targeting: TargetingRule[]
  defaultServeMode: 'variation' | 'percentage' | 'progressive'
  defaultRolloutPercentages: number[]
  defaultProgressiveRollout: ProgressiveRollout
  defaultVariation: string
}

export const defaultValues: FeatureFlagFormValues = {
  key: 'my-new-feature',
  description: 'Gradually release the redesigned experience',
  enabled: true,
  variations: [
    { name: 'on', value: 'true' },
    { name: 'off', value: 'false' },
  ],
  targeting: [
    {
      name: 'Rule 1',
      conditions: {
        id: 'root-group-1',
        type: 'group',
        combinator: 'AND',
        children: [
          {
            id: 'condition-group-beta',
            type: 'condition',
            attribute: 'group',
            customAttribute: '',
            operator: 'equals',
            value: 'beta',
          },
          {
            id: 'condition-role-guest',
            type: 'condition',
            attribute: 'role',
            customAttribute: '',
            operator: 'not_equals',
            value: 'guest',
          },
        ],
      },
      serveMode: 'percentage',
      percentage: 50,
      rolloutPercentages: [50, 50],
      progressiveRollout: {
        startDate: '2026-08-31T17:57',
        endDate: '2026-09-10T17:57',
        startVariation: 'on',
        endVariation: 'on',
        startPercentage: 0,
        endPercentage: 100,
      },
      variation: 'on',
    },
  ],
  defaultServeMode: 'variation',
  defaultRolloutPercentages: [50, 50],
  defaultProgressiveRollout: {
    startDate: '2026-08-31T17:57',
    endDate: '2026-09-10T17:57',
    startVariation: 'on',
    endVariation: 'on',
    startPercentage: 0,
    endPercentage: 100,
  },
  defaultVariation: 'off',
}

const operatorSymbols = {
  equals: 'eq',
  not_equals: 'ne',
  less_than: 'lt',
  greater_than: 'gt',
  less_than_or_equal: 'le',
  greater_than_or_equal: 'ge',
  contains: 'contains',
  starts_with: 'startsWith',
  ends_with: 'endsWith',
  in_list: 'in',
  present: 'present',
  not: 'not',
} as const

function conditionToQuery(condition: ConditionNode) {
  const attribute =
    condition.attribute === 'custom'
      ? condition.customAttribute.trim()
      : condition.attribute
  if (condition.operator === 'present') return `${attribute} present`
  if (condition.operator === 'not') return `NOT ${attribute}`
  return [
    attribute,
    operatorSymbols[condition.operator],
    condition.value.trim(),
  ]
    .filter(Boolean)
    .join(' ')
}

export function ruleNodeToQuery(node: RuleNode): string {
  if (node.type === 'condition') return conditionToQuery(node)

  const combinator = node.combinator.toLowerCase()
  return `(${node.children.map((child) => ` ${combinator} ${ruleNodeToQuery(child)}`).join('')})`
}

function toIsoDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toISOString()
}

function parseVariationValue(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export function toFeatureFlagOutput(values: FeatureFlagFormValues) {
  return {
    [values.key || 'untitled-flag']: {
      variations: Object.fromEntries(
        values.variations.map(({ name, value }) => [
          name,
          parseVariationValue(value),
        ]),
      ),
      targeting: values.targeting.map((rule) => ({
        name: rule.name,
        query: ruleNodeToQuery(rule.conditions),
        ...(rule.serveMode === 'percentage'
          ? {
              percentage: Object.fromEntries(
                values.variations.map((variation, index) => [
                  variation.name,
                  rule.rolloutPercentages[index] ?? 0,
                ]),
              ),
            }
          : rule.serveMode === 'progressive'
            ? {
                progressiveRollout: {
                  initial: {
                    variation: rule.progressiveRollout.startVariation,
                    percentage: rule.progressiveRollout.startPercentage,
                    date: toIsoDate(rule.progressiveRollout.startDate),
                  },
                  end: {
                    variation: rule.progressiveRollout.endVariation,
                    percentage: rule.progressiveRollout.endPercentage,
                    date: toIsoDate(rule.progressiveRollout.endDate),
                  },
                },
              }
            : { variation: rule.variation }),
      })),
      defaultRule:
        values.defaultServeMode === 'percentage'
          ? {
              percentage: Object.fromEntries(
                values.variations.map((variation, index) => [
                  variation.name,
                  values.defaultRolloutPercentages[index] ?? 0,
                ]),
              ),
            }
          : values.defaultServeMode === 'progressive'
            ? {
                progressiveRollout: {
                  initial: {
                    variation: values.defaultProgressiveRollout.startVariation,
                    percentage:
                      values.defaultProgressiveRollout.startPercentage,
                    date: toIsoDate(values.defaultProgressiveRollout.startDate),
                  },
                  end: {
                    variation: values.defaultProgressiveRollout.endVariation,
                    percentage: values.defaultProgressiveRollout.endPercentage,
                    date: toIsoDate(values.defaultProgressiveRollout.endDate),
                  },
                },
              }
            : { variation: values.defaultVariation },
    },
  }
}
