import { test, expect } from '@playwright/test'

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/')
  await page.getByRole('link', { name: 'Đăng nhập' }).click()
  await page.getByRole('textbox', { name: 'Email Address' }).click()
  await page.getByRole('textbox', { name: 'Email Address' }).fill('anhdung2004hd123@gmail.com')
  await page.getByRole('textbox', { name: 'Email Address' }).press('Tab')
  await page.getByRole('textbox', { name: 'Password' }).fill('123456')
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await page.getByRole('paragraph').filter({ hasText: 'Email hoặc mật khẩu không đúng' }).click()
  await expect(
    page.locator('div').filter({ hasText: /^Email hoặc mật khẩu không đúng$/ })
  ).toBeVisible()
  await page.getByRole('textbox', { name: 'Password' }).click()
  await page.getByRole('textbox', { name: 'Password' }).fill('')
  await expect(page.getByText('Mật khẩu phải có ít nhất 6 k')).toBeVisible()
  await page.getByRole('textbox', { name: 'Password' }).click()
  await page.getByRole('textbox', { name: 'Password' }).fill('anhdung2004')
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await expect(
    page.locator('div').filter({ hasText: 'Đăng nhập thành côngChào mừng' }).nth(1)
  ).toBeVisible()
})
