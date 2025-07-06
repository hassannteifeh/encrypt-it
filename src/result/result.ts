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

interface ResultInterface<D, E> {
  isOk(): boolean
  isErr(): boolean
  map<F>(fn: (value: D) => F): ResultInterface<F, E>
  mapErr<F>(fn: (error: E) => F): ResultInterface<D, F>
  andThen<F>(fn: (value: D) => ResultInterface<F, E>): ResultInterface<F, E>
  unwrap(): D
  unwrapErr(): E
}

export class Ok<D, E> implements ResultInterface<D, E> {
  public readonly value: D

  constructor(value: D) {
    this.value = value
  }

  isOk(): this is Ok<D, E> {
    return true
  }

  isErr(): this is Err<D, E> {
    return false
  }

  map<F>(fn: (value: D) => F): Result<F, E> {
    return new Ok(fn(this.value))
  }

  mapErr<F>(_fn: (error: E) => F): Result<D, F> {
    return new Ok<D, F>(this.value)
  }

  andThen<F>(fn: (value: D) => Result<F, E>): Result<F, E> {
    return fn(this.value)
  }

  unwrap(): D {
    return this.value
  }

  unwrapErr(): never {
    throw new Error('Can not invoke unwrapErr on an Ok value')
  }
}

export class Err<D, E> implements ResultInterface<D, E> {
  public readonly error: E

  constructor(error: E) {
    this.error = error
  }

  isOk(): this is Ok<D, E> {
    return false
  }

  isErr(): this is Err<D, E> {
    return true
  }

  map<F>(_fn: (value: D) => F): Result<F, E> {
    return new Err<F, E>(this.error)
  }

  mapErr<F>(fn: (error: E) => F): Result<D, F> {
    return new Err<D, F>(fn(this.error))
  }

  andThen<F>(_fn: (value: D) => Result<F, E>): Result<F, E> {
    return new Err<F, E>(this.error)
  }

  unwrap(): never {
    throw new Error('Can not invoke unwrap on an Err value')
  }

  unwrapErr(): E {
    return this.error
  }
}

export type Result<D, E> = Ok<D, E> | Err<D, E>
export const ok = <D, E>(value: D): Result<D, E> => new Ok<D, E>(value)
export const err = <D, E>(error: E): Result<D, E> => new Err<D, E>(error)
