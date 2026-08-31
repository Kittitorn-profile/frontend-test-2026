import { describe, expect, it } from 'vitest'

import { defaultValues, featureFlagSchema, toFeatureFlagOutput } from './schema'
import type { TargetingRule } from './schema'

const exampleTargetingRule: TargetingRule = {
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
}

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

  it('reports empty dynamic fields at their exact paths', () => {
    const values = structuredClone(defaultValues)
    values.metadata.push({ key: '', value: '' })
    values.variations[0] = { name: '', value: '' }
    values.targeting.push(structuredClone(exampleTargetingRule))
    values.targeting[0].conditions.children[0] = {
      id: 'empty-condition',
      type: 'condition',
      attribute: 'custom',
      customAttribute: '',
      operator: 'equals',
      value: '',
    }

    const result = featureFlagSchema.safeParse(values)

    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join('.'))
      expect(paths).toEqual(
        expect.arrayContaining([
          'metadata.0.key',
          'metadata.0.value',
          'variations.0.name',
          'variations.0.value',
          'targeting.0.conditions.children.0.customAttribute',
          'targeting.0.conditions.children.0.value',
        ]),
      )
    }
  })

  it('accepts a partial percentage rollout and rejects totals over 100%', () => {
    const partial = structuredClone(defaultValues)
    partial.defaultServeMode = 'percentage'
    partial.defaultRolloutPercentages = [24, 2]

    expect(featureFlagSchema.safeParse(partial).success).toBe(true)

    partial.defaultRolloutPercentages = [75, 26]
    const result = featureFlagSchema.safeParse(partial)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['defaultRolloutPercentages'],
            message: 'Rollout percentages cannot exceed 100%',
          }),
        ]),
      )
    }
  })

  it('creates the expected GoFeatureFlag-style output', () => {
    const output = toFeatureFlagOutput(defaultValues)

    expect(output['my-new-feature']).toMatchObject({
      variations: { on: true, off: false },
      targeting: [],
      defaultRule: { variation: 'off' },
    })
  })

  it('serializes flag metadata and values according to the selected type', () => {
    const values = {
      ...structuredClone(defaultValues),
      flagType: 'number' as const,
      version: '1.2.0',
      disable: true,
      trackEvents: true,
      metadata: [
        { key: 'team', value: 'checkout' },
        { key: 'owner', value: 'frontend' },
      ],
      variations: [
        { name: 'small', value: '10' },
        { name: 'large', value: '25.5' },
      ],
      defaultVariation: 'small',
      defaultProgressiveRollout: {
        ...structuredClone(defaultValues.defaultProgressiveRollout),
        startVariation: 'small',
        endVariation: 'large',
      },
    }

    expect(featureFlagSchema.safeParse(values).success).toBe(true)
    expect(toFeatureFlagOutput(values)['my-new-feature']).toMatchObject({
      variations: { small: 10, large: 25.5 },
      version: '1.2.0',
      disable: true,
      trackEvents: true,
      metadata: { team: 'checkout', owner: 'frontend' },
    })
  })

  it('supports recursively nested condition groups', () => {
    const values = structuredClone(defaultValues)
    values.targeting.push(structuredClone(exampleTargetingRule))
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
