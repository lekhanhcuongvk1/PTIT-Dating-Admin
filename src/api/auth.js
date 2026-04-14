import client from './client.js'

export const getLoginUrl = () =>
  client.get('/auth/outlook/url').then((r) => r.data.redirect_url)

export const exchangeCode = (code) =>
  client.post('/auth/outlook/exchange', { code }).then((r) => r.data)

export const adminLogin = (email, password) =>
  client.post('/auth/admin/login', { email, password }).then((r) => r.data)
