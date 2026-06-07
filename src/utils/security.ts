import * as Crypto from "expo-crypto";

export const LOCAL_PASSWORD_HASH_ITERATIONS = 250;

export async function hashPassword(password: string, salt: string, iterations = LOCAL_PASSWORD_HASH_ITERATIONS) {
  let digest = `${salt}:${password}`;

  for (let index = 0; index < iterations; index += 1) {
    digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${index}:${digest}`);
  }

  return digest;
}

export function sanitizeUserFacingText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}
