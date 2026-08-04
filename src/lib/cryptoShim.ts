import forge from 'node-forge';

const generateFallbackUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const randomUUID = (): string => {
  try {
    if (
      typeof globalThis !== 'undefined' &&
      globalThis.crypto &&
      typeof globalThis.crypto.randomUUID === 'function' &&
      globalThis.crypto.randomUUID !== randomUUID
    ) {
      return globalThis.crypto.randomUUID();
    }
  } catch (e) {}
  return generateFallbackUUID();
};

export const getRandomValues = <T extends ArrayBufferView | null>(array: T): T => {
  try {
    if (
      typeof globalThis !== 'undefined' &&
      globalThis.crypto &&
      typeof globalThis.crypto.getRandomValues === 'function' &&
      globalThis.crypto.getRandomValues !== getRandomValues
    ) {
      return globalThis.crypto.getRandomValues(array as any);
    }
  } catch (e) {}
  if (array) {
    const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return array;
};

export const createHash = (algorithm: string) => {
  const md = algorithm === 'sha256' ? forge.md.sha256.create() : forge.md.sha1.create();
  let buffer = '';
  const hashObj = {
    update: (data: any, encoding?: string) => {
      if (typeof data === 'string') {
        buffer += data;
        md.update(data, (encoding as any) || 'utf8');
      } else if (data) {
        md.update(data.toString());
      }
      return hashObj;
    },
    digest: (encoding?: string) => {
      const bytes = md.digest().getBytes();
      if (encoding === 'base64') {
        return forge.util.encode64(bytes);
      }
      if (encoding === 'hex') {
        return md.digest().toHex();
      }
      return bytes;
    }
  };
  return hashObj;
};

export const constants = {
  SSL_OP_LEGACY_SERVER_CONNECT: 0x00000004,
  SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION: 0x00040000
};

const cryptoShim = {
  randomUUID,
  getRandomValues,
  createHash,
  constants
};

export default cryptoShim;
