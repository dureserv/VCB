import { useMemo, useState } from 'react'

const typeCatalog = {
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

const defaultClients = [
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

const navItems = ['Overview', 'Clients', 'Sites', 'Maintenance', 'Docs']

const formatShortDate = (date) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))

const maskCode = (code) => code.split('').map(() => '•').join('')

const createFallbackCustom = (type) => {
  const base = typeCatalog[type] ?? typeCatalog.intrusion
  return Object.fromEntries(base.fields.map((field) => [field.key, '—']))
}

function App() {
  const [clients, setClients] = useState(defaultClients)
  const [selectedClientId, setSelectedClientId] = useState('client-1')
  const [selectedSiteId, setSelectedSiteId] = useState('site-1')
  const [selectedInstallationId, setSelectedInstallationId] = useState('inst-1')
  const [revealedCodes, setRevealedCodes] = useState({})
  const [dynamicTypes, setDynamicTypes] = useState(typeCatalog)
  const [newTypeForm, setNewTypeForm] = useState({
    label: 'Access Control',
    fields: 'Door Count, Readers, Card Credentials, Key Fobs'
  })

  const selectedClient = clients.find((client) => client.id === selectedClientId) ?? clients[0]
  const selectedSite =
    selectedClient?.sites.find((site) => site.id === selectedSiteId) ?? selectedClient?.sites[0]
  const selectedInstallation =
    selectedSite?.installations.find((item) => item.id === selectedInstallationId) ?? selectedSite?.installations[0]

  const typeConfig = dynamicTypes[selectedInstallation?.type] ?? dynamicTypes.intrusion

  const stats = useMemo(() => {
    const siteCount = clients.reduce((total, client) => total + client.sites.length, 0)
    const installCount = clients.reduce(
      (total, client) => total + client.sites.reduce((siteTotal, site) => siteTotal + site.installations.length, 0),
      0
    )
    const activeAlerts = clients.reduce(
      (total, client) =>
        total +
        client.sites.reduce(
          (siteTotal, site) =>
            siteTotal +
            site.installations.filter((item) => item.status === 'Service Due' || item.status === 'Monitoring').length,
          0
        ),
      0
    )

    return {
      clients: clients.length,
      sites: siteCount,
      installations: installCount,
      alerts: activeAlerts
    }
  }, [clients])

  const alerts = useMemo(
    () =>
      clients.flatMap((client) =>
        client.sites.flatMap((site) =>
          site.installations.filter((item) => item.status === 'Service Due').map((item) => ({
            client: client.name,
            site: site.name,
            label: item.name,
            due: item.nextService
          }))
        )
      ),
    [clients]
  )

  const selectClient = (clientId) => {
    const client = clients.find((item) => item.id === clientId)
    if (!client) return

    setSelectedClientId(clientId)
    const nextSite = client.sites[0]
    setSelectedSiteId(nextSite?.id)
    setSelectedInstallationId(nextSite?.installations[0]?.id)
  }

  const selectSite = (siteId) => {
    setSelectedSiteId(siteId)
    const site = selectedClient?.sites.find((item) => item.id === siteId)
    setSelectedInstallationId(site?.installations[0]?.id)
  }

  const toggleCode = (key) => {
    setRevealedCodes((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleTypeChange = (nextType) => {
    if (!selectedInstallation) return

    setClients((prev) =>
      prev.map((client) => ({
        ...client,
        sites: client.sites.map((site) => ({
          ...site,
          installations: site.installations.map((item) =>
            item.id === selectedInstallation.id
              ? {
                  ...item,
                  type: nextType,
                  custom: {
                    ...createFallbackCustom(nextType),
                    ...(item.custom ?? {})
                  }
                }
              : item
          )
        }))
      }))
    )
  }

  const handleNewType = (e) => {
    e.preventDefault()
    const label = newTypeForm.label.trim()
    if (!label) return

    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const fields = newTypeForm.fields
      .split(',')
      .map((field) => field.trim())
      .filter(Boolean)
      .map((field) => ({ key: field.toLowerCase().replace(/[^a-z0-9]+/g, '-'), label: field }))

    setDynamicTypes((prev) => ({
      ...prev,
      [key]: {
        label,
        accent: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        fields: fields.length ? fields : [{ key: 'notes', label: 'Notes' }]
      }
    }))

    setNewTypeForm({ label: '', fields: '' })
    handleTypeChange(key)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 p-5 lg:p-8">
        <header className="panel flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-500/15 text-lg font-bold text-accent-200 ring-1 ring-accent-500/30">
              F
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Secure Vault</p>
              <h1 className="text-xl font-semibold text-white">FieldSafe</h1>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <button key={item} className={`nav-item ${item === 'Overview' ? 'active' : ''}`}>
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button className="rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-sm text-slate-200">
              Sync Audit
            </button>
            <button className="rounded-xl bg-accent-600 px-3 py-2 text-sm font-medium text-white shadow-lg shadow-accent-700/30">
              + Add Site
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Clients', value: stats.clients, icon: '👥' },
            { label: 'Sites', value: stats.sites, icon: '🏢' },
            { label: 'Installations', value: stats.installations, icon: '🔒' },
            { label: 'Alerts', value: stats.alerts, icon: '🚨' }
          ].map((stat) => (
            <div key={stat.label} className="panel p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{stat.value}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/10 text-2xl text-accent-200">
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </section>

        <main className="grid gap-6 xl:grid-cols-[320px_420px_minmax(0,1fr)]">
          <aside className="panel p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Client Tree</h2>
              <button className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200">
                Filter
              </button>
            </div>

            <div className="space-y-3">
              {clients.map((client) => (
                <div key={client.id}>
                  <button
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition ${
                      selectedClientId === client.id
                        ? 'border-accent-500/30 bg-accent-500/10 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-200 hover:border-slate-700'
                    }`}
                    onClick={() => selectClient(client.id)}
                  >
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-xs text-slate-400">{client.contact}</p>
                    </div>
                    <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-300">
                      {client.sites.length} sites
                    </span>
                  </button>

                  {selectedClientId === client.id && (
                    <div className="mt-2 space-y-2 pl-2">
                      {client.sites.map((site) => (
                        <button
                          key={site.id}
                          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left ${
                            selectedSiteId === site.id
                              ? 'border-accent-500/30 bg-slate-800 text-white'
                              : 'border-slate-800 bg-slate-900/50 text-slate-300'
                          }`}
                          onClick={() => selectSite(site.id)}
                        >
                          <div>
                            <p className="text-sm font-medium">{site.name}</p>
                            <p className="text-[11px] text-slate-400">{site.status}</p>
                          </div>
                          <span className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
                            {site.installations.length}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>

          <section className="panel p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Site Overview</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">{selectedSite?.name}</h2>
              </div>
              <span className="badge border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                {selectedSite?.status}
              </span>
            </div>

            <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Address</p>
              <p className="mt-2 text-sm text-slate-200">{selectedSite?.address}</p>
            </div>

            <div className="space-y-3">
              {selectedSite?.installations.map((installation) => (
                <button
                  key={installation.id}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selectedInstallationId === installation.id
                      ? 'border-accent-500/30 bg-accent-500/10 shadow-glow'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                  onClick={() => setSelectedInstallationId(installation.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold text-white">{installation.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{dynamicTypes[installation.type]?.label ?? installation.type}</p>
                    </div>
                    <span className={`badge ${dynamicTypes[installation.type]?.accent ?? 'bg-slate-800 text-slate-200 border-slate-700'}`}>
                      {installation.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <div>
                      <p className="text-slate-500">Last service</p>
                      <p className="mt-1">{formatShortDate(installation.lastService)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Next service</p>
                      <p className="mt-1">{formatShortDate(installation.nextService)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            {selectedInstallation ? (
              <>
                <div className="panel p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Installation</p>
                      <h2 className="mt-1 text-2xl font-semibold text-white">{selectedInstallation.name}</h2>
                    </div>
                    <span className={`badge ${typeConfig.accent}`}>
                      {typeConfig.label}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Technician</p>
                      <p className="mt-2 text-sm font-medium text-white">{selectedInstallation.technician}</p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Next service</p>
                      <p className="mt-2 text-sm font-medium text-white">{formatShortDate(selectedInstallation.nextService)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Maintenance interval</p>
                      <p className="mt-2 text-sm font-medium text-white">{selectedInstallation.maintenance.interval}</p>
                    </div>
                  </div>
                </div>

                <div className="panel p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Security vault</h3>
                    <div className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-300">
                      Masked by default
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      { label: 'Installer Code', value: selectedInstallation.installerCode },
                      { label: 'Master Code', value: selectedInstallation.masterCode }
                    ].map((code) => (
                      <div key={code.label} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{code.label}</p>
                          <button
                            className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-200"
                            onClick={() => toggleCode(code.label)}
                          >
                            {revealedCodes[code.label] ? 'Hide' : 'Reveal'}
                          </button>
                        </div>
                        <p className="mt-3 font-mono text-xl tracking-[0.28em] text-white">
                          {revealedCodes[code.label] ? code.value : maskCode(code.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Dynamic configuration</h3>
                    <select
                      className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-200"
                      value={selectedInstallation.type}
                      onChange={(e) => handleTypeChange(e.target.value)}
                    >
                      {Object.entries(dynamicTypes).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {typeConfig.fields.map((field) => (
                      <div key={field.key} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                        <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{field.label}</p>
                        <p className="mt-2 text-base font-medium text-white">
                          {selectedInstallation.custom?.[field.key] ?? '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Document & photo vault</h3>
                    <button className="rounded-lg bg-accent-600 px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-white">
                      Upload
                    </button>
                  </div>

                  <div className="space-y-3">
                    {selectedInstallation.documents.map((doc) => (
                      <div key={doc.name} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                        <div>
                          <p className="font-medium text-white">{doc.name}</p>
                          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{doc.type}</p>
                        </div>
                        <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-300">
                          {doc.size}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Maintenance & alerts</h3>
                    <span className="badge border-amber-500/30 bg-amber-500/10 text-amber-300">
                      {selectedInstallation.status}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Assigned technician</p>
                    <p className="mt-2 text-base font-medium text-white">{selectedInstallation.maintenance.assigned}</p>
                    <p className="mt-4 text-sm leading-6 text-slate-300">{selectedInstallation.maintenance.remarks}</p>
                  </div>
                </div>

                <div className="panel p-5">
                  <h3 className="mb-4 text-lg font-semibold text-white">Dynamic installation type studio</h3>

                  <form onSubmit={handleNewType} className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">Type name</label>
                      <input
                        value={newTypeForm.label}
                        onChange={(e) => setNewTypeForm((prev) => ({ ...prev, label: e.target.value }))}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-accent-500"
                        placeholder="CCTV, Access Control, etc."
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-slate-400">Custom fields</label>
                      <input
                        value={newTypeForm.fields}
                        onChange={(e) => setNewTypeForm((prev) => ({ ...prev, fields: e.target.value }))}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-accent-500"
                        placeholder="Door Count, Readers, Cards"
                      />
                    </div>

                    <button type="submit" className="rounded-xl bg-accent-600 px-3 py-2 text-sm font-medium text-white">
                      Add new installation type
                    </button>
                  </form>
                </div>
              </>
            ) : null}
          </section>
        </main>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Service due list</h3>
              <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-300">
                {alerts.length} items
              </span>
            </div>

            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={`${alert.client}-${alert.site}-${alert.label}`} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                  <div>
                    <p className="font-medium text-white">{alert.label}</p>
                    <p className="text-xs text-slate-400">{alert.client} · {alert.site}</p>
                  </div>
                  <span className="badge border-amber-500/30 bg-amber-500/10 text-amber-300">
                    {formatShortDate(alert.due)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-5">
            <h3 className="mb-4 text-lg font-semibold text-white">Summary</h3>
            <div className="space-y-4 text-sm text-slate-300">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Client hierarchy</p>
                <p className="mt-2 text-white">Client → Site → Installation</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Field operations</p>
                <p className="mt-2 text-white">Service logs, notes, and technician ownership kept in context.</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Security model</p>
                <p className="mt-2 text-white">Sensitive codes stay masked and only reveal on explicit user action.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default App
