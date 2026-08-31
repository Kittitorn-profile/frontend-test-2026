import { describe, expect, it } from 'vitest'

import { defaultValues, featureFlagSchema, toFeatureFlagOutput } from './schema'

describe('feature flag schema', () => {
  it('accepts the example configuration', () => {
    expect(featureFlagSchema.safeParse(defaultValues).success).toBe(true)
  })

  it('rejects invalid keys and duplicate variation names', () => {
    const result = featureFlagSchema.safeParse({
      ...defaultValues,
      key: 'Invalid Key',
      variations: [
        { name: 'same', value: 'true' },
        { name: 'same', value: 'false' },
      ],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toContain('key')
      expect(result.error.issues.map((issue) => issue.path[0])).toContain(
        'variations',
      )
    }
  })

  it('creates the expected GoFeatureFlag-style output', () => {
    const output = toFeatureFlagOutput(defaultValues)

    expect(output['my-new-feature']).toMatchObject({
      variations: { on: true, off: false },
      targeting: [
        {
          name: 'Rule 1',
          query: '( and group eq beta and role ne guest)',
          percentage: { on: 50, off: 50 },
        },
      ],
      defaultRule: { variation: 'off' },
    })
  })

  it('supports recursively nested condition groups', () => {
    const values = structuredClone(defaultValues)
    values.targeting[0].conditions.children.push({
      id: 'nested-group',
      type: 'group',
      combinator: 'OR',
      children: [
        {
          id: 'country-th',
          type: 'condition',
          attribute: 'country',
          customAttribute: '',
          operator: 'equals',
          value: 'TH',
        },
        {
          id: 'role-admin',
          type: 'condition',
          attribute: 'role',
          customAttribute: '',
          operator: 'equals',
          value: 'admin',
        },
      ],
    })

    expect(featureFlagSchema.safeParse(values).success).toBe(true)
    expect(
      toFeatureFlagOutput(values)['my-new-feature'].targeting[0].query,
    ).toBe(
      '( and group eq beta and role ne guest and ( or country eq TH or role eq admin))',
    )
  })
})
