import client from './client.js'

export const listUsers = (params) =>
  client.get('/admin/users', { params }).then((r) => r.data.data)

export const banUser = (userId, body = {}) =>
  client.post(`/admin/users/${userId}/ban`, body).then((r) => r.data.data)

export const unbanUser = (userId, body = {}) =>
  client.post(`/admin/users/${userId}/unban`, body).then((r) => r.data.data)
