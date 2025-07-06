/*
 * Copyright 2025 Hassan Nteifeh
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { type Ok } from '../result/index.js'
import { SymmetricKey } from './symmetric-key.js'

describe('SymmetricKey', () => {
  it('SymmetricKey.generate() should generate a valid symmetric key', () => {
    const result = SymmetricKey.generate(256)
    expect(result.isOk()).toBe(true)
    expect((result as Ok<SymmetricKey, never>).value.rawKey.length).toBe(32)
  })

  it('SymmetricKey.fromString() should create a symmetric key from a valid hex string', () => {
    const hexStr32Bytes =
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    const result = SymmetricKey.fromString(hexStr32Bytes, 'hex')
    expect(result.isOk()).toBe(true)
    expect((result as Ok<SymmetricKey, never>).value.rawKey.length).toBe(32)
  })

  it('SymmetricKey.fromString() should fail to create a symmetric key with an unsupported length', () => {
    const hexStr8Bytes = '0123456789abcdef'
    const result = SymmetricKey.fromString(hexStr8Bytes, 'hex')
    expect(result.isErr()).toBe(true)
  })

  it('SymmetricKey.fromString() should fail to create a symmetric key from an invalid hex string', () => {
    const invalidHexStr = 'some invalid hex string'
    const result = SymmetricKey.fromString(invalidHexStr, 'hex')
    expect(result.isErr()).toBe(true)
  })
})
