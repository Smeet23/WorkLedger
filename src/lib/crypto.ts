import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const SALT_LENGTH = 32
const TAG_LENGTH = 16
const IV_LENGTH = 16
const ITERATIONS = 100000

// Use a secret from environment or generate one
const SECRET = process.env.ENCRYPTION_SECRET || process.env.NEXTAUTH_SECRET || 'default-dev-secret-change-in-production'

function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256')
}

export function encrypt(text: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH)
  const key = deriveKey(SECRET, salt)
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  const combined = Buffer.concat([
    salt,
    iv,
    authTag,
    Buffer.from(encrypted, 'hex')
  ])

  return combined.toString('base64')
}

export function decrypt(encryptedText: string): string {
  const combined = Buffer.from(encryptedText, 'base64')

  const salt = combined.slice(0, SALT_LENGTH)
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const authTag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
  const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)

  const key = deriveKey(SECRET, salt)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted).toString('utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

export function hashString(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex')
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function generateSignature(data: string, privateKey: string): string {
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(data)
  return sign.sign(privateKey, 'base64')
}

export function verifySignature(data: string, signature: string, publicKey: string): boolean {
  const verify = crypto.createVerify('RSA-SHA256')
  verify.update(data)
  return verify.verify(publicKey, signature, 'base64')
}