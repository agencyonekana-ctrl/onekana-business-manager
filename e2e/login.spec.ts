import { expect, test, type Page } from '@playwright/test'

const adminUser = {
  id: '1',
  displayName: 'Admin ONEKANA',
  email: 'admin@example.test',
  tenant: { id: '1', name: 'ONEKANA' },
  roles: ['admin'],
  permissions: ['dashboard.view', 'sales.view'],
  modules: ['dashboard', 'sales'],
}

async function mockSession(page: Page, user = adminUser) {
  await page.route('**/api/auth/refresh', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { access_token: 'memory-only-test-token', token_type: 'bearer', expires_in: 900, user } }),
  }))
}

test('shows the login portal and keeps private pages protected', async ({ page }) => {
  await page.route('**/api/auth/refresh', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Session expiree."}' }))

  await page.goto('/contacts')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()
  await expect(page.getByLabel('Adresse e-mail')).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Mot de passe' })).toBeVisible()
})

test('keeps the login layout usable on desktop and mobile viewports', async ({ page }) => {
  await page.route('**/api/auth/refresh', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Session expirée."}' }))

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible()
    await expect(page.getByAltText('Équipe ONEKANA lors d’une activation publicitaire urbaine')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible()

    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(hasHorizontalOverflow).toBe(false)
  }
})

test('redirects to the requested page after a successful login', async ({ page }) => {
  await page.route('**/api/auth/refresh', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Session expirée."}' }))
  await page.route('**/api/auth/login', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { access_token: 'memory-only-test-token', token_type: 'bearer', expires_in: 900, user: adminUser } }),
  }))
  await page.route('**/api/agency/contacts', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[]}' }))

  await page.goto('/contacts')
  await page.getByLabel('Adresse e-mail').fill('admin@example.test')
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('valid-password')
  await page.getByRole('button', { name: 'Se connecter' }).click()

  await expect(page).toHaveURL(/\/contacts$/)
})

for (const scenario of [
  { status: 401, expected: 'Adresse e-mail ou mot de passe incorrect.' },
  { status: 429, expected: 'Trop de tentatives. Patientez quelques minutes avant de réessayer.' },
]) {
  test(`shows an inline message for login status ${scenario.status}`, async ({ page }) => {
    await page.route('**/api/auth/refresh', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Session expirée."}' }))
    await page.route('**/api/auth/login', (route) => route.fulfill({ status: scenario.status, contentType: 'application/json', body: '{"message":"Connexion refusée."}' }))

    await page.goto('/login')
    await page.getByLabel('Adresse e-mail').fill('admin@example.test')
    await page.getByRole('textbox', { name: 'Mot de passe' }).fill('invalid-password')
    await page.getByRole('button', { name: 'Se connecter' }).click()

    await expect(page.getByRole('alert')).toHaveText(scenario.expected)
    await page.getByLabel('Adresse e-mail').fill('new@example.test')
    await expect(page.getByRole('alert')).toHaveCount(0)
  })
}

test('shows a service message when the login request cannot complete', async ({ page }) => {
  await page.route('**/api/auth/refresh', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Session expirée."}' }))
  await page.route('**/api/auth/login', (route) => route.abort('failed'))

  await page.goto('/login')
  await page.getByLabel('Adresse e-mail').fill('admin@example.test')
  await page.getByRole('textbox', { name: 'Mot de passe' }).fill('password')
  await page.getByRole('button', { name: 'Se connecter' }).click()

  await expect(page.getByRole('alert')).toHaveText('Connexion momentanément indisponible. Veuillez réessayer.')
})

test('renders received contacts as a read-only supervision list', async ({ page }) => {
  await mockSession(page)
  await page.route('**/api/agency/contacts', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [{ id: 21, name: 'Entreprise Test', email: 'contact@example.test', company: 'ONEKANA Test' }] }),
  }))

  await page.goto('/contacts')

  await expect(page.getByRole('heading', { name: 'Contacts', exact: true })).toBeVisible()
  await expect(page.getByText('Entreprise Test')).toBeVisible()
  await expect(page.getByRole('button', { name: /nouveau|ajouter|supprimer/i })).toHaveCount(0)
})

