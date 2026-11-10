/** Choose the existing necessary-only option before interacting with page content. */
export async function necessaryCookies(page) {
  const stored = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('status-cookie-choice') ?? 'null')?.analytics === false; }
    catch { return false; }
  });
  if (stored) return;
  const button = page.getByRole('button', { name: 'Только необходимые', exact: true });
  await button.waitFor({ state: 'visible' });
  await button.click();
}
