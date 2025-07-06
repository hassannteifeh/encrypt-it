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

import { randomBytes } from 'crypto'
import { SymmetricKey } from '../keys/symmetric-key'
import {
  symmetricAlgorithmConfig,
  type SymmetricEncryptionAlgorithm,
  supportedSymmetricKeyLengths,
  type SymmetricKeyLength,
} from '../models'
import { encrypt, decrypt } from './symmetric-encryption'

const supportedAlgorithms = Object.keys(
  symmetricAlgorithmConfig
) as SymmetricEncryptionAlgorithm[]

describe('Symmetric Encryption', () => {
  describe('Successful Roundrip of Encryption and Decryption', () => {
    test.each(supportedAlgorithms)(
      'should encrypt and decrypt successfully using %s',
      (algorithm) => {
        const algorithmKeyLength = symmetricAlgorithmConfig[algorithm].keyLength
        const key = SymmetricKey.generate(algorithmKeyLength).unwrap()
        const plainText = 'DO NOT SHARE THIS SECRET'

        const encryptedStringResult = encrypt({
          key,
          plainText,
          plainTextEncoding: 'utf-8',
          algorithm,
        })

        expect(encryptedStringResult.isOk()).toBe(true)

        const decryptedResult = decrypt({
          token: encryptedStringResult.unwrap().token,
          key,
        })

        expect(decryptedResult.isOk()).toBe(true)
        expect(decryptedResult.unwrap()).toBe(plainText)
      }
    )
  })

  describe('Encrypting using encrypt', () => {
    it('should produce different tokens for the same input with different keys', () => {
      const key1 = SymmetricKey.generate(256).unwrap()
      const key2 = SymmetricKey.generate(256).unwrap()
      const plainText = 'DO NOT SHARE THIS SECRET'
      const token1 = encrypt({
        key: key1,
        plainText,
        plainTextEncoding: 'utf-8',
        algorithm: 'aes-256-gcm',
      }).unwrap().token

      const token2 = encrypt({
        key: key2,
        plainText,
        plainTextEncoding: 'utf-8',
        algorithm: 'aes-256-gcm',
      }).unwrap().token

      expect(token1).not.toBe(token2)
    })

    const algorithmInvalidKeyLengths = Object.entries(
      symmetricAlgorithmConfig
    ).reduce(
      (acc, [algorithm, config]) => {
        const keyLength = config.keyLength
        const invalidLengths = supportedSymmetricKeyLengths.filter(
          (length) => length !== keyLength
        )
        return acc.concat(
          invalidLengths.map((length) => ({
            algorithm: algorithm as SymmetricEncryptionAlgorithm,
            keyLength: length as SymmetricKeyLength,
          }))
        )
      },
      [] as {
        algorithm: SymmetricEncryptionAlgorithm
        keyLength: SymmetricKeyLength
      }[]
    )

    describe('Input Validation: key length', () => {
      const algorithmKeyLength = Object.entries(symmetricAlgorithmConfig).map(
        ([algorithm, config]) => ({
          algorithm: algorithm as SymmetricEncryptionAlgorithm,
          keyLength: config.keyLength,
        })
      )

      test.each(algorithmInvalidKeyLengths)(
        'should return an Err<Error> when providing key of length $keyLength bits for algorithm $algorithm',
        ({ algorithm, keyLength }) => {
          const key = SymmetricKey.generate(keyLength).unwrap()
          const plainText = 'top secret'

          const encryptedStringResult = encrypt({
            key,
            plainText,
            plainTextEncoding: 'utf-8',
            algorithm,
          })

          expect(encryptedStringResult.isErr()).toBe(true)
        }
      )

      test.each(algorithmKeyLength)(
        'should return Ok when providing key of length $keyLength bits for algorithm $algorithm',
        ({ algorithm, keyLength }) => {
          const key = SymmetricKey.generate(keyLength).unwrap()
          const plainText = 'top secret'

          const encryptedStringResult = encrypt({
            key,
            plainText,
            plainTextEncoding: 'utf-8',
            algorithm,
          })

          expect(encryptedStringResult.isOk()).toBe(true)
        }
      )
    })
  })

  describe('Decrypting using decrypt', () => {
    it('should return Err for invalid token', () => {
      const keyResult = SymmetricKey.generate(256)
      expect(keyResult.isOk()).toBe(true)
      const key = keyResult.unwrap()
      const token = 'invalid token'

      const decryptedResult = decrypt({
        token,
        key,
      })

      expect(decryptedResult.isErr()).toBe(true)
    })

    describe('Tampering tests', () => {
      const tamperingTestAlgorithms: SymmetricEncryptionAlgorithm[] = [
        'aes-128-gcm',
        'aes-192-gcm',
        'aes-256-gcm',
      ]
      describe.each(tamperingTestAlgorithms)(
        'Tampering with parts of the token for %s',
        (algorithm) => {
          const algorithmConfig = symmetricAlgorithmConfig[algorithm]
          const parts = algorithmConfig.tokenFormat.split(':')
          test.each(parts.filter((val) => val !== 'algorithm'))(
            'should return an Err<Error> when tampering with the %s part',
            (part) => {
              const keyResult = SymmetricKey.generate(algorithmConfig.keyLength)
              expect(keyResult.isOk()).toBe(true)
              const key = keyResult.unwrap()
              const plainText = 'top secret message'
              const encryptedStringResult = encrypt({
                key,
                plainText,
                plainTextEncoding: 'utf-8',
                algorithm,
              })
              expect(encryptedStringResult.isOk()).toBe(true)
              const serializedEncryptedPayload =
                encryptedStringResult.unwrap().token

              const tamperedToken = serializedEncryptedPayload
                .split(':')
                .slice(1)
                .map((p) => {
                  return p === part
                    ? randomBytes(p.length * 2).toString('hex')
                    : p
                })
                .join(':')

              const decryptedResult = decrypt({
                token: tamperedToken,
                key,
              })

              expect(decryptedResult.isErr()).toBe(true)
            }
          )
        }
      )
    })
  })
})