test('offers anomaly reporting for accounts and contacts without a verification action', async ({ page }) => {
  const supervisor = { ...adminUser, permissions: ['sales.view', 'approvals.view', 'approvals.decide'], modules: ['sales', 'approvals'] }
  await mockSession(page, supervisor)
  await page.route('**/api/admin/cases**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[],"meta":{"current_page":1,"per_page":100,"total":0,"last_page":1}}' }))
  await page.route('**/api/agency/users', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[{"id":"u-1","name":"Utilisateur Test","email":"user@example.test","company":"Entreprise Test","active":true}]}' }))
  await page.route('**/api/agency/contacts', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[{"id":"c-1","name":"Contact Test","email":"contact@example.test","company":"Entreprise Test"}]}' }))

  await page.goto('/agency-users')
  await expect(page.getByRole('button', { name: 'Signaler' })).toBeVisible()
  await expect(page.getByRole('button', { name: /vérifier/i })).toHaveCount(0)

  await page.goto('/contacts')
  await expect(page.getByRole('button', { name: 'Signaler' })).toBeVisible()
  await expect(page.getByRole('button', { name: /vérifier/i })).toHaveCount(0)
})

test('opens and processes a validation case from the administrative queue', async ({ page }) => {
  const approvalUser = { ...adminUser, permissions: ['dashboard.view', 'approvals.view', 'approvals.assign', 'approvals.decide', 'approvals.manage'], modules: ['dashboard', 'approvals'] }
  const approvalCase = {
    id: '91', subjectId: '10', sourceSystem: 'agency', resourceType: 'agency_contact', externalId: '21',
    title: 'Demande Entreprise Test', companyName: 'Entreprise Test', snapshot: {}, status: 'pending', priority: 'high',
    assignedTo: null, assigneeName: null, dueAt: '2026-07-16 10:00:00', syncStatus: 'local_only', version: 1,
    createdAt: '2026-07-15 10:00:00', updatedAt: '2026-07-15 10:00:00', comments: [], events: [],
  }
  await mockSession(page, approvalUser)
  await page.route('**/api/admin/cases**', (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname.endsWith('/assignees')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [approvalUser] }) })
    if (pathname.endsWith('/91')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: approvalCase }) })
    if (route.request().method() === 'GET') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [approvalCase], meta: { current_page: 1, per_page: 20, total: 1, last_page: 1 } }) })
    return route.fallback()
  })

  await page.goto('/validations')
  await expect(page.getByRole('heading', { name: 'Centre de validation' })).toBeVisible()
  await expect(page.getByText('Demande Entreprise Test')).toBeVisible()
  await page.getByRole('button', { name: 'Ouvrir', exact: true }).click()
  await expect(page.getByText('Organisation du contrôle')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Prendre en charge' })).toBeVisible()
})

test('shows a clear forbidden state when the module is not granted', async ({ page }) => {
  await mockSession(page, { ...adminUser, permissions: ['dashboard.view'], modules: ['dashboard'] })

  await page.goto('/contacts')

  await expect(page.getByRole('heading', { name: 'Accès non autorisé' })).toBeVisible()
})

test('submits password recovery without revealing whether the account exists', async ({ page }) => {
  await page.route('**/api/auth/refresh', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Session expirée."}' }))
  await page.route('**/api/auth/forgot-password', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":{"message":"Si ce compte existe, un e-mail sera envoyé."}}' }))
  await page.goto('/forgot-password')
  await page.getByLabel('Adresse e-mail').fill('unknown@example.test')
  await page.getByRole('button', { name: 'Recevoir le lien' }).click()
  await expect(page.getByRole('status')).toContainText('Si ce compte existe')
})

test('resets a password from a single-use link', async ({ page }) => {
  await page.route('**/api/auth/refresh', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Session expirée."}' }))
  await page.route('**/api/auth/reset-password', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":{"message":"Mot de passe mis à jour."}}' }))
  await page.goto('/reset-password?token=recovery-token')
  await page.getByLabel('Nouveau mot de passe').fill('NewPassword12345')
  await page.getByLabel('Confirmer le mot de passe').fill('NewPassword12345')
  await page.getByRole('button', { name: 'Enregistrer le mot de passe' }).click()
  await expect(page.getByRole('status')).toContainText('mis à jour')
})

test('redirects to login when an authenticated session expires', async ({ page }) => {
  let refreshCount = 0
  await page.route('**/api/auth/refresh', (route) => {
    refreshCount++
    if (refreshCount === 1) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { access_token: 'short-lived-token', user: adminUser } }) })
    return route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Session expirée."}' })
  })
  await page.route('**/api/agency/contacts', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Session expirée."}' }))
  await page.goto('/contacts')
  await expect(page).toHaveURL(/\/login$/)
})

test('lists administrators and their roles', async ({ page }) => {
  await mockSession(page, { ...adminUser, permissions: ['administration.manage'], modules: ['administration'] })
  await page.route('**/api/admin/users', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ ...adminUser, isActive: true }] }) }))
  await page.route('**/api/admin/roles', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[{"id":"1","name":"Administrateur","key":"admin"}]}' }))
  await page.goto('/admin-users')
  await expect(page.getByRole('heading', { name: 'Utilisateurs & accès' })).toBeVisible()
  await expect(page.getByText('admin@example.test')).toBeVisible()
  await expect(page.getByText('Actif', { exact: true })).toBeVisible()
})

