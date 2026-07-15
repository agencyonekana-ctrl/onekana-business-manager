function enabled(value: string | undefined, defaultValue = false) {
  if (value === undefined || value.trim() === '') return defaultValue
  return value.trim().toLowerCase() === 'true'
}

export const featureFlags = {
  geography: enabled(import.meta.env.VITE_ENABLE_GEOGRAPHY, true),
  advancedFinance: enabled(import.meta.env.VITE_ENABLE_ADVANCED_FINANCE),
  approvalCenter: enabled(import.meta.env.VITE_ENABLE_APPROVAL_CENTER),
} as const
