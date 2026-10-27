import { chromium } from 'playwright';
const [,, path, name, sel, ...widths] = process.argv;
const out = process.env.OUT;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
for (const w of widths.map(Number)) {
  const c = await b.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: 1 });
  await c.addInitScript(() => localStorage.setItem('playbook_consent_v1', JSON.stringify({essential:true,advertising:false,timestamp:Date.now()})));
  const p = await c.newPage();
  await p.goto('http://localhost:3100' + path, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-visible')));
  await p.waitForTimeout(600);
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (sel && sel !== '-') {
    const el = await p.$(sel);
    if (el) { await el.scrollIntoViewIfNeeded(); await el.screenshot({ path: `${out}/${name}-${w}.png` }); }
    else console.log('no element', sel);
  } else {
    await p.screenshot({ path: `${out}/${name}-${w}.png`, fullPage: false });
  }
  console.log(name, w, 'overflowX', overflow);
  await c.close();
}
await b.close();
