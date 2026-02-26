const normalizeBffUrl = (url) => {
  if (!url) {
    return '';
  }

  const trimmed = url.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) {
    return trimmed.slice(0, -4);
  }

  return trimmed;
};

const rawBffUrl =
  import.meta.env.VITE_BFF_URL ||
  import.meta.env.VITE_API_URL ||
  'https://hogar-ancianos-bff.onrender.com';

const BFF_BASE_URL = normalizeBffUrl(rawBffUrl);

export const getBffBaseUrl = () => BFF_BASE_URL;
export const getBffApiBaseUrl = () => `${BFF_BASE_URL}/api/bff`;
export const getBffApiRootUrl = () => `${BFF_BASE_URL}/api`;
