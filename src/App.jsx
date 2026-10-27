import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

const API_BASE = '/api'
const DEFAULT_LOGIN = {
  email: 'admin@fieldsafe.local',
  password: 'password123'
}
const ROLE_OPTIONS = ['admin', 'manager', 'technician', 'viewer']
const USER_STATUS_OPTIONS = ['active', 'inactive']
const PAGE_PERMISSIONS = {
  dashboard: ['admin', 'manager', 'technician', 'viewer'],
  clients: ['admin', 'manager', 'technician'],
  installations: ['admin', 'manager', 'technician'],
  admin: ['admin']
}
const ACTION_PERMISSIONS = {
  create_user: ['admin'],
  create_type: ['admin'],
  create_client: ['admin', 'manager'],
  reveal_code: ['admin', 'manager', 'technician']
}

function hasPageAccess(role, page) {
  return (PAGE_PERMISSIONS[page] || []).includes(role)
}

function canPerform(role, action) {
  return (ACTION_PERMISSIONS[action] || []).includes(role)
}

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('fieldsafe_token')
  const headers = { ...(options.headers || {}) }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed')
  }

  return payload
}

function useAuthState() {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('fieldsafe_token')
    const user = localStorage.getItem('fieldsafe_user')
    return {
      token,
      user: user ? JSON.parse(user) : null
    }
  })

  const login = async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })

    localStorage.setItem('fieldsafe_token', data.token)
    localStorage.setItem('fieldsafe_user', JSON.stringify(data.user))
    setAuth({ token: data.token, user: data.user })
    return data
  }

  const logout = () => {
    localStorage.removeItem('fieldsafe_token')
    localStorage.removeItem('fieldsafe_user')
    setAuth({ token: null, user: null })
  }

  return { auth, login, logout }
}

function formatDate(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(date))
}

function maskCode(code = '') {
  return code.split('').map(() => '•').join('')
}

function Loader({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center text-sm uppercase tracking-[0.2em] text-slate-400">
      {label}
    </div>
  )
}

function LoginPage({ onLogin, isSubmitting, setIsSubmitting }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState(DEFAULT_LOGIN)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await onLogin(form.email, form.password)
      const from = location.state?.from || '/'
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="panel w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-500/15 text-2xl font-bold text-accent-200 ring-1 ring-accent-500/30">
            F
          </div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Secure access</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">FieldSafe</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-slate-400">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white placeholder:text-slate-500 focus:border-accent-500"
              placeholder="admin@fieldsafe.local"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-slate-400">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white placeholder:text-slate-500 focus:border-accent-500"
              placeholder="password123"
              required
            />
          </div>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-accent-600 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-sm text-slate-300">
          <p className="font-medium text-white">Demo credentials</p>
          <p className="mt-2">Email: {DEFAULT_LOGIN.email}</p>
          <p>Password: {DEFAULT_LOGIN.password}</p>
        </div>
      </div>
    </div>
  )
}

