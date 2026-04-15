import * as crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set")
  }
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be exactly 32 characters long")
  }
  return Buffer.from(key, "utf8")
}

export function encrypt(text: string): string {
  if (!text) return text

  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")
    const tag = cipher.getAuthTag()

    // Combine iv, tag, and encrypted data
    return iv.toString("hex") + ":" + tag.toString("hex") + ":" + encrypted
  } catch (error) {
    console.error("Encryption error:", error)
    throw new Error("Failed to encrypt data")
  }
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText

  try {
    const key = getEncryptionKey()
    const parts = encryptedText.split(":")
    
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format")
    }

    const iv = Buffer.from(parts[0], "hex")
    const tag = Buffer.from(parts[1], "hex")
    const encrypted = parts[2]

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("Decryption error:", error)
    throw new Error("Failed to decrypt data")
  }
}

