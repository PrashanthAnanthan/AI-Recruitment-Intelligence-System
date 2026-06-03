import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 120000, // 2 min for large batches
})

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.message || err.message
    return Promise.reject(new Error(msg))
  }
)

// Screening endpoints
export const screeningApi = {
  create:    (data)      => api.post('/screening', data),
  getById:   (id)        => api.get(`/screening/${id}`),
  getAll:    ()          => api.get('/screening'),
  delete:    (id)        => api.delete(`/screening/${id}`),
  exportXLS: (id)        => api.get(`/screening/${id}/export/xlsx`, { responseType: 'blob' }),
  exportPDF: (id)        => api.get(`/screening/${id}/export/pdf`,  { responseType: 'blob' }),
}

// Upload endpoints
export const uploadApi = {
  uploadCVs:   (formData, onProgress) => api.post('/upload/cvs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
  }),
  fromDrive:   (link) => api.post('/upload/drive',  { link }),
  fromS3:      (data) => api.post('/upload/s3',      data),
}

export default api
