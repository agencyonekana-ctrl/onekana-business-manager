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
  await expect(page.getByLabel(/email/i)).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Mot de passe' })).toBeVisible()
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

test('shows a clear forbidden state when the module is not granted', async ({ page }) => {
  await mockSession(page, { ...adminUser, permissions: ['dashboard.view'], modules: ['dashboard'] })

  await page.goto('/contacts')

  await expect(page.getByRole('heading', { name: 'Accès non autorisé' })).toBeVisible()
})
