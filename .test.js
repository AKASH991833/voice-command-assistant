module.exports.run = async (page, base, shot) => {
  const out = [];
  await page.waitForSelector('.msg.bot', {timeout: 8000});
  const cmds = await page.$$eval('.cmd', r => r.length);
  out.push(['14 command cards', cmds === 14]);
  // typed: math
  await page.type('#typed', 'what is 128 divided by 4');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('#log').textContent.includes('= 32'), {timeout: 5000});
  out.push(['math: 128/4 = 32', true]);
  // timer
  await page.type('#typed', 'set a timer for 5 minutes');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.timer', {timeout: 5000});
  const t = await page.$eval('.timer', e => e.textContent);
  out.push(['timer pill: ' + t.slice(0,20), /5 minutes: (4:5\d|5:00)/.test(t)]);
  // note + read
  await page.type('#typed', 'take a note: buy milk');
  await page.keyboard.press('Enter');
  await new Promise(r=>setTimeout(r,400));
  await page.type('#typed', 'read my notes');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('#log').textContent.includes('buy milk'), {timeout: 5000});
  out.push(['note saved and read back', true]);
  // unknown
  await page.type('#typed', 'flibberty gibbet quantum');
  await page.keyboard.press('Enter');
  await new Promise(r=>setTimeout(r,400));
  const last = await page.$$eval('.msg.bot', m => m[m.length-1].textContent);
  out.push(['unknown handled', /didn't catch/.test(last)]);
  if (shot) await page.screenshot({path: shot});
  return out;
};