function DashboardPage({ overview, clients }) {
  if (!overview || !clients) return <Loader label="Loading dashboard" />

  const alerts = overview.alerts || []

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Clients', value: overview.clients, icon: '👥' },
          { label: 'Sites', value: overview.sites, icon: '🏢' },
          { label: 'Installations', value: overview.installations, icon: '🔒' },
          { label: 'Alerts', value: overview.alertsCount, icon: '🚨' }
        ].map((item) => (
          <div key={item.label} className="panel p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/10 text-2xl text-accent-200">
                {item.icon}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent client portfolio</h2>
            <Link to="/clients" className="text-sm text-accent-200">View all</Link>
          </div>

          <div className="space-y-3">
            {clients.slice(0, 5).map((client) => (
              <div key={client.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                <div>
                  <p className="font-medium text-white">{client.name}</p>
                  <p className="text-xs text-slate-400">{client.contact}</p>
                </div>
                <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-300">
                  {client.sites.length} sites
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">Service due</h2>
          <div className="space-y-3">
            {alerts.length ? alerts.map((alert, index) => (
              <div key={`${alert.client}-${alert.site}-${alert.name}-${index}`} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                <p className="font-medium text-white">{alert.name}</p>
                <p className="text-xs text-slate-400">{alert.client} · {alert.site}</p>
                <span className="mt-2 inline-block rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-amber-300">
                  {formatDate(alert.nextService)}
                </span>
              </div>
            )) : (
              <p className="text-sm text-slate-400">No service due items right now.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function ClientsPage({ clients, setClients, installationTypes, role }) {
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '')
  const [clientForm, setClientForm] = useState({ name: '', contact: '' })
  const [clientMessage, setClientMessage] = useState('')
  const [clientError, setClientError] = useState('')
  const [isSavingClient, setIsSavingClient] = useState(false)
  const selectedClient = clients.find((item) => item.id === selectedClientId) || clients[0]
  const canCreateClient = canPerform(role, 'create_client')

  useEffect(() => {
    if (clients.length && !selectedClientId) {
      setSelectedClientId(clients[0].id)
    }
  }, [clients, selectedClientId])

  const handleAddClient = async (event) => {
    event.preventDefault()
    setClientError('')
    setClientMessage('')

    if (!canCreateClient) {
      setClientError('You do not have permission to add clients.')
      return
    }

    const name = clientForm.name.trim()
    const contact = clientForm.contact.trim()

    if (!name) {
      setClientError('Client name is required.')
      return
    }

    setIsSavingClient(true)

    try {
      const response = await apiRequest('/clients', {
        method: 'POST',
        body: JSON.stringify({ name, contact })
      })

      setClients((state) => [response.client, ...state])
      setSelectedClientId(response.client.id)
      setClientForm({ name: '', contact: '' })
      setClientMessage('Client added successfully.')
    } catch (err) {
      setClientError(err.message)
    } finally {
      setIsSavingClient(false)
    }
  }

  if (!clients.length) return <Loader label="Loading clients" />

  return (
    <div className="space-y-6">
      <div className="panel p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Portfolio</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Clients & sites</h2>
          </div>
          {canCreateClient ? (
            <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200">
              Client access enabled
            </span>
          ) : null}
        </div>
      </div>

      {canCreateClient ? (
        <form onSubmit={handleAddClient} className="panel space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Quick add</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Add a new client</h3>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_auto]">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">Client name</label>
              <input
                value={clientForm.name}
                onChange={(event) => setClientForm((state) => ({ ...state, name: event.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white focus:border-accent-500"
                placeholder="Northwind Properties"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">Primary contact</label>
              <input
                value={clientForm.contact}
                onChange={(event) => setClientForm((state) => ({ ...state, contact: event.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white focus:border-accent-500"
                placeholder="A. Smith"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingClient}
              className="self-end rounded-xl bg-accent-600 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingClient ? 'Saving...' : 'Add client'}
            </button>
          </div>

          {clientMessage ? <p className="text-sm text-emerald-300">{clientMessage}</p> : null}
          {clientError ? <p className="text-sm text-red-300">{clientError}</p> : null}
        </form>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="panel p-4">
          <h3 className="mb-4 text-sm uppercase tracking-[0.16em] text-slate-400">Client list</h3>
          <div className="space-y-3">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  selectedClientId === client.id
                    ? 'border-accent-500/30 bg-accent-500/10'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{client.name}</p>
                    <p className="text-xs text-slate-400">{client.contact}</p>
                  </div>
                  <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-300">
                    {client.sites.length}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-4">
          {selectedClient ? (
            <>
              <div className="panel p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Client</p>
                    <h3 className="mt-1 text-2xl font-semibold text-white">{selectedClient.name}</h3>
                  </div>
                  <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-300">
                    Contact: {selectedClient.contact}
                  </span>
                </div>
              </div>

              {selectedClient.sites.map((site) => (
                <div key={site.id} className="panel p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Site</p>
                      <h4 className="mt-1 text-xl font-semibold text-white">{site.name}</h4>
                    </div>
                    <span className="badge border-emerald-500/30 bg-emerald-500/10 text-emerald-300">{site.status}</span>
                  </div>

                  <p className="mb-4 text-sm text-slate-300">{site.address}</p>

                  <div className="space-y-3">
                    {site.installations.map((installation) => {
                      const config = installationTypes[installation.type] || installationTypes.intrusion
                      return (
                        <div key={installation.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-white">{installation.name}</p>
                              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{config.label}</p>
                            </div>
                            <span className={`badge ${config.accent}`}>{installation.status}</span>
                          </div>

                          <div className="grid gap-3 md:grid-cols-3 text-sm text-slate-300">
                            <div>
                              <p className="text-slate-500">Technician</p>
                              <p className="mt-1 text-white">{installation.technician}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Service</p>
                              <p className="mt-1 text-white">{formatDate(installation.nextService)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Notes</p>
                              <p className="mt-1 text-white">{installation.notes || 'No notes yet.'}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function InstallationsPage({ installations, installationTypes, role }) {
  const [selectedInstallationId, setSelectedInstallationId] = useState(installations[0]?.id || '')
  const [revealed, setRevealed] = useState({})
  const canReveal = canPerform(role, 'reveal_code')

  useEffect(() => {
    if (installations.length && !selectedInstallationId) {
      setSelectedInstallationId(installations[0].id)
    }
  }, [installations, selectedInstallationId])

  const selected = installations.find((item) => item.id === selectedInstallationId) || installations[0]
  const typeConfig = installationTypes[selected?.type] || installationTypes.intrusion

  if (!installations.length) return <Loader label="Loading installations" />

  return (
    <div className="space-y-6">
      <div className="panel p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Operations</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Installation vault</h2>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="panel p-4">
          <h3 className="mb-4 text-sm uppercase tracking-[0.16em] text-slate-400">All installations</h3>
          <div className="space-y-3">
            {installations.map((installation) => (
              <button
                key={installation.id}
                onClick={() => setSelectedInstallationId(installation.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  selectedInstallationId === installation.id
                    ? 'border-accent-500/30 bg-accent-500/10'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <p className="font-medium text-white">{installation.name}</p>
                <p className="text-xs text-slate-400">{installation.siteName}</p>
              </button>
            ))}
          </div>
        </aside>

        {selected ? (
          <div className="space-y-6">
            <div className="panel p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Installation</p>
                  <h3 className="mt-1 text-2xl font-semibold text-white">{selected.name}</h3>
                </div>
                <span className={`badge ${typeConfig.accent}`}>{typeConfig.label}</span>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Client</p>
                  <p className="mt-2 text-white">{selected.clientName}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Technician</p>
                  <p className="mt-2 text-white">{selected.technician}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Next service</p>
                  <p className="mt-2 text-white">{formatDate(selected.nextService)}</p>
                </div>
              </div>
            </div>

            <div className="panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Code vault</h3>
                <span className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-300">
                  {canReveal ? 'Masked by default' : 'Read-only access'}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                [{ label: 'Installer Code', value: selected.installerCode }, { label: 'Master Code', value: selected.masterCode }].map((code) => (
                  <div key={code.label} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{code.label}</p>
                      {canReveal ? (
                        <button
                          className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-200"
                          onClick={() => setRevealed((state) => ({ ...state, [code.label]: !state[code.label] }))}
                        >
                          {revealed[code.label] ? 'Hide' : 'Reveal'}
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-3 font-mono text-xl tracking-[0.28em] text-white">
                      {canReveal && revealed[code.label] ? code.value : maskCode(code.value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel p-5">
              <h3 className="mb-4 text-lg font-semibold text-white">Dynamic fields</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {(typeConfig.fields || []).map((field) => (
                  <div key={field.key} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{field.label}</p>
                    <p className="mt-2 text-base font-medium text-white">{selected.custom?.[field.key] || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function AdminPage({ installationTypes, setInstallationTypes, users, setUsers, authUser }) {
  const [form, setForm] = useState({ label: '', fields: '' })
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'technician', status: 'active' })
  const [editingUserId, setEditingUserId] = useState(null)
  const [message, setMessage] = useState('')
  const [userMessage, setUserMessage] = useState('')
  const [error, setError] = useState('')
  const [userError, setUserError] = useState('')
  const canCreateType = canPerform(authUser?.role, 'create_type')
  const canCreateUser = canPerform(authUser?.role, 'create_user')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!canCreateType) {
      setError('You do not have permission to create installation types.')
      return
    }

    try {
      const response = await apiRequest('/types', {
        method: 'POST',
        body: JSON.stringify({
          label: form.label,
          fields: form.fields
        })
      })

      setInstallationTypes((state) => ({ ...state, [response.typeKey]: response.type }))
      setForm({ label: '', fields: '' })
      setMessage('Installation type added successfully.')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUserSubmit = async (event) => {
    event.preventDefault()
    setUserError('')
    setUserMessage('')

    if (!canCreateUser) {
      setUserError('You do not have permission to manage users.')
      return
    }

    try {
      const payload = {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        status: userForm.status
      }

      if (userForm.password) {
        payload.password = userForm.password
      }

      const response = editingUserId
        ? await apiRequest(`/users/${editingUserId}`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
          })
        : await apiRequest('/users', {
            method: 'POST',
            body: JSON.stringify({
              ...payload,
              password: userForm.password
            })
          })

      if (editingUserId) {
        setUsers((state) => state.map((user) => user.id === editingUserId ? { ...user, ...response.user } : user))
        setUserMessage('User updated successfully.')
      } else {
        setUsers((state) => [response.user, ...state])
        setUserMessage(`User created successfully with the ${response.user.role} role.`)
      }

      setUserForm({ name: '', email: '', password: '', role: 'technician', status: 'active' })
      setEditingUserId(null)
    } catch (err) {
      setUserError(err.message)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!canCreateUser) {
      setUserError('You do not have permission to manage users.')
      return
    }

    const target = users.find((user) => user.id === userId)
    if (!target) return

    if (!window.confirm(`Delete user ${target.name}?`)) {
      return
    }

    try {
      await apiRequest(`/users/${userId}`, {
        method: 'DELETE'
      })

      setUsers((state) => state.filter((user) => user.id !== userId))
      if (editingUserId === userId) {
        setEditingUserId(null)
        setUserForm({ name: '', email: '', password: '', role: 'technician', status: 'active' })
      }
      setUserMessage('User deleted successfully.')
    } catch (err) {
      setUserError(err.message)
    }
  }

  const startEditUser = (user) => {
    setEditingUserId(user.id)
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status || 'active'
    })
    setUserError('')
    setUserMessage('')
  }

  const cancelEditUser = () => {
    setEditingUserId(null)
    setUserForm({ name: '', email: '', password: '', role: 'technician', status: 'active' })
  }

  return (
    <div className="space-y-6">
      <div className="panel p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Admin</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Installation type studio</h2>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleSubmit} className="panel space-y-4 p-5">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">Type name</label>
            <input
              value={form.label}
              onChange={(event) => setForm((state) => ({ ...state, label: event.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white focus:border-accent-500"
              placeholder="Access Control"
              required
              disabled={!canCreateType}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">Custom fields</label>
            <input
              value={form.fields}
              onChange={(event) => setForm((state) => ({ ...state, fields: event.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white focus:border-accent-500"
              placeholder="Door Count, Readers, Credentials"
              disabled={!canCreateType}
            />
          </div>

          {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <button type="submit" className="rounded-xl bg-accent-600 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={!canCreateType}>
            Save new type
          </button>
        </form>

        <div className="panel p-5">
          <h3 className="mb-4 text-lg font-semibold text-white">Current types</h3>
          <div className="space-y-3">
            {Object.entries(installationTypes).map(([key, type]) => (
              <div key={key} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                <p className="font-medium text-white">{type.label}</p>
                <p className="mt-1 text-xs text-slate-400">{(type.fields || []).map((field) => field.label).join(', ') || 'No custom fields'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {canCreateUser ? (
        <div className="panel p-5">
          <h3 className="mb-4 text-lg font-semibold text-white">User management</h3>

          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">Full name</label>
                <input
                  value={userForm.name}
                  onChange={(event) => setUserForm((state) => ({ ...state, name: event.target.value }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white focus:border-accent-500"
                  placeholder="Jordan Smith"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(event) => setUserForm((state) => ({ ...state, email: event.target.value }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white focus:border-accent-500"
                  placeholder="jordan@example.com"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">Password</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(event) => setUserForm((state) => ({ ...state, password: event.target.value }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white focus:border-accent-500"
                  placeholder={editingUserId ? 'Leave blank to keep current password' : 'Secure password'}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">Role</label>
                <select
                  value={userForm.role}
                  onChange={(event) => setUserForm((state) => ({ ...state, role: event.target.value }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white focus:border-accent-500"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">Status</label>
                <select
                  value={userForm.status}
                  onChange={(event) => setUserForm((state) => ({ ...state, status: event.target.value }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white focus:border-accent-500"
                >
                  {USER_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="rounded-xl bg-accent-600 px-4 py-3 text-sm font-medium text-white">
                  {editingUserId ? 'Save changes' : 'Create user'}
                </button>
                {editingUserId ? (
                  <button type="button" onClick={cancelEditUser} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-medium text-white">
                    Cancel
                  </button>
                ) : null}
              </div>

              {userMessage ? <p className="text-sm text-emerald-300">{userMessage}</p> : null}
              {userError ? <p className="text-sm text-red-300">{userError}</p> : null}
            </form>

            <div>
              <h4 className="mb-3 text-sm uppercase tracking-[0.12em] text-slate-400">Existing users</h4>
              <div className="space-y-3">
                {users.length ? users.map((user) => (
                  <div key={user.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${
                        user.status === 'active'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                      }`}>
                        {user.status || 'active'}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-300">
                        {user.role}
                      </span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => startEditUser(user)} className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-200">
                          Edit
                        </button>
                        <button type="button" onClick={() => handleDeleteUser(user.id)} className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-red-200">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-400">No users yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="panel p-5 text-sm text-slate-300">
          You do not have permission to manage users.
        </div>
      )}
    </div>
  )
}

function AppLayout({ auth, logout, children }) {
  const navigate = useNavigate()
  const role = auth.user?.role || 'viewer'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { label: 'Dashboard', to: '/', page: 'dashboard' },
    { label: 'Clients', to: '/clients', page: 'clients' },
    { label: 'Installations', to: '/installations', page: 'installations' },
    { label: 'Admin', to: '/admin', page: 'admin' }
  ].filter((item) => hasPageAccess(role, item.page))

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
        <header className="panel flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-500/15 text-lg font-bold text-accent-200 ring-1 ring-accent-500/30">
              F
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Secure vault</p>
              <h1 className="text-xl font-semibold text-white">FieldSafe</h1>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} label={item.label} />
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="text-right text-sm text-slate-300">
              <p className="font-medium text-white">{auth.user?.name || 'Field technician'}</p>
              <p className="text-xs text-slate-400">{auth.user?.email || 'Secure access'} · {auth.user?.role || 'user'} · {auth.user?.status || 'active'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
            >
              Log out
            </button>
          </div>
        </header>

        <main className="mt-6">{children}</main>
      </div>
    </div>
  )
}

function NavLink({ to, label }) {
  const location = useLocation()
  const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))

  return (
    <Link
      to={to}
      className={`rounded-xl border px-3 py-2 text-sm transition ${
        active
          ? 'border-accent-500/30 bg-accent-500/10 text-accent-100'
          : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700'
      }`}
    >
      {label}
    </Link>
  )
}

function App() {
  const { auth, login, logout } = useAuthState()
  const [overview, setOverview] = useState(null)
  const [clients, setClients] = useState([])
  const [users, setUsers] = useState([])
  const [installationTypes, setInstallationTypes] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const role = auth.user?.role || 'viewer'

  useEffect(() => {
    if (!auth.token) return

    const loadData = async () => {
      try {
        const requests = [
          apiRequest('/overview'),
          apiRequest('/clients'),
          apiRequest('/types')
        ]

        if (canPerform(role, 'create_user')) {
          requests.push(apiRequest('/users'))
        }

        const [overviewData, clientsData, typesData, usersData] = await Promise.all(requests)

        setOverview(overviewData)
        setClients(clientsData)
        setInstallationTypes(typesData)
        setUsers(usersData || [])
      } catch (error) {
        console.error(error)
      }
    }

    loadData()
  }, [auth.token, role])

  if (!auth.token) {
    return <LoginPage onLogin={login} isSubmitting={isSubmitting} setIsSubmitting={setIsSubmitting} />
  }

  const installations = clients.flatMap((client) =>
    client.sites.flatMap((site) =>
      site.installations.map((installation) => ({
        ...installation,
        clientName: client.name,
        siteName: site.name,
        clientId: client.id,
        siteId: site.id
      }))
    )
  )

  return (
    <AppLayout auth={auth} logout={logout}>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route
          path="/"
          element={hasPageAccess(role, 'dashboard') ? <DashboardPage overview={overview} clients={clients} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/clients"
          element={
            hasPageAccess(role, 'clients') ? (
              <ClientsPage clients={clients} setClients={setClients} installationTypes={installationTypes} role={role} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/installations"
          element={
            hasPageAccess(role, 'installations') ? (
              <InstallationsPage installations={installations} installationTypes={installationTypes} role={role} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admin"
          element={
            hasPageAccess(role, 'admin') ? (
              <AdminPage installationTypes={installationTypes} setInstallationTypes={setInstallationTypes} users={users} setUsers={setUsers} authUser={auth.user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </AppLayout>
  )
}

export default App
