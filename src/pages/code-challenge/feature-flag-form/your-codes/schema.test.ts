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
        { name: 'same', value: true },
        { name: 'same', value: false },
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

    expect(output.flags['my-new-feature']).toMatchObject({
      enabled: true,
      variations: { on: true, off: false },
      targeting: [
        {
          query: "group == 'beta'",
          percentage: 50,
          variation: 'on',
        },
      ],
      defaultRule: { variation: 'off' },
    })
  })
})
