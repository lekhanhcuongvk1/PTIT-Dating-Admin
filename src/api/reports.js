import client from './client.js'

export const listReports = (params) =>
  client.get('/admin/reports', { params }).then((r) => r.data.data)

export const getReport = (id) =>
  client.get(`/admin/reports/${id}`).then((r) => r.data.data)

export const reviewReport = (id, body) =>
  client.patch(`/admin/reports/${id}`, body).then((r) => r.data.data)
