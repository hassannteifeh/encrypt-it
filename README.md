> [!WARNING]
> This package is under active development (v0.y.z) and follows Semantic Versioning v2.0.0. The public API is not yet stable and is subject to breaking changes before the v1.0.0 release. **Use in production is not recommended** until the v1.0.0 release.

## shifra

`shifra` is a simple symmetric encryption library for Node.js, built on the native crypto module. The name of the library comes from the arabic word "شيفرة", which translates to "cipher".

## Features

- **Simple API**: Encrypt and decrypt data with a high-level interface. The library automatically handles low-level details like Buffer data and Initialization Vector (IV) creation, so you don't have to.
- **Self-Contained Tokens**: Automatically bundles all necessary crypto data (IV, auth tag, etc.) into a single string token that can be stored and fetched later for decryption.
- **Safe Error Handling**: Prevents unexpected crashes by returning a `Result` object (Ok or Err) instead of throwing exceptions.
- **Zero Dependencies**: Built purely on the native Node.js crypto module.

## Install

```#!/bin/sh
npm install shifra
```

## Usage

The library uses a `Result` type for safe error handling instead of throwing exceptions. A Result is either an `Ok` containing a value, or an `Err` containing an error.

### Basic Example

Here is a simple example of encrypting and decrypting data.

```typescript
import { encrypt, decrypt } from 'shifra'

const secretKey = process.env.ENCRYPTION_KEY as string

const data = 'my secret data'

const keyResult = SymmetricKey.fromString(secretKey, 'hex')

if (keyResult.isErr()) {
  console.error('Failed to create symmetric key:', keyResult.error)
  return
}

const key = keyResult.value

const encryptionResult = encrypt({
  key,
  plainText: data,
  plainTextEncoding: 'utf-8',
  algorithm: 'aes-256-gcm',
})

if (encryptionResult.isErr()) {
  console.error('Encryption failed:', encryptionResult.error)
  return
}

const { token } = encryptionResult.value

const decryptionResult = decrypt({
  token,
  key,
})

if (decryptionResult.isErr()) {
  console.error('Decryption failed:', decryptionResult.error)
  return
}

console.log('Decrypted data:', decryptionResult.value) // Should log "my secret data"
```

### Chaining / Monadic Approach

```typescript
SymmetricKey.fromString(secretKey, 'hex')
  .andThen((key) => {
    return encrypt({
      key,
      plainText: 'my secret data',
      plainTextEncoding: 'utf-8',
      algorithm: 'aes-256-gcm',
    })
  })
  .andThen(({ token, ciphertext, iv, authTag }) => {
    console.log('Token:', token)
    console.log('Ciphertext:', ciphertext.toString('hex'))
    console.log('IV:', iv.toString('hex'))
    console.log('Authentication tag:', authTag.toString('hex'))

    return decrypt({
      key,
      token: encryptionResult.token,
    })
  })
```


## Versioning

This project follows [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

While in initial development (versions `0.y.z`), the public API is considered unstable and may change at any time. Breaking changes will be introduced in minor versions (`0.y.z`) until the `1.0.0` release.