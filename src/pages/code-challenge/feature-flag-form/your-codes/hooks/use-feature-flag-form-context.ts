import { useFormContext } from '#/components/form'

import type { FeatureFlagFormApi } from '../view/feature-flag-form'

export function useFeatureFlagFormContext() {
  return useFormContext() as unknown as FeatureFlagFormApi
}
