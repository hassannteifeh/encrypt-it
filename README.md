> [!WARNING] 
> This package is still in early development (< 1.0.0). The public API is not yet stable and is subject to breaking changes. Use in production is **not recommended until version 1.0.0 is released.**

## shifra

A super simple symmetric encryption library for Node.js, built on top of the native crypto module. It bundles all necessary cryptographic data (like the IV and ciphertext) into a single token that can be stored or transmitted for later decryption.

## Install

```#!/bin/sh
npm install shifra
```

## Usage

The library uses a `Result` type for safe error handling instead of throwing exceptions. A Result is either an `Ok` containing a value, or an `Err` containing an error.

Here is a basic example:

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

const token = encryptionResult.value.token

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

Or if you prefer a more monadic/chaining approach:

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
  .andThen((encryptionResult) => {
    console.log('Token:', encryptionResult.token)
    console.log('Ciphertext:', encryptionResult.ciphertext.toString('hex'))
    console.log('IV:', encryptionResult.iv.toString('hex'))
    console.log('Auth Tag:', encryptionResult.authTag.toString('hex'))

    return decrypt({
      key,
      token: encryptionResult.token,
    })
  })
```


## Versioning

This project follows [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

While in initial development (versions `0.y.z`), the public API is considered unstable and may change at any time. Breaking changes will be introduced in minor versions (`0.y.z`) until the `1.0.0` release.