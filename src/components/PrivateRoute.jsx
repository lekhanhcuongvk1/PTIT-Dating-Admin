import { Navigate } from 'react-router-dom'
import { isAdminAuthenticated } from '../hooks/useAuth.js'

export default function PrivateRoute({ children }) {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
}
