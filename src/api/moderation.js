import client from './client.js'

export const banUser = (userId, body = {}) =>
  client.post(`/admin/users/${userId}/ban`, body).then((r) => r.data.data)

export const unbanUser = (userId, body = {}) =>
  client.post(`/admin/users/${userId}/unban`, body).then((r) => r.data.data)

export const getUserModeration = (userId, params = {}) =>
  client.get(`/admin/users/${userId}/moderation`, { params }).then((r) => r.data.data)
