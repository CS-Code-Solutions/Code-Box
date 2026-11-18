// js/crypto-vault.js
const CryptoVault = (() => {
  let _cryptoKey = null; // Chave AES derivada mantida apenas em memória
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Converte ArrayBuffer para Base64
  function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Converte Base64 para Uint8Array
  function base64ToBuffer(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // Deriva chave AES-256 a partir da Senha Mestra e um Salt fixo por usuário (UID)
  async function unlockVault(masterPassword, userUid) {
    if (!masterPassword || masterPassword.length < 6) {
      throw new Error("A Senha Mestra deve ter pelo menos 6 caracteres.");
    }

    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(masterPassword),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const salt = encoder.encode(`CodeBox_Salt_${userUid}`);

    _cryptoKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    return true;
  }

  function lockVault() {
    _cryptoKey = null;
  }

  function isUnlocked() {
    return _cryptoKey !== null;
  }

  // Criptografa texto plano -> retorna objeto { cipherText, iv } em Base64
  async function encryptSecret(plainText) {
    if (!_cryptoKey) throw new Error("Cofre bloqueado. Desbloqueie com sua Senha Mestra.");
    if (!plainText) return { cipherText: "", iv: "" };

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      _cryptoKey,
      encoder.encode(plainText)
    );

    return {
      cipherText: bufferToBase64(encrypted),
      iv: bufferToBase64(iv)
    };
  }

  // Descriptografa { cipherText, iv } -> retorna texto plano
  async function decryptSecret(cipherText, ivBase64) {
    if (!_cryptoKey) throw new Error("Cofre bloqueado.");
    if (!cipherText || !ivBase64) return "";

    try {
      const iv = base64ToBuffer(ivBase64);
      const data = base64ToBuffer(cipherText);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        _cryptoKey,
        data
      );

      return decoder.decode(decrypted);
    } catch (e) {
      throw new Error("Falha ao descriptografar. Senha Mestra incorreta.");
    }
  }

  return {
    unlockVault,
    lockVault,
    isUnlocked,
    encryptSecret,
    decryptSecret
  };
})();
