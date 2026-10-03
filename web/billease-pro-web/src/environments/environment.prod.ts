export const environment = {
  production: true,
  apiBaseUrl: (typeof window !== 'undefined' && (window as any).__env?.apiBaseUrl)
    || (typeof localStorage !== 'undefined' && localStorage.getItem('billease_api_url'))
    || 'https://billease-pro-api.onrender.com/api/v1'
};
