type RecordData = {
  id: string
  createdAt?: string
  [key: string]: unknown
}

type QueryOptions = {
  where?: Record<string, unknown>
  orderBy?: Record<string, 'asc' | 'desc'>
}

const STORAGE_KEY = 'onekana_hr_lite_local_db_v1'

const today = new Date().toISOString().split('T')[0]

const seedData: Record<string, RecordData[]> = {
  departments: [
    { id: 'dept-rh', name: 'Ressources Humaines', description: 'Gestion du personnel et administration.' },
    { id: 'dept-ooh', name: 'Régie OOH', description: 'Commercialisation des supports publicitaires.' },
    { id: 'dept-tech', name: 'Technique', description: 'Maintenance terrain et installations.' },
  ],
  jobTitles: [
    { id: 'job-hr-manager', name: 'Responsable RH' },
    { id: 'job-sales', name: 'Account Manager OOH' },
    { id: 'job-tech', name: 'Technicien terrain' },
  ],
  employeeStatuses: [
    { id: 'status-active', name: 'Actif', color: 'bg-green-100 text-green-700' },
    { id: 'status-leave', name: 'Congé', color: 'bg-amber-100 text-amber-700' },
    { id: 'status-inactive', name: 'Inactif', color: 'bg-gray-100 text-gray-700' },
  ],
  employees: [
    {
      id: 'emp-1',
      firstName: 'Amina',
      lastName: 'Kabwe',
      email: 'amina.kabwe@onekana.local',
      departmentId: 'dept-rh',
      jobTitle: 'Responsable RH',
      status: 'Actif',
    },
    {
      id: 'emp-2',
      firstName: 'Marc',
      lastName: 'Ilunga',
      email: 'marc.ilunga@onekana.local',
      departmentId: 'dept-ooh',
      jobTitle: 'Account Manager OOH',
      status: 'Actif',
    },
    {
      id: 'emp-3',
      firstName: 'Sarah',
      lastName: 'Mbuyi',
      email: 'sarah.mbuyi@onekana.local',
      departmentId: 'dept-tech',
      jobTitle: 'Technicien terrain',
      status: 'Actif',
    },
  ],
  materialTypes: [
    { id: 'mat-laptop', name: 'Ordinateur portable' },
    { id: 'mat-phone', name: 'Téléphone' },
    { id: 'mat-tool', name: 'Kit technique' },
  ],
  materials: [
    {
      id: 'material-1',
      name: 'Laptop Dell Latitude',
      type: 'Ordinateur portable',
      serialNumber: 'DL-ONK-001',
      purchaseDate: '2026-01-12',
      status: 'Assigné',
      assignedTo: 'emp-1',
      description: 'Poste administratif RH.',
    },
    {
      id: 'material-2',
      name: 'Kit installation vinyle',
      type: 'Kit technique',
      serialNumber: 'KIT-OOH-014',
      purchaseDate: '2026-02-08',
      status: 'Disponible',
      assignedTo: null,
      description: 'Matériel terrain pour pose de visuels.',
    },
  ],
  reservationTypes: [
    { id: 'res-ooh', name: 'Campagne OOH' },
    { id: 'res-partner', name: 'Partenariat agence' },
    { id: 'res-event', name: 'Activation événementielle' },
  ],
  reservations: [
    {
      id: 'reservation-1',
      agencyName: 'Agence Alpha Media',
      contactName: 'Jean Dupont',
      contactEmail: 'jean@alpha.example',
      contactPhone: '+243 990 000 101',
      serviceType: 'Campagne OOH',
      startDate: today,
      endDate: '2026-06-15',
      status: 'Confirmée',
      notes: 'Demande de visibilité centre-ville.',
      createdAt: '2026-05-01T09:00:00.000Z',
    },
  ],
  schedules: [
    {
      id: 'schedule-1',
      employeeId: 'emp-3',
      date: today,
      startTime: '08:30',
      endTime: '17:00',
      notes: 'Inspection supports centre-ville',
    },
  ],
  documents: [
    {
      id: 'doc-1',
      name: 'Contrat Amina Kabwe',
      employeeId: 'emp-1',
      type: 'Contrat',
      fileUrl: '#',
      createdAt: '2026-01-12T10:00:00.000Z',
    },
  ],
  oohSites: [
    { id: 'site-1', name: 'Centre Ville Lubumbashi', address: 'Avenue Kasavubu', city: 'Lubumbashi', coordinates: '-11.664,27.479' },
    { id: 'site-2', name: 'Route Aéroport', address: 'Boulevard de l’Aéroport', city: 'Lubumbashi', coordinates: '-11.591,27.531' },
  ],
  oohSupports: [
    { id: 'support-1', name: 'Panneau 4x3 statique', type: 'Statique', dimensions: '4m x 3m' },
    { id: 'support-2', name: 'Écran LED digital', type: 'Digital', dimensions: '6m x 3m' },
  ],
  oohEmplacements: [
    { id: 'emp-ooh-1', name: 'Face A - Centre Ville', siteId: 'site-1', supportId: 'support-1', status: 'available' },
    { id: 'emp-ooh-2', name: 'LED Principal - Aéroport', siteId: 'site-2', supportId: 'support-2', status: 'available' },
  ],
  oohAssets: [
    { id: 'asset-1', name: 'Visuel lancement produit', fileUrl: '#', type: 'Image' },
    { id: 'asset-2', name: 'Spot LED 15s', fileUrl: '#', type: 'Vidéo' },
  ],
  oohPricingRules: [
    { id: 'price-static', supportType: 'Statique', basePrice: 1200, coefficient: 1 },
    { id: 'price-digital', supportType: 'Digital', basePrice: 2000, coefficient: 1.4 },
  ],
  oohCampaigns: [
    {
      id: 'campaign-1',
      name: 'Lancement Fresh Cola',
      clientName: 'Fresh Cola RDC',
      startDate: today,
      endDate: '2026-06-01',
      status: 'active',
    },
  ],
  oohCampaignLines: [
    {
      id: 'line-1',
      campaignId: 'campaign-1',
      emplacementId: 'emp-ooh-1',
      assetId: 'asset-1',
      totalPrice: 1200,
    },
  ],
  oohTasks: [
    {
      id: 'task-1',
      title: 'Nettoyage panneau centre-ville',
      status: 'pending',
      priority: 'medium',
      emplacementId: 'emp-ooh-1',
    },
  ],
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function loadDb() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData))
    return clone(seedData)
  }

  try {
    return { ...clone(seedData), ...JSON.parse(stored) } as Record<string, RecordData[]>
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData))
    return clone(seedData)
  }
}

