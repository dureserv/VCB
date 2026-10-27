import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = express()
const PORT = 4000
const JWT_SECRET = 'fieldsafe-dev-secret'
const ALLOWED_ROLES = ['admin', 'manager', 'technician', 'viewer']
const ROLE_PERMISSIONS = {
  admin: {
    pages: ['dashboard', 'clients', 'installations', 'admin'],
    actions: ['create_user', 'create_type', 'reveal_code']
  },
  manager: {
    pages: ['dashboard', 'clients', 'installations'],
    actions: ['reveal_code']
  },
  technician: {
    pages: ['dashboard', 'clients', 'installations'],
    actions: ['reveal_code']
  },
  viewer: {
    pages: ['dashboard'],
    actions: []
  }
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, 'data')
const DATA_PATH = path.join(DATA_DIR, 'db.json')

const defaultInstallationTypes = {
  intrusion: {
    label: 'Intrusion',
    accent: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    fields: [
      { key: 'panelModel', label: 'Control Panel' },
      { key: 'zones', label: 'Protected Zones' },
      { key: 'keypads', label: 'Keypads' },
      { key: 'sirens', label: 'Outdoor Sirens' }
    ]
  },
  fire: {
    label: 'Fire',
    accent: 'bg-red-500/15 text-red-300 border-red-500/30',
    fields: [
      { key: 'panelModel', label: 'Fire Panel' },
      { key: 'smokeDetectors', label: 'Smoke Detectors' },
      { key: 'heatDetectors', label: 'Heat Detectors' },
      { key: 'pullStations', label: 'Pull Stations' }
    ]
  },
  access: {
    label: 'Access Control',
    accent: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    fields: [
      { key: 'cardReaders', label: 'Card Readers' },
      { key: 'doorCount', label: 'Doors' },
      { key: 'credentials', label: 'Credentials' },
      { key: 'locks', label: 'Electric Locks' }
    ]
  },
  cctv: {
    label: 'CCTV',
    accent: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    fields: [
      { key: 'cameraCount', label: 'Camera Count' },
      { key: 'recordingDays', label: 'Retention' },
      { key: 'analytics', label: 'AI Analytics' },
      { key: 'storage', label: 'Storage' }
    ]
  }
}

const defaultData = {
  users: [
    {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@fieldsafe.local',
      password: 'password123',
      role: 'admin'
    }
  ],
  installationTypes: defaultInstallationTypes,
  clients: [
    {
      id: 'client-1',
      name: 'North Ridge Medical',
      contact: 'R. Jenkins',
      sites: [
        {
          id: 'site-1',
          name: 'Main Clinic',
          address: '4180 Harbor Ave, Seattle, WA',
          status: 'Active',
          installations: [
            {
              id: 'inst-1',
              name: 'Main Clinic Security',
              type: 'intrusion',
              status: 'Healthy',
              lastService: '2026-09-14',
              nextService: '2026-11-28',
              technician: 'A. Reyes',
              installerCode: '4821',
              masterCode: '3717',
              notes: 'Lobby and emergency egress points are fully monitored. Battery test passed this quarter.',
              documents: [
                { type: 'Plans', name: 'Bldg-Floorplan.pdf', size: '2.4 MB' },
                { type: 'Specs', name: 'Equipment-Specification.docx', size: '1.1 MB' },
                { type: 'Photos', name: 'Front-Entry-Photos.zip', size: '8.7 MB' }
              ],
              maintenance: {
                interval: '90 days',
                assigned: 'N. Patel',
                remarks: 'Inspect backup power and verify alarm communication paths.'
              },
              custom: {
                panelModel: 'Nexa 8X',
                zones: '14',
                keypads: '2',
                sirens: '3'
              }
            },
            {
              id: 'inst-2',
              name: 'Fire Monitoring',
              type: 'fire',
              status: 'Service Due',
              lastService: '2026-07-02',
              nextService: '2026-10-31',
              technician: 'L. Novak',
              installerCode: '5532',
              masterCode: '1129',
              notes: 'Inspection is required on the second floor smoke network for compliance.',
              documents: [
                { type: 'Plans', name: 'Fire-Alarm-Layout.pdf', size: '3.2 MB' },
                { type: 'Photo', name: 'Detector-Map.jpg', size: '1.8 MB' }
              ],
              maintenance: {
                interval: '60 days',
                assigned: 'D. Hall',
                remarks: 'Replace smoke heads in the imaging wing and run pull station test.'
              },
              custom: {
                panelModel: 'Notifier NCA-2',
                smokeDetectors: '42',
                heatDetectors: '8',
                pullStations: '7'
              }
            }
          ]
        },
        {
          id: 'site-2',
          name: 'Satellite Lab',
          address: '1320 Laker St, Seattle, WA',
          status: 'Monitoring',
          installations: [
            {
              id: 'inst-3',
              name: 'Satellite Access',
              type: 'access',
              status: 'Healthy',
              lastService: '2026-10-10',
              nextService: '2027-01-09',
              technician: 'M. Ortega',
              installerCode: '9291',
              masterCode: '7009',
              notes: 'Door readers are stable after the new badge enrollment rollout.',
              documents: [
                { type: 'Plans', name: 'Access-Layout.pdf', size: '2.1 MB' },
                { type: 'Photo', name: 'Reader-Install.jpg', size: '1.3 MB' }
              ],
              maintenance: {
                interval: '120 days',
                assigned: 'S. Kim',
                remarks: 'Battery backup schedule and lock test due in January.'
              },
              custom: {
                cardReaders: '9',
                doorCount: '6',
                credentials: '214',
                locks: '7'
              }
            }
          ]
        }
      ]
    },
    {
      id: 'client-2',
      name: 'Aurora Retail Group',
      contact: 'A. Flores',
      sites: [
        {
          id: 'site-3',
          name: 'Downtown Plaza',
          address: '880 Pine Ave, Portland, OR',
          status: 'Active',
          installations: [
            {
              id: 'inst-4',
              name: 'Plaza CCTV',
              type: 'cctv',
              status: 'Healthy',
              lastService: '2026-10-16',
              nextService: '2026-12-20',
              technician: 'C. Bloom',
              installerCode: '1644',
              masterCode: '8921',
              notes: 'Cameras are running with motion alerts in all public corridors.',
              documents: [
                { type: 'Plans', name: 'Camera-Map.pdf', size: '2.0 MB' },
                { type: 'Photo', name: 'Roof-View.jpg', size: '1.5 MB' }
              ],
              maintenance: {
                interval: '90 days',
                assigned: 'W. Frost',
                remarks: 'Check lens wash and storage health for the east parking wing.'
              },
              custom: {
                cameraCount: '24',
                recordingDays: '30 days',
                analytics: 'People detection',
                storage: '16 TB'
              }
            }
          ]
        }
      ]
    }
  ]
}

