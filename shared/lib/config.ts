export const API_URL = process.env.API_URL;

if (!API_URL) {
  throw new Error('API_URL is not defined');
}
