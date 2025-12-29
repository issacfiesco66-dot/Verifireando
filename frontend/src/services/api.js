import axios from 'axios'
import { toast } from 'react-hot-toast'
import { auth } from '../firebase'

const useFirebaseAuth = import.meta.env.VITE_USE_FIREBASE_AUTH === 'true'

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Function to create API instance with interceptors
const createAPIInstance = (baseURL = API_BASE_URL) => {
  const instance = axios.create({
    baseURL,
    timeout: 10000,
  })

  // Request interceptor
  instance.interceptors.request.use(
    async (config) => {
      if (useFirebaseAuth) {
        const user = auth.currentUser
        if (user) {
          const idToken = await user.getIdToken()
          config.headers.Authorization = `Bearer ${idToken}`
        } else {
          delete config.headers.Authorization
        }
      } else {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor
  instance.interceptors.response.use(
    (response) => {
      return response
    },
    (error) => {
      if (error.response) {
        const { status, data } = error.response
        
        switch (status) {
          case 401:
            localStorage.removeItem('token')
            if (window.location.pathname !== '/auth/login') {
              window.location.href = '/auth/login'
            }
            break
          case 403:
            toast.error('No tienes permisos para realizar esta acción')
            break
          case 404:
            toast.error('Recurso no encontrado')
            break
          case 422:
            if (data.errors && Array.isArray(data.errors)) {
              data.errors.forEach(err => toast.error(err.message))
            } else if (data.message) {
              toast.error(data.message)
            }
            break
          case 429:
            toast.error('Demasiadas solicitudes. Intenta más tarde.')
            break
          case 500:
            toast.error('Error interno del servidor')
            break
          default:
            if (data.message) {
              toast.error(data.message)
            } else {
              toast.error('Error en la solicitud')
            }
        }
      } else if (error.request) {
        toast.error('Error de conexión. Verifica tu internet.')
      } else {
        toast.error('Error inesperado')
      }
      
      return Promise.reject(error)
    }
  )

  return instance
}

// Main API instance
export const api = createAPIInstance()

// Specific API instances
export const authAPI = createAPIInstance(`${API_BASE_URL}/auth`)
export const userAPI = createAPIInstance(`${API_BASE_URL}/users`)
export const driverAPI = createAPIInstance(`${API_BASE_URL}/drivers`)
export const carAPI = createAPIInstance(`${API_BASE_URL}/cars`)
export const appointmentAPI = createAPIInstance(`${API_BASE_URL}/appointments`)
export const paymentAPI = createAPIInstance(`${API_BASE_URL}/payments`)
export const publicPaymentAPI = createAPIInstance(`${API_BASE_URL}/public-payments`)
export const notificationAPI = createAPIInstance(`${API_BASE_URL}/notifications`)
export const serviceAPI = createAPIInstance(`${API_BASE_URL}/services`)

// File upload API (with different content type)
export const uploadAPI = createAPIInstance()
uploadAPI.defaults.headers['Content-Type'] = 'multipart/form-data'

// Public Payment service (sin autenticación)
export const publicPaymentService = {
  getMyPayments: () => publicPaymentAPI.get('/my-payments'),
  getPaymentMethods: () => publicPaymentAPI.get('/methods'),
}

// Payment service
export const paymentService = {
  getPayments: (params) => paymentAPI.get('/', { params }),
  getPayment: (id) => paymentAPI.get(`/${id}`),
  getMyPayments: () => paymentAPI.get('/my-payments'),
  createPaymentIntent: (data) => paymentAPI.post('/create-intent', data),
  confirmPayment: (id, data) => paymentAPI.post(`/${id}/confirm`, data),
  refundPayment: (id, data) => paymentAPI.post(`/${id}/refund`, data),
  getPaymentStats: (params) => paymentAPI.get('/stats', { params }),
  getPaymentMethods: () => paymentAPI.get('/methods'),
  addPaymentMethod: (data) => paymentAPI.post('/methods', data),
  deletePaymentMethod: (id) => paymentAPI.delete(`/methods/${id}`),
  setDefaultPaymentMethod: (id) => paymentAPI.put(`/methods/${id}/default`),
}

// User service
export const userService = {
  getUsers: (params) => userAPI.get('/', { params }),
  getUser: (id) => userAPI.get(`/${id}`),
  updateUser: (id, data) => userAPI.put(`/${id}`, data),
  deleteUser: (id) => userAPI.delete(`/${id}`),
  activateUser: (id) => userAPI.put(`/${id}/activate`),
  deactivateUser: (id) => userAPI.put(`/${id}/deactivate`),
  getUserStats: () => userAPI.get('/stats'),
  getSettings: () => userAPI.get('/settings'),
  updateSettings: (settings) => userAPI.put('/settings', { settings }),
  updateProfile: (data) => authAPI.put('/profile', data),
  updateNotificationPreferences: (data) => authAPI.put('/profile', { preferences: data }),
  resendVerificationEmail: () => authAPI.post('/resend-otp'),
}

// Auth service
export const authService = {
  login: (credentials) => authAPI.post('/login', credentials),
  register: (userData) => authAPI.post('/register', userData),
  logout: () => authAPI.post('/logout'),
  refreshToken: () => authAPI.post('/refresh-token'),
  forgotPassword: (email) => authAPI.post('/forgot-password', { email }),
  resetPassword: (token, password) => authAPI.post('/reset-password', { token, password }),
  verifyEmail: (token) => authAPI.post('/verify-email', { token }),
  resendVerification: () => authAPI.post('/resend-otp'),
  getProfile: () => authAPI.get('/me'),
  updateProfile: (data) => authAPI.put('/profile', data),
  changePassword: (data) => authAPI.put('/change-password', data),
  uploadAvatar: (file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return uploadAPI.post('/auth/avatar', formData)
  },
}

// Driver service
export const driverService = {
  getDrivers: (params) => driverAPI.get('/', { params }),
  getDriver: (id) => driverAPI.get(`/${id}`),
  updateDriver: (id, data) => driverAPI.put(`/${id}`, data),
  deleteDriver: (id) => driverAPI.delete(`/${id}`),
  activateDriver: (id) => driverAPI.put(`/${id}/activate`),
  deactivateDriver: (id) => driverAPI.put(`/${id}/deactivate`),
  updateLocation: (location) => driverAPI.put('/location', location),
  getAvailableDrivers: (params) => driverAPI.get('/available', { params }),
  getDriverStats: (id) => driverAPI.get(`/${id}/stats`),
  getStats: () => driverAPI.get('/stats'),
  getVehicle: () => driverAPI.get('/vehicle'),
  updateVehicle: (data) => driverAPI.put('/vehicle', data),
  uploadDocuments: (id, files) => {
    const formData = new FormData()
    Object.keys(files).forEach(key => {
      formData.append(key, files[key])
    })
    return uploadAPI.post(`/drivers/${id}/documents`, formData)
  },
}

// Car service
export const carService = {
  getCars: (params) => carAPI.get('/', { params }),
  getCar: (id) => carAPI.get(`/${id}`),
  getCarById: (id) => carAPI.get(`/${id}`), 
  getMyCars: () => carAPI.get('/my-cars'), 
  createCar: (data) => carAPI.post('/', data),
  updateCar: (id, data) => carAPI.put(`/${id}`, data),
  deleteCar: (id) => carAPI.delete(`/${id}`),
  activateCar: (id) => carAPI.put(`/${id}/activate`),
  deactivateCar: (id) => carAPI.put(`/${id}/deactivate`),
  addVerification: (id, data) => carAPI.post(`/${id}/verification`, data),
  getVerificationHistory: (id) => carAPI.get(`/${id}/verification-history`),
  getCarsDueForVerification: () => carAPI.get('/due-for-verification'),
  getCarStats: () => carAPI.get('/stats'),
}

// Appointment service
export const appointmentService = {
  getAppointments: (params) => appointmentAPI.get('/', { params }),
  getAppointment: (id) => appointmentAPI.get(`/${id}`),
  getMyAppointments: () => appointmentAPI.get('/my-appointments'),
  getDriverAppointments: () => appointmentAPI.get('/my-appointments'),
  createAppointment: (data) => appointmentAPI.post('/', data),
  updateAppointment: (id, data) => appointmentAPI.put(`/${id}`, data),
  updateStatus: (id, status, data) => appointmentAPI.put(`/${id}/status`, { status, ...data }),
  assignDriver: (id, driverId) => appointmentAPI.put(`/${id}/assign-driver`, { driverId }),
  cancelAppointment: (id, reason) => appointmentAPI.put(`/${id}/cancel`, { reason }),
  rateAppointment: (id, rating, comment) => appointmentAPI.post(`/${id}/rate`, { rating, comment }),
  getAvailableAppointments: (params) => appointmentAPI.get('/driver/available', { params }),
  acceptAppointment: (id) => appointmentAPI.put(`/${id}/accept`),
  getAppointmentStats: () => appointmentAPI.get('/stats'),
}

// Notification service
export const notificationService = {
  getNotifications: (params) => notificationAPI.get('/my-notifications', { params }),
  markAsRead: (id) => notificationAPI.put('/mark-as-read', { notificationId: id }),
  markAllAsRead: () => notificationAPI.put('/mark-all-as-read'),
  deleteNotification: (id) => notificationAPI.delete(`/${id}`),
  getUnreadCount: () => notificationAPI.get('/unread-count'),
  registerToken: (token) => notificationAPI.post('/register-token', { token }),
  sendNotification: (data) => notificationAPI.post('/send', data),
  getNotificationStats: () => notificationAPI.get('/admin/stats'),
  sendTestNotification: (data) => notificationAPI.post('/admin/test', data),
}

// Service management
export const serviceService = {
  getAllServices: (params = {}) => serviceAPI.get('/', { params }),
  getService: (id) => serviceAPI.get(`/${id}`),
  getCategories: () => serviceAPI.get('/categories/list'),
  createService: (data) => serviceAPI.post('/', data),
  updateService: (id, data) => serviceAPI.put(`/${id}`, data),
  deleteService: (id) => serviceAPI.delete(`/${id}`),
}

// Admin service for admin-specific operations
export const adminService = {
  // Users management
  getUsers: (params) => userAPI.get('/admin/users', { params }),
  getUserById: (id) => userAPI.get(`/admin/users/${id}`),
  updateUser: (id, data) => userAPI.put(`/admin/users/${id}`, data),
  deleteUser: (id) => userAPI.delete(`/admin/users/${id}`),
  createUser: (data) => userAPI.post('/admin/users', data),
  
  // Drivers management
  getDrivers: (params) => driverAPI.get('/admin/drivers', { params }),
  getDriverById: (id) => driverAPI.get(`/admin/drivers/${id}`),
  updateDriver: (id, data) => driverAPI.put(`/admin/drivers/${id}`, data),
  deleteDriver: (id) => driverAPI.delete(`/admin/drivers/${id}`),
  approveDriver: (id) => driverAPI.put(`/admin/drivers/${id}/approve`),
  rejectDriver: (id) => driverAPI.put(`/admin/drivers/${id}/reject`),
  
  // Cars management
  getCars: (params) => carAPI.get('/admin/cars', { params }),
  getCarById: (id) => carAPI.get(`/admin/cars/${id}`),
  updateCar: (id, data) => carAPI.put(`/admin/cars/${id}`, data),
  deleteCar: (id) => carAPI.delete(`/admin/cars/${id}`),
  
  // Appointments management
  getAppointments: (params) => appointmentAPI.get('/admin/appointments', { params }),
  getAppointmentById: (id) => appointmentAPI.get(`/admin/appointments/${id}`),
  updateAppointment: (id, data) => appointmentAPI.put(`/admin/appointments/${id}`, data),
  deleteAppointment: (id) => appointmentAPI.delete(`/admin/appointments/${id}`),
  
  // Payments management
  getPayments: (params) => paymentAPI.get('/admin/payments', { params }),
  getPaymentById: (id) => paymentAPI.get(`/admin/payments/${id}`),
  updatePayment: (id, data) => paymentAPI.put(`/admin/payments/${id}`, data),
  
  // Reports and analytics
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getReports: (params) => api.get('/admin/reports', { params }),
  exportReport: (type, params) => api.get(`/admin/reports/export/${type}`, { params }),
  
  // Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
}

// Utility functions
export const handleAPIError = (error, defaultMessage = 'Error en la solicitud') => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.message) {
    return error.message
  }
  return defaultMessage
}

export const createFormData = (data) => {
  const formData = new FormData()
  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      if (data[key] instanceof File) {
        formData.append(key, data[key])
      } else if (typeof data[key] === 'object') {
        formData.append(key, JSON.stringify(data[key]))
      } else {
        formData.append(key, data[key])
      }
    }
  })
  return formData
}

export default api