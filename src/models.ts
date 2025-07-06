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

export type SymmetricEncryptionAlgorithm =
  | 'aes-128-gcm'
  | 'aes-192-gcm'
  | 'aes-256-gcm'
  | 'aes-128-cbc'
  | 'aes-192-cbc'
  | 'aes-256-cbc'

type AlgorithmConfig = {
  keyLength: number
  ivLength: number
  tokenFormat: string
}
export const symmetricAlgorithmConfig = {
  'aes-128-gcm': {
    keyLength: 128,
    ivLength: 92,
    tokenFormat: 'algorithm:iv:authTag:ciphertext',
  },
  'aes-192-gcm': {
    keyLength: 192,
    ivLength: 92,
    tokenFormat: 'algorithm:iv:authTag:ciphertext',
  },
  'aes-256-gcm': {
    keyLength: 256,
    ivLength: 92,
    tokenFormat: 'algorithm:iv:authTag:ciphertext',
  },
  'aes-128-cbc': {
    keyLength: 128,
    ivLength: 128,
    tokenFormat: 'algorithm:iv:ciphertext',
  },
  'aes-192-cbc': {
    keyLength: 192,
    ivLength: 128,
    tokenFormat: 'algorithm:iv:ciphertext',
  },
  'aes-256-cbc': {
    keyLength: 256,
    ivLength: 128,
    tokenFormat: 'algorithm:iv:ciphertext',
  },
} as const satisfies Record<SymmetricEncryptionAlgorithm, AlgorithmConfig>

export const supportedSymmetricKeyLengths = Object.values(
  symmetricAlgorithmConfig
).map((config) => config.keyLength) as number[]

export type SymmetricKeyLength =
  (typeof symmetricAlgorithmConfig)[SymmetricEncryptionAlgorithm]['keyLength']
