import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ImportLog {
  _id: string
  fileName: string
  timestamp: string
  totalFetched: number
  totalImported: number
  newJobs: number
  updatedJobs: number
  failedJobs: number
  status: string
  failureReasons?: Array<{
    jobId: string
    reason: string
    error: string
  }>
}

interface ImportStats {
  totalImports: number
  totalFetched: number
  totalImported: number
  totalNew: number
  totalUpdated: number
  totalFailed: number
}

export default function Home() {
  const [importHistory, setImportHistory] = useState<ImportLog[]>([])
  const [stats, setStats] = useState<ImportStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchImportHistory = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/import/history`, {
        params: { page, limit: 20 },
      })
      setImportHistory(response.data.data)
      setTotalPages(response.data.pagination.pages)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch import history')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/import/stats`)
      setStats(response.data.stats)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const triggerImport = async () => {
    try {
      setImporting(true)
      setError(null)
      setSuccess(null)
      const response = await axios.post(`${API_URL}/api/import/trigger`)
      setSuccess('Import triggered successfully! Jobs are being processed in the background.')
      // Refresh history after a short delay
      setTimeout(() => {
        fetchImportHistory()
        fetchStats()
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to trigger import')
    } finally {
      setImporting(false)
    }
  }

  useEffect(() => {
    fetchImportHistory()
    fetchStats()
  }, [page])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { class: string; label: string }> = {
      pending: { class: 'badge-info', label: 'Pending' },
      processing: { class: 'badge-warning', label: 'Processing' },
      completed: { class: 'badge-success', label: 'Completed' },
      failed: { class: 'badge-danger', label: 'Failed' },
    }
    const statusInfo = statusMap[status] || { class: 'badge-info', label: status }
    return <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Job Import History</h1>
        <p>Track and monitor job imports from various sources</p>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Imports</h3>
            <div className="value">{stats.totalImports}</div>
          </div>
          <div className="stat-card">
            <h3>Total Fetched</h3>
            <div className="value">{stats.totalFetched}</div>
          </div>
          <div className="stat-card">
            <h3>Total Imported</h3>
            <div className="value">{stats.totalImported}</div>
          </div>
          <div className="stat-card">
            <h3>New Jobs</h3>
            <div className="value">{stats.totalNew}</div>
          </div>
          <div className="stat-card">
            <h3>Updated Jobs</h3>
            <div className="value">{stats.totalUpdated}</div>
          </div>
          <div className="stat-card">
            <h3>Failed Jobs</h3>
            <div className="value">{stats.totalFailed}</div>
          </div>
        </div>
      )}

      <div className="actions">
        <button
          className="btn btn-primary"
          onClick={triggerImport}
          disabled={importing}
        >
          {importing ? 'Importing...' : 'Trigger Import'}
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            fetchImportHistory()
            fetchStats()
          }}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="table-container">
        {loading ? (
          <div className="loading">Loading import history...</div>
        ) : importHistory.length === 0 ? (
          <div className="loading">No import history found</div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>File Name (URL)</th>
                  <th>Timestamp</th>
                  <th>Total</th>
                  <th>New</th>
                  <th>Updated</th>
                  <th>Failed</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {importHistory.map((log) => (
                  <tr key={log._id}>
                    <td className="url-cell">
                      <a
                        href={log.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={log.fileName}
                      >
                        {log.fileName.length > 50
                          ? `${log.fileName.substring(0, 50)}...`
                          : log.fileName}
                      </a>
                    </td>
                    <td>{formatDate(log.timestamp)}</td>
                    <td>{log.totalFetched}</td>
                    <td>
                      <span className="badge badge-success">{log.newJobs}</span>
                    </td>
                    <td>
                      <span className="badge badge-info">{log.updatedJobs}</span>
                    </td>
                    <td>
                      {log.failedJobs > 0 ? (
                        <span className="badge badge-danger">{log.failedJobs}</span>
                      ) : (
                        <span>0</span>
                      )}
                    </td>
                    <td>{getStatusBadge(log.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