test('renders the three geographic domains independently', async ({ page }) => {
  await mockSession(page, { ...adminUser, permissions: ['inventory.view'], modules: ['inventory'] })
  await page.route('**/api/agency/geographic/communes', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[{"id":1,"name":"Gombe","population":100000}]}' }))
  await page.route('**/api/agency/geographic/points-chauds', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[{"id":2,"name":"Centre-ville","latitude":-4.32,"longitude":15.31}]}' }))
  await page.route('**/api/agency/geographic/trajets', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[{"id":3,"name":"Axe principal","distance":12}]}' }))
  await page.route('**/api/geographic-reviews**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[]}' }))
  await page.goto('/geography')
  await expect(page.getByRole('heading', { name: 'Territoires & mobilité' })).toBeVisible()
  await expect(page.getByText('Gombe')).toBeVisible()
  await page.getByRole('tab', { name: /points chauds/i }).click()
  await expect(page.getByText('Centre-ville')).toBeVisible()
  await page.getByRole('tab', { name: /trajets/i }).click()
  await expect(page.getByText('Axe principal')).toBeVisible()
})

test('loads relational finance configuration without invented data', async ({ page }) => {
  await mockSession(page, { ...adminUser, permissions: ['finance.view', 'finance.manage'], modules: ['finance'] })
  const routes: Record<string, unknown> = {
    '/api/accounting/accounts': [{ id: '1', code: '411100', label: 'Clients', class: 4, type: 'asset' }],
    '/api/accounting/journals': [], '/api/accounting/entries': [], '/api/accounting/trial-balance': [], '/api/accounting/periods': [],
    '/api/accounting/settings': { configured: false },
  }
  for (const [path, data] of Object.entries(routes)) await page.route(`**${path}`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data }) }))
  await page.goto('/accounting')
  await expect(page.getByRole('heading', { name: 'Comptabilité OHADA' })).toBeVisible()
  await expect(page.getByText('Comptes de liaison')).toBeVisible()
  await expect(page.getByText('À configurer')).toBeVisible()
})

test('renders private document metadata without exposing a public file URL', async ({ page }) => {
  await mockSession(page, { ...adminUser, permissions: ['operations.view'], modules: ['operations'] })
  await page.route('**/api/documents', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[{"id":"1","name":"Contrat signé","employeeId":"7","type":"Contrat","fileId":"42","createdAt":"2026-07-15T10:00:00Z"}]}' }))
  await page.route('**/api/employees', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[{"id":"7","firstName":"Marie","lastName":"Test"}]}' }))
  await page.goto('/documents')
  await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible()
  await expect(page.getByText('Contrat signé')).toBeVisible()
  await expect(page.getByText('Marie Test')).toBeVisible()
})

test('renders media attached to an OOH resource', async ({ page }) => {
  await mockSession(page, { ...adminUser, permissions: ['inventory.view', 'inventory.manage', 'sales.view'], modules: ['inventory', 'sales'] })
  await page.route('**/api/ooh/sites', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[{"id":"10","name":"Site Gombe","address":"Boulevard principal","status":"active"}]}' }))
  await page.route('**/api/ooh/supports', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[]}' }))
  await page.route('**/api/ooh/emplacements', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[]}' }))
  await page.route('**/api/ooh/campaign-lines', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[]}' }))
  await page.route('**/api/ooh/campaigns', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[]}' }))
  await page.route('**/api/media**', (route) => {
    const entity = new URL(route.request().url()).searchParams.get('entity_type')
    const data = entity === 'ooh_site' ? [{ id: '5', entityType: 'ooh_site', entityId: '10', path: 'sites/10.webp', publicUrl: '/login-ooh.webp', mimeType: 'image/webp', altText: 'Vue du site Gombe', isCover: true, sortOrder: 0 }] : []
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data }) })
  })
  await page.goto('/inventory')
  await expect(page.getByRole('heading', { name: 'Inventaire OOH' })).toBeVisible()
  await expect(page.getByText('Site Gombe')).toBeVisible()
  await expect(page.getByAltText('Vue du site Gombe')).toBeVisible()
})
