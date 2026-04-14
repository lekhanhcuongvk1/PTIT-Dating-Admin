import client from './client.js'

export const listDocuments = (params) =>
  client.get('/admin/knowledge', { params }).then((r) => r.data.data)

export const getDocument = (id) =>
  client.get(`/admin/knowledge/${id}`).then((r) => r.data.data)

export const createDocument = (body) =>
  client.post('/admin/knowledge', body).then((r) => r.data.data)

export const updateDocument = (id, body) =>
  client.put(`/admin/knowledge/${id}`, body).then((r) => r.data.data)

export const deleteDocument = (id) =>
  client.delete(`/admin/knowledge/${id}`).then((r) => r.data.data)

export const reembedDocument = (id) =>
  client.post(`/admin/knowledge/${id}/reembed`).then((r) => r.data.data)
