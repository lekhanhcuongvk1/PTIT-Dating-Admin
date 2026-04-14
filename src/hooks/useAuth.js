function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

export function getAdminToken() {
  return localStorage.getItem('admin_token')
}

export function isAdminAuthenticated() {
  const token = getAdminToken()
  if (!token) return false
  const payload = decodeJwt(token)
  if (!payload) return false
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    localStorage.removeItem('admin_token')
    return false
  }
  return payload.role === 'admin'
}

export function saveToken(token) {
  localStorage.setItem('admin_token', token)
}

export function logout() {
  localStorage.removeItem('admin_token')
}