function saveDb(db: Record<string, RecordData[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

function matchesWhere(row: RecordData, where?: Record<string, unknown>) {
  if (!where) return true
  return Object.entries(where).every(([key, expected]) => row[key] === expected)
}

function sortRows(rows: RecordData[], orderBy?: Record<string, 'asc' | 'desc'>) {
  const firstOrder = orderBy && Object.entries(orderBy)[0]
  if (!firstOrder) return rows

  const [field, direction] = firstOrder
  return [...rows].sort((a, b) => {
    const av = String(a[field] ?? '')
    const bv = String(b[field] ?? '')
    return direction === 'desc' ? bv.localeCompare(av) : av.localeCompare(bv)
  })
}

function createTable(tableName: string) {
  return {
    async list<T = any>(options: QueryOptions = {}): Promise<T[]> {
      const db = loadDb()
      const rows = db[tableName] ?? []
      return sortRows(rows.filter((row) => matchesWhere(row, options.where)), options.orderBy) as T[]
    },
    async get<T = any>(id: string): Promise<T | null> {
      const db = loadDb()
      return ((db[tableName] ?? []).find((row) => row.id === id) ?? null) as T | null
    },
    async count(options: QueryOptions = {}) {
      const rows = await this.list(options)
      return rows.length
    },
    async create<T = any>(data: Omit<RecordData, 'id'> & { id?: string }): Promise<T> {
      const db = loadDb()
      const rows = db[tableName] ?? []
      const now = new Date().toISOString()
      const row = {
        ...data,
        id: data.id || `${tableName}-${crypto.randomUUID()}`,
        createdAt: data.createdAt || now,
      } as RecordData
      db[tableName] = [...rows, row]
      saveDb(db)
      return row as T
    },
    async update<T = any>(id: string, data: Partial<RecordData>): Promise<T | null> {
      const db = loadDb()
      const rows = db[tableName] ?? []
      let updated: RecordData | null = null
      db[tableName] = rows.map((row) => {
        if (row.id !== id) return row
        updated = { ...row, ...data, id }
        return updated
      })
      saveDb(db)
      return updated as T | null
    },
    async delete(id: string) {
      const db = loadDb()
      db[tableName] = (db[tableName] ?? []).filter((row) => row.id !== id)
      saveDb(db)
      return { success: true }
    },
  }
}

const tableNames = Object.keys(seedData)

export const localData = {
  db: Object.fromEntries(tableNames.map((name) => [name, createTable(name)])) as Record<string, ReturnType<typeof createTable>>,
  storage: {
    async upload(file: File, path: string) {
      return {
        path,
        publicUrl: URL.createObjectURL(file),
      }
    },
  },
}