function ensureDatabase() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(defaultData, null, 2))
    return structuredClone(defaultData)
  }

  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8')
    return JSON.parse(raw)
  } catch {
    fs.writeFileSync(DATA_PATH, JSON.stringify(defaultData, null, 2))
    return structuredClone(defaultData)
  }
}

function writeDatabase(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2))
}

function normalizeDatabase(rawData) {
  const next = { ...defaultData, ...(rawData || {}) }

  next.users = (next.users || []).map((user) => ({
    ...user,
    password: user.password && user.password.startsWith('$2') ? user.password : bcrypt.hashSync(user.password || 'password123', 10),
    role: ALLOWED_ROLES.includes(String(user.role || 'viewer').toLowerCase()) ? String(user.role).toLowerCase() : 'viewer'
  }))

  next.installationTypes = { ...defaultInstallationTypes, ...(next.installationTypes || {}) }
  return next
}

function readDatabase() {
  const raw = ensureDatabase()
  const normalized = normalizeDatabase(raw)
  writeDatabase(normalized)
  return normalized
}

function issueToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '8h' })
}

function hasPermission(role, permission) {
  return (ROLE_PERMISSIONS[role]?.actions || []).includes(permission)
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) return res.status(401).json({ message: 'Authentication required.' })

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user || !hasPermission(req.user.role, permission)) {
      return res.status(403).json({ message: `Permission required: ${permission}` })
    }

    next()
  }
}

app.use(cors())
app.use(express.json({ limit: '5mb' }))

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {}
  const db = readDatabase()
  const user = db.users.find((item) => item.email.toLowerCase() === String(email || '').toLowerCase())

  if (!user || !bcrypt.compareSync(String(password || ''), user.password)) {
    return res.status(401).json({ message: 'Invalid email or password.' })
  }

  return res.json({
    token: issueToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  })
})

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const db = readDatabase()
  const user = db.users.find((item) => item.id === req.user.sub)
  if (!user) return res.status(404).json({ message: 'User not found.' })

  return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
})

app.get('/api/users', authMiddleware, requirePermission('create_user'), (req, res) => {
  const db = readDatabase()
  return res.json(db.users.map(({ id, name, email, role }) => ({ id, name, email, role })))
})

