const byteArray = new Uint8Array(16);
window.crypto.getRandomValues(byteArray);
const base64String = btoa(String.fromCharCode(...new Uint8Array(byteArray)));

export const API_TOKEN_KEY = `id_token_${base64String}`;
