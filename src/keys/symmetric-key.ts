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
import { err, ok, type Result } from '../result/index.ts'
import {
  supportedSymmetricKeyLengths,
  type SymmetricKeyLength,
} from '../models.ts'

class InvalidKeyLengthError extends Error {
  public readonly name = 'InvalidKeyLengthError'
  constructor(providedKeyLength: number, supportedLengths: Array<number>) {
    super(
      `Invalid key length: expected one of ${supportedLengths.join(
        ', '
      )} bits, got ${providedKeyLength} bits`
    )
  }
}

const symmetricKeySymbol: unique symbol = Symbol('SymmetricKey')
export class SymmetricKey {
  public readonly rawKey: Buffer
  private readonly [symmetricKeySymbol] = undefined

  private constructor(key: Buffer) {
    const keyLengthInBits = key.length * 8
    if (!supportedSymmetricKeyLengths.includes(keyLengthInBits)) {
      throw new InvalidKeyLengthError(
        keyLengthInBits,
        supportedSymmetricKeyLengths
      )
    }
    this.rawKey = key
  }

  static generate(
    lengthInBits: SymmetricKeyLength
  ): Result<SymmetricKey, Error> {
    try {
      const randomKeyBuffer = randomBytes(lengthInBits / 8)
      return ok(new SymmetricKey(randomKeyBuffer))
    } catch (error) {
      return err(
        new Error('generate encountered an exception', {
          cause: error,
        })
      )
    }
  }

  static fromString(str: string, encoding: 'hex'): Result<SymmetricKey, Error> {
    try {
      const keyBuffer = Buffer.from(str, encoding)
      const keyLengthInBits = keyBuffer.length * 8

      if (!supportedSymmetricKeyLengths.includes(keyLengthInBits)) {
        return err(
          new InvalidKeyLengthError(
            keyLengthInBits,
            supportedSymmetricKeyLengths
          )
        )
      }
      const key = new SymmetricKey(keyBuffer)
      return ok(key)
    } catch (error) {
      return err(
        new Error(`fromString encountered an exception`, {
          cause: error,
        })
      )
    }
  }
}
