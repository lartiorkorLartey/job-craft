import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const auth = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}

export const resumes = {
  list: () => api.get('/resumes'),
  upload: (formData) =>
    api.post('/resumes', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/resumes/${id}`),
}

export const jobs = {
  list: () => api.get('/jobs'),
  create: (formData) =>
    api.post('/jobs', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/jobs/${id}`),
}

export const applications = {
  list: () => api.get('/applications'),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.patch(`/applications/${id}`, data),
  delete: (id) => api.delete(`/applications/${id}`),
}

export const generator = {
  generate: (data) => api.post('/generator/generate', data),
  testAts: (data) => api.post('/generator/test-ats', data),
}

export default api
