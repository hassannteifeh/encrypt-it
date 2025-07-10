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

import {
  symmetricAlgorithmConfig,
  type AesCbcAlgorithm,
  type AesGcmAlgorithm,
  type SymmetricEncryptionAlgorithm,
} from '../models.js'
import { err, ok, type Result } from '../result/index.ts'
import type { SymmetricKey } from '../keys/symmetric-key.js'
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'

import { isValidHex } from '../utils.js'
import { UnsupportedOrInvalidAlgorithm } from './errors.ts'

class AlgorithmKeyLengthMismatch extends Error {
  public readonly name = 'AlgorithmKeyLengthMismatch'

  constructor(
    providedKeyLengthInBits: number,
    algorithm: SymmetricEncryptionAlgorithm
  ) {
    super(
      `Invalid key length for ${algorithm}: expected ${symmetricAlgorithmConfig[algorithm].keyLength} bits, got ${providedKeyLengthInBits} bits`
    )
  }
}

const parseTokenForAesGcm = ({
  parts,
  token,
}: {
  parts: [AesGcmAlgorithm, string, string, string]
  token: string
}): Result<AesGcmEncryptionDataObject, Error> => {
  try {
    const [algorithmPart, ivPart, tagPart, ciphertextPart] = parts

    if (
      !ivPart ||
      !tagPart ||
      !ciphertextPart ||
      !isValidHex(ivPart) ||
      !isValidHex(tagPart) ||
      !isValidHex(ciphertextPart)
    ) {
      return err(new Error('Invalid token'))
    }

    const iv = Buffer.from(ivPart, 'hex')
    const authTag = Buffer.from(tagPart, 'hex')
    const ciphertext = Buffer.from(ciphertextPart, 'hex')

    const encryptionData = {
      algorithm: algorithmPart,
      iv,
      authTag,
      ciphertext,
      token,
    } as const

    return ok(encryptionData)
  } catch (error) {
    return err(
      new Error(`${parseTokenForAesGcm.name} encountered an exception`, {
        cause: error,
      })
    )
  }
}

const parseTokenForAesCbc = ({
  parts,
  token,
}: {
  parts: [AesCbcAlgorithm, string, string]
  token: string
}): Result<AesCbcEncryptionDataObject, Error> => {
  try {
    const [algorithmPart, ivPart, ciphertextPart] = parts

    if (
      !ivPart ||
      !ciphertextPart ||
      !isValidHex(ivPart) ||
      !isValidHex(ciphertextPart)
    ) {
      return err(new Error('Invalid token'))
    }

    const iv = Buffer.from(ivPart, 'hex')
    const ciphertext = Buffer.from(ciphertextPart, 'hex')

    const encryptionData = {
      algorithm: algorithmPart,
      iv,
      ciphertext,
      token,
    } as const

    return ok(encryptionData)
  } catch (error) {
    return err(
      new Error(`${parseTokenForAesCbc.name} encountered an exception`, {
        cause: error,
      })
    )
  }
}

const parseToken = (token: string): Result<EncryptionDataObject, Error> => {
  const parts = token.split(':')

  const algorithmPart = parts[0]
  if (
    (algorithmPart === 'aes-256-gcm' ||
      algorithmPart === 'aes-128-gcm' ||
      algorithmPart === 'aes-192-gcm') &&
    parts.length === 4
  ) {
    return parseTokenForAesGcm({
      parts: [algorithmPart, ...(parts.slice(1) as [string, string, string])],
      token,
    })
  } else if (
    (algorithmPart === 'aes-256-cbc' ||
      algorithmPart === 'aes-128-cbc' ||
      algorithmPart === 'aes-192-cbc') &&
    parts.length === 3
  ) {
    return parseTokenForAesCbc({
      parts: [algorithmPart, ...(parts.slice(1) as [string, string])],
      token,
    })
  } else {
    return err(new UnsupportedOrInvalidAlgorithm(algorithmPart))
  }
}

