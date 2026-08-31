import { z } from 'zod'

export const variationSchema = z.object({
  name: z.string().trim().min(1, 'Variation name is required'),
  value: z.boolean(),
})

export const targetingRuleSchema = z.object({
  attribute: z.string().trim().min(1, 'Attribute is required'),
  operator: z.enum(['equals', 'not_equals', 'contains', 'starts_with']),
  value: z.string().trim().min(1, 'Target value is required'),
  percentage: z.number().min(0).max(100),
  variation: z.string().trim().min(1, 'Select a variation'),
})

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

    data.targeting.forEach((rule, index) => {
      if (!names.includes(rule.variation)) {
        context.addIssue({
          code: 'custom',
          path: ['targeting', index, 'variation'],
          message: 'Select an existing variation',
        })
      }
    })
  })

export type FeatureFlagFormValues = z.infer<typeof featureFlagSchema>

export const defaultValues: FeatureFlagFormValues = {
  key: 'my-new-feature',
  description: 'Gradually release the redesigned experience',
  enabled: true,
  variations: [
    { name: 'on', value: true },
    { name: 'off', value: false },
  ],
  targeting: [
    {
      attribute: 'group',
      operator: 'equals',
      value: 'beta',
      percentage: 50,
      variation: 'on',
    },
  ],
  defaultVariation: 'off',
}

const operatorSymbols = {
  equals: '==',
  not_equals: '!=',
  contains: 'contains',
  starts_with: 'startsWith',
} as const

export function toFeatureFlagOutput(values: FeatureFlagFormValues) {
  return {
    flags: {
      [values.key || 'untitled-flag']: {
        description: values.description,
        enabled: values.enabled,
        variations: Object.fromEntries(
          values.variations.map(({ name, value }) => [name, value]),
        ),
        targeting: values.targeting.map((rule) => ({
          query: `${rule.attribute} ${operatorSymbols[rule.operator]} '${rule.value.replaceAll("'", "\\'")}'`,
          percentage: rule.percentage,
          variation: rule.variation,
        })),
        defaultRule: { variation: values.defaultVariation },
      },
    },
  }
}
