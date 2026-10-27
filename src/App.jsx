import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

const API_BASE = '/api'
const DEFAULT_LOGIN = {
  email: 'admin@fieldsafe.local',
  password: 'password123'
}
const ROLE_OPTIONS = ['admin', 'manager', 'technician', 'viewer']

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

function ProtectedRoute({ children }) {
  const location = useLocation()
  const { auth } = useAuthState()

  if (!auth.token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
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

function ClientsPage({ clients, setClients, installationTypes }) {
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '')
  const selectedClient = clients.find((item) => item.id === selectedClientId) || clients[0]

  useEffect(() => {
    if (clients.length && !selectedClientId) {
      setSelectedClientId(clients[0].id)
    }
  }, [clients, selectedClientId])

  if (!clients.length) return <Loader label="Loading clients" />

  return (
    <div className="space-y-6">
      <div className="panel p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Portfolio</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Clients & sites</h2>
          </div>
          <Link to="/admin" className="rounded-xl bg-accent-600 px-3 py-2 text-sm font-medium text-white">
            Manage inventory
          </Link>
        </div>
      </div>

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

function InstallationsPage({ installations, installationTypes }) {
  const [selectedInstallationId, setSelectedInstallationId] = useState(installations[0]?.id || '')
  const [revealed, setRevealed] = useState({})

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
                  Masked by default
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {[{ label: 'Installer Code', value: selected.installerCode }, { label: 'Master Code', value: selected.masterCode }].map((code) => (
                  <div key={code.label} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{code.label}</p>
                      <button
                        className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-200"
                        onClick={() => setRevealed((state) => ({ ...state, [code.label]: !state[code.label] }))}
                      >
                        {revealed[code.label] ? 'Hide' : 'Reveal'}
                      </button>
                    </div>
                    <p className="mt-3 font-mono text-xl tracking-[0.28em] text-white">
                      {revealed[code.label] ? code.value : maskCode(code.value)}
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
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'technician' })
  const [message, setMessage] = useState('')
  const [userMessage, setUserMessage] = useState('')
  const [error, setError] = useState('')
  const [userError, setUserError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

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

  const handleCreateUser = async (event) => {
    event.preventDefault()
    setUserError('')
    setUserMessage('')

    try {
      const response = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({
          name: userForm.name,
          email: userForm.email,
          password: userForm.password,
          role: userForm.role
        })
      })

      setUsers((state) => [response.user, ...state])
      setUserForm({ name: '', email: '', password: '', role: 'technician' })
      setUserMessage(`User created successfully with the ${response.user.role} role.`)
    } catch (err) {
      setUserError(err.message)
    }
  }

  const isAdmin = authUser?.role === 'admin'

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
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">Custom fields</label>
            <input
              value={form.fields}
              onChange={(event) => setForm((state) => ({ ...state, fields: event.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white focus:border-accent-500"
              placeholder="Door Count, Readers, Credentials"
            />
          </div>

          {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <button type="submit" className="rounded-xl bg-accent-600 px-4 py-3 text-sm font-medium text-white">
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

      {isAdmin ? (
        <div className="panel p-5">
          <h3 className="mb-4 text-lg font-semibold text-white">User management</h3>

          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <form onSubmit={handleCreateUser} className="space-y-4">
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
                  placeholder="Secure password"
                  required
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

              {userMessage ? <p className="text-sm text-emerald-300">{userMessage}</p> : null}
              {userError ? <p className="text-sm text-red-300">{userError}</p> : null}

              <button type="submit" className="rounded-xl bg-accent-600 px-4 py-3 text-sm font-medium text-white">
                Create user
              </button>
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
                      <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-300">
                        {user.role}
                      </span>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-400">No users yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function AppLayout({ auth, logout, children }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { label: 'Dashboard', to: '/' },
    { label: 'Clients', to: '/clients' },
    { label: 'Installations', to: '/installations' },
    { label: 'Admin', to: '/admin' }
  ]

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
              <p className="text-xs text-slate-400">{auth.user?.email || 'Secure access'} · {auth.user?.role || 'user'}</p>
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

  useEffect(() => {
    if (!auth.token) return

    const loadData = async () => {
      try {
        const requests = [
          apiRequest('/overview'),
          apiRequest('/clients'),
          apiRequest('/types')
        ]

        if (auth.user?.role === 'admin') {
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
  }, [auth.token, auth.user?.role])

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

  const isAdmin = auth.user?.role === 'admin'

  return (
    <AppLayout auth={auth} logout={logout}>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/" element={<DashboardPage overview={overview} clients={clients} />} />
        <Route path="/clients" element={<ClientsPage clients={clients} setClients={setClients} installationTypes={installationTypes} />} />
        <Route path="/installations" element={<InstallationsPage installations={installations} installationTypes={installationTypes} />} />
        <Route
          path="/admin"
          element={
            isAdmin ? (
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