type BaseEncryptionDataObject = {
  /** The symmetric encryption algorithm used for encryption. */
  algorithm: SymmetricEncryptionAlgorithm
  /** The initialization vector (IV) used for encryption. */
  iv: Buffer
  /** The encryption token that contains all the necessary information to decrypt the data.
   * This is what will be stored or transmitted and used later for decryption.
   */
  token: string
  /** The ciphertext resulting from the encryption process. */
  ciphertext: Buffer
}

type AesGcmEncryptionDataObject = BaseEncryptionDataObject & {
  algorithm: 'aes-256-gcm' | 'aes-128-gcm' | 'aes-192-gcm'
  authTag: Buffer
}

type AesCbcEncryptionDataObject = BaseEncryptionDataObject & {
  algorithm: 'aes-256-cbc' | 'aes-128-cbc' | 'aes-192-cbc'
}

/** The shape of the encrypted data object that is returned by the encryption function. */
type EncryptionDataObject =
  | AesGcmEncryptionDataObject
  | AesCbcEncryptionDataObject

/**
 * Input parameters for the symmetric encryption operation.
 */
type EncryptInput = {
  /** The symmetric encryption algorithm to use. */
  algorithm: SymmetricEncryptionAlgorithm
  /**
   * The symmetric key used for encryption.
   * It must match the key length required by the specified algorithm.
   */
  key: SymmetricKey
  /** The plain text to encrypt. It must not be empty. */
  plainText: string
  /** The encoding of the plain text. */
  plainTextEncoding: 'utf-8'
}

/**
 * Encrypts the provided plain text using the specified symmetric encryption algorithm and key.
 *
 * It generates a random initialization vector (IV) and, for GCM modes, an authentication tag.
 * @param {EncryptInput} input - The object containing all necessary parameters for encryption.
 * @returns {Result<EncryptionDataObject, Error>} An `Ok` object containing the `EncryptionDataObject` on success,
 * or an `Err` object with an `Error` if encryption fails.
 *
 * @example
 * const keyGenerationresult = SymmetricKey.fromString(
 *   process.env.ENCRYPTION_KEY_HEX,
 *   'hex'
 * )
 * if (keyGenerationresult.isErr()) {
 *   // Handle the error, e.g., log it or or return an error, or throw an exception
 *   return
 * }
 * const key = keyGenerationresult.value
 * const encryptionResult = encrypt({
 *   algorithm: 'aes-256-gcm',
 *   key,
 *   plainText: 'DO NOT SHARE THIS SECRET',
 *   plainTextEncoding: 'utf-8',
 * })
 * if (encryptionResult.isErr()) {
 *   // Handle the error, e.g., log it or or return an error, or throw an exception
 *   return
 * }
 * const encryptionObject = encryptionResult.value
 * console.log('token:', encryptionObject.token)
 * console.log('Ciphertext:', encryptionObject.ciphertext.toString('hex'))
 * console.log('IV:', encryptionObject.iv.toString('hex'))
 * console.log('Auth Tag:', encryptionObject.authTag.toString('hex'))
 */
