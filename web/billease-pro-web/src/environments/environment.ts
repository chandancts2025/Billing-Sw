export const environment = {
  production: false,
  apiBaseUrl: (typeof window !== 'undefined' && (window as any).__env?.apiBaseUrl)
    || (typeof localStorage !== 'undefined' && localStorage.getItem('billease_api_url'))
    || (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
        ? 'https://billease-pro-api.onrender.com/api/v1'
        : 'http://localhost:5244/api/v1')
};
