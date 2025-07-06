import type { Config } from 'jest'
import { createDefaultEsmPreset } from 'ts-jest'

const presetConfig = createDefaultEsmPreset({})

export default {
  ...presetConfig,
  moduleNameMapper: {
    '@src/(.*)': '<rootDir>/src/$1',
    '^(..?/.+).js?$': '$1',
  },
} satisfies Config