export const encrypt = ({
  algorithm,
  key,
  plainText,
  plainTextEncoding,
}: EncryptInput): Result<EncryptionDataObject, Error> => {
  try {
    if (plainText.length === 0) {
      return err(new Error('plaintext can not be empty'))
    }
    const plainTextBuffer = Buffer.from(plainText, plainTextEncoding)
    const rawKey = key.rawKey
    const expectedKeyLengthInBits =
      symmetricAlgorithmConfig[algorithm].keyLength
    const rawKeyLengthInBits = rawKey.length * 8
    if (rawKeyLengthInBits !== expectedKeyLengthInBits) {
      return err(new AlgorithmKeyLengthMismatch(rawKeyLengthInBits, algorithm))
    }
    const iv = randomBytes(symmetricAlgorithmConfig[algorithm].ivLength / 8)

    if (
      algorithm === 'aes-128-gcm' ||
      algorithm === 'aes-192-gcm' ||
      algorithm === 'aes-256-gcm'
    ) {
      const cipher = createCipheriv(algorithm, rawKey, iv)
      const ciphertext = Buffer.concat([
        cipher.update(plainTextBuffer),
        cipher.final(),
      ])
      const authTag = cipher.getAuthTag()
      if (!authTag || authTag.length === 0) {
        return err(new Error('Authentication tag is empty'))
      }

      const token = [
        algorithm,
        iv.toString('hex'),
        authTag.toString('hex'),
        ciphertext.toString('hex'),
      ].join(':')

      const encryptionData = {
        algorithm,
        iv,
        authTag,
        ciphertext,
        token,
      }
      return ok(encryptionData)
    }

    const cipher = createCipheriv(algorithm, rawKey, iv)
    const ciphertext = Buffer.concat([
      cipher.update(plainTextBuffer),
      cipher.final(),
    ])
    if (!ciphertext || ciphertext.length === 0) {
      return err(new Error('ciphertext is empty'))
    }

    const token = [
      algorithm,
      iv.toString('hex'),
      ciphertext.toString('hex'),
    ].join(':')
    const encryptionData = {
      algorithm,
      iv,
      ciphertext,
      token,
    }
    return ok(encryptionData)
  } catch (error) {
    return err(
      new Error(`${encrypt.name} encountered an exception`, {
        cause: error,
      })
    )
  }
}

type DecryptInput = {
  /** The symmetric key used for decryption. */
  key: SymmetricKey
  /** The token generated during encryption */
  token: string
}

/**
 * Decrypts the token produced from encryption using the provided symmetric key and returns the decrypted string.
 *
 * @param {DecryptInput} input - The input parameters for decryption.
 * @return Returns an `Ok` result with the decrypted string or an `Err` result with an error if decryption fails.
 *
 * @example
 * const decryptionResult = SymmetricKey.fromString(
 *   process.env.ENCRYPTION_KEY_HEX,
 *   'hex'
 * ).andThen((key) =>
 *  decrypt({
 *    key,
 *    token: 'aes-128-gcm:541e9787d35273ad059096:52e0bf489eff325a7ef08e80426a3a39:ee18b131c8fb136ceb837a',
 *  })
 * )
 */
export const decrypt = ({
  key,
  token,
}: DecryptInput): Result<string, Error> => {
  const parseResult = parseToken(token)
  if (parseResult.isErr()) {
    return err(parseResult.error)
  }

  const { algorithm, iv, ciphertext } = parseResult.value

  try {
    const rawKey = key.rawKey
    const keyLengthInBits = symmetricAlgorithmConfig[algorithm].keyLength
    const rawKeyLengthInBits = rawKey.length * 8
    if (rawKeyLengthInBits !== keyLengthInBits) {
      return err(new AlgorithmKeyLengthMismatch(rawKeyLengthInBits, algorithm))
    }

    let decryptedData: Buffer = Buffer.alloc(0)

    if (
      algorithm === 'aes-256-gcm' ||
      algorithm === 'aes-128-gcm' ||
      algorithm === 'aes-192-gcm'
    ) {
      const decipher = createDecipheriv(algorithm, rawKey, iv)
      decipher.setAuthTag(parseResult.value.authTag)
      decryptedData = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ])
    } else {
      const decipher = createDecipheriv(algorithm, rawKey, iv)
      decryptedData = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ])
    }

    if (!decryptedData || decryptedData.length === 0) {
      return err(new Error('Failed to decrypt'))
    }

    return ok(decryptedData.toString('utf-8'))
  } catch (error) {
    return err(
      new Error(`decrypt encountered an exception`, {
        cause: error,
      })
    )
  }
}