app.post('/api/users', authMiddleware, requirePermission('create_user'), (req, res) => {
  const { name = '', email = '', password = '', role = 'technician' } = req.body || {}
  const db = readDatabase()

  const cleanName = String(name).trim()
  const cleanEmail = String(email).trim().toLowerCase()
  const cleanPassword = String(password).trim()
  const cleanRole = String(role).trim().toLowerCase()

  if (!cleanName || !cleanEmail || !cleanPassword) {
    return res.status(400).json({ message: 'Name, email, and password are required.' })
  }

  if (!ALLOWED_ROLES.includes(cleanRole)) {
    return res.status(400).json({ message: `Role must be one of: ${ALLOWED_ROLES.join(', ')}` })
  }

  const exists = db.users.some((user) => user.email.toLowerCase() === cleanEmail)
  if (exists) {
    return res.status(409).json({ message: 'A user with that email already exists.' })
  }

  const newUser = {
    id: `user-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name: cleanName,
    email: cleanEmail,
    password: bcrypt.hashSync(cleanPassword, 10),
    role: cleanRole
  }

  db.users.push(newUser)
  writeDatabase(db)

  return res.status(201).json({
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }
  })
})

app.patch('/api/users/:id', authMiddleware, requirePermission('create_user'), (req, res) => {
  const { id } = req.params
  const { name, email, password, role } = req.body || {}
  const db = readDatabase()
  const userIndex = db.users.findIndex((user) => user.id === id)

  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found.' })
  }

  const user = db.users[userIndex]
  const nextName = String(name ?? user.name).trim()
  const nextEmail = String(email ?? user.email).trim().toLowerCase()
  const nextRole = String(role ?? user.role).trim().toLowerCase()

  if (!nextName || !nextEmail) {
    return res.status(400).json({ message: 'Name and email are required.' })
  }

  if (!ALLOWED_ROLES.includes(nextRole)) {
    return res.status(400).json({ message: `Role must be one of: ${ALLOWED_ROLES.join(', ')}` })
  }

  const duplicate = db.users.some((existing) => existing.id !== id && existing.email.toLowerCase() === nextEmail)
  if (duplicate) {
    return res.status(409).json({ message: 'A user with that email already exists.' })
  }

  db.users[userIndex] = {
    ...user,
    name: nextName,
    email: nextEmail,
    role: nextRole,
    password: password && String(password).trim() ? bcrypt.hashSync(String(password).trim(), 10) : user.password
  }

  writeDatabase(db)

  return res.json({
    user: {
      id: db.users[userIndex].id,
      name: db.users[userIndex].name,
      email: db.users[userIndex].email,
      role: db.users[userIndex].role
    }
  })
})

app.delete('/api/users/:id', authMiddleware, requirePermission('create_user'), (req, res) => {
  const { id } = req.params
  const db = readDatabase()
  const userIndex = db.users.findIndex((user) => user.id === id)

  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found.' })
  }

  const user = db.users[userIndex]

  if (user.id === req.user.sub) {
    return res.status(400).json({ message: 'You cannot delete your own account.' })
  }

  const adminCount = db.users.filter((item) => item.role === 'admin').length
  if (user.role === 'admin' && adminCount <= 1) {
    return res.status(400).json({ message: 'At least one admin account must remain.' })
  }

  db.users.splice(userIndex, 1)
  writeDatabase(db)

  return res.json({ ok: true, deletedUserId: id })
})

app.get('/api/overview', authMiddleware, (req, res) => {
  const db = readDatabase()
  const alerts = db.clients.flatMap((client) =>
    client.sites.flatMap((site) =>
      site.installations.filter((installation) => installation.status === 'Service Due').map((installation) => ({
        client: client.name,
        site: site.name,
        name: installation.name,
        nextService: installation.nextService
      }))
    )
  )

  return res.json({
    clients: db.clients.length,
    sites: db.clients.reduce((sum, client) => sum + client.sites.length, 0),
    installations: db.clients.reduce((sum, client) => sum + client.sites.reduce((siteSum, site) => siteSum + site.installations.length, 0), 0),
    alertsCount: alerts.length,
    alerts
  })
})

app.get('/api/clients', authMiddleware, (req, res) => {
  const db = readDatabase()
  return res.json(db.clients)
})

app.get('/api/types', authMiddleware, (req, res) => {
  const db = readDatabase()
  return res.json(db.installationTypes)
})

app.post('/api/types', authMiddleware, requirePermission('create_type'), (req, res) => {
  const { label, fields = '' } = req.body || {}
  const db = readDatabase()

  if (!label || !String(label).trim()) {
    return res.status(400).json({ message: 'A type name is required.' })
  }

  const key = String(label).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const parsedFields = String(fields)
    .split(',')
    .map((field) => field.trim())
    .filter(Boolean)
    .map((field) => ({
      key: field.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      label: field
    }))

  db.installationTypes[key] = {
    label: String(label).trim(),
    accent: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    fields: parsedFields.length ? parsedFields : [{ key: 'notes', label: 'Notes' }]
  }

  writeDatabase(db)
  return res.status(201).json({ type: db.installationTypes[key], typeKey: key })
})

app.listen(PORT, () => {
  console.log(`FieldSafe API listening on http://localhost:${PORT}`)
})

export default app
