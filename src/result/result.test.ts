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

import { ok, err, type Result } from './result'

describe('Result', () => {
  describe('Factory Functions', () => {
    describe('ok', () => {
      it('should create an Ok instance', () => {
        const value = 1
        const result = ok(value)
        expect(result.isOk()).toBe(true)
        expect(result.unwrap()).toBe(value)
      })
    })

    describe('err', () => {
      it('should create an Err instance', () => {
        const error = 'Sometimes things go wrong'
        const result = err(error)
        expect(result.isErr()).toBe(true)
        expect(result.unwrapErr()).toBe(error)
      })
    })
  })

  describe('When Result is Ok', () => {
    it('should return true for isOk', () => {
      const result = ok(1)
      expect(result.isOk()).toBe(true)
    })

    it('should return false for isErr()', () => {
      const result = ok(1)
      expect(result.isErr()).toBe(false)
    })

    it('should correctly map the value for map()', () => {
      const result = ok(1)
      const mappedResult = result.map((x) => x + 1)
      expect(mappedResult.isOk()).toBe(true)
      expect(mappedResult.unwrap()).toBe(2)
    })

    it('should ignore the transformation for mapErr() and remain an Ok', () => {
      const result = ok(1)
      const mappedResult = result.mapErr((e) => `Error: ${e}`)
      expect(mappedResult.isOk()).toBe(true)
      expect(mappedResult.unwrap()).toBe(1)
    })

    it('should return the value for unwrap()', () => {
      const value = 1
      const result = ok(value)
      expect(result.unwrap()).toBe(value)
    })
    it('should throw on unwrapErr()', () => {
      const value = 1
      const result = ok(value)
      expect(() => result.unwrapErr()).toThrow()
    })

    it('should correctly chain with andThen()', () => {
      const result = ok(1)
      const nextResult = result.andThen((x) => ok(x + 1))
      expect(nextResult.isOk()).toBe(true)
      expect(nextResult.unwrap()).toBe(2)
    })
  })

  describe('When Result is Err', () => {
    it('should return false for isOk()', () => {
      const result = err('Error')
      expect(result.isOk()).toBe(false)
    })

    it('should return true for isErr()', () => {
      const result = err('Error')
      expect(result.isErr()).toBe(true)
    })

    it('should ignore the transformation for map() and remain an Err', () => {
      const result: Result<number, string> = err('Error')
      const mappedResult = result.map((x) => x + 1)
      expect(mappedResult.isErr()).toBe(true)
      expect(mappedResult.unwrapErr()).toBe('Error')
    })

    it('should correctly map the error for mapErr()', () => {
      const result = err('Error')
      const mappedResult = result.mapErr(() => 'New Error')
      expect(mappedResult.isErr()).toBe(true)
      expect(mappedResult.unwrapErr()).toBe('New Error')
    })

    it('should throw on unwrap()', () => {
      const result = err('Error')
      expect(() => result.unwrap()).toThrow()
    })

    it('should return the error for unWrapErr()', () => {
      const error = 'Something went wrong'
      const result = err(error)
      expect(result.unwrapErr()).toBe(error)
    })

    it('should not chain with andThen()', () => {
      const originalResult: Result<number, string> = err('Error')
      const result = originalResult.andThen((x) => ok(x + 1))
      expect(result.isErr()).toBe(true)
      expect(result.unwrapErr()).toBe('Error')
    })
  })
})
