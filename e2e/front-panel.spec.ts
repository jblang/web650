import { expect, test } from '@playwright/test';

async function setDecimalKnob(page: import('@playwright/test').Page, testId: string, digit: number) {
  const knob = page.getByTestId(testId);
  const display = knob.getByTitle('CHOOSE');

  for (let i = 0; i < 15; i += 1) {
    const current = Number((await display.innerText()).trim());
    if (current === digit) return;
    await page.getByTestId(`${testId}-inc`).click();
    await expect(display).not.toHaveText(String(current), { timeout: 2000 });
  }

  throw new Error(`Unable to set ${testId} to ${digit}`);
}

async function clickPanelButtonDom(page: import('@playwright/test').Page, label: string) {
  // Keep a DOM-click helper for controls that can be temporarily unclickable during rerender.
  const button = page.getByRole('button', { name: label });
  await button.evaluate((el) => (el as HTMLButtonElement).click());
}

async function sendConsoleCommand(page: import('@playwright/test').Page, command: string) {
  const commandInput = page.locator('#command');
  const output = page.locator('#output');
  await commandInput.fill(command);
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(output).toHaveValue(new RegExp(`sim>\\s*${command.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}`, 'i'));
}

async function expectConsoleState(output: import('@playwright/test').Locator, values: Record<string, string>) {
  for (const [key, value] of Object.entries(values)) {
    await expect(output).toHaveValue(new RegExp(`${key}:\\s*${value.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}`));
  }
}

async function clickPanelButton(page: import('@playwright/test').Page, label: string) {
  const button = page.getByRole('button', { name: label });
  await button.scrollIntoViewIfNeeded();
  // Forced click avoids sporadic Carbon overlay/intercept issues on dense front-panel controls.
  await button.click({ force: true });
}

async function setupFrontPanelManualReadIn(page: import('@playwright/test').Page) {
  await page.goto('/front-panel');
  await page.getByTestId('control-knob').getByText('MANUAL OPERATION').click();
  await page.getByTestId('display-knob').locator('span').filter({ hasText: /READ.?IN STORAGE/ }).click();
}

async function setupFrontPanelManualReadOut(page: import('@playwright/test').Page) {
  await page.goto('/front-panel');
  await page.getByTestId('control-knob').getByText('MANUAL OPERATION').click();
  await page.getByTestId('display-knob').locator('span').filter({ hasText: /READ.?OUT STORAGE/ }).click();
}

async function setupEmulatorConsole(page: import('@playwright/test').Page) {
  await page.goto('/emulator');
  return page.locator('#output');
}

test('loads the front panel and allows navigation from the header', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/front-panel\/?$/);
  await expect(page.getByRole('banner', { name: 'SIMH i650' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'MASTER RESET' })).toBeVisible();

  await page.getByRole('link', { name: 'Documentation' }).click();
  await expect(page).toHaveURL(/\/docs\/?$/);
});

test('manual transfer, then start and stop program from front panel', async ({ page }) => {
  await setupFrontPanelManualReadIn(page);
  await page.getByTestId('entry-digit-9-inc').click();

  await clickPanelButton(page, 'PROGRAM START');
  await expect(page.getByTestId('display-section')).toHaveAttribute('data-display-value', '0000000001+');

  await page.getByTestId('control-knob').getByText(/^RUN$/).click();
  await page.getByTestId('display-knob').getByText('LOWER ACCUM').click();
  await clickPanelButton(page, 'PROGRAM START');
  await expect(page.getByTestId('operating-program')).toHaveAttribute('data-lit', 'true');

  await clickPanelButton(page, 'PROGRAM STOP');
  await expect(page.getByTestId('operating-program')).toHaveAttribute('data-lit', 'false');
});

test('address stop halts repeatedly at selected addresses', async ({ page }) => {
  await setupFrontPanelManualReadIn(page);
  await setDecimalKnob(page, 'entry-digit-9', 1);
  await setDecimalKnob(page, 'address-digit-0', 0);
  await setDecimalKnob(page, 'address-digit-1', 0);
  await setDecimalKnob(page, 'address-digit-2', 0);
  await setDecimalKnob(page, 'address-digit-3', 1);
  await clickPanelButton(page, 'TRANSFER');
  await expect(page.getByTestId('address-display')).toHaveAttribute('data-address-value', '0001');
  await clickPanelButton(page, 'PROGRAM START');

  await page.getByTestId('display-knob').getByText('LOWER ACCUM').click();
  await page.getByTestId('control-knob').getByText('ADDRESS STOP').click();
  await clickPanelButton(page, 'PROGRAM START');
  await expect(page.getByTestId('address-display')).toHaveAttribute('data-address-value', '0001');
  await expect(page.getByTestId('operating-program')).toHaveAttribute('data-lit', 'false', { timeout: 20000 });

  await clickPanelButton(page, 'PROGRAM START');
  await expect(page.getByTestId('address-display')).toHaveAttribute('data-address-value', '0001');
  await expect(page.getByTestId('operating-program')).toHaveAttribute('data-lit', 'false', { timeout: 20000 });

  await page.getByTestId('control-knob').getByText('MANUAL OPERATION').click();
  await page.getByTestId('display-knob').locator('span').filter({ hasText: /READ.?IN STORAGE/ }).click();
  await setDecimalKnob(page, 'entry-digit-9', 0);
  await setDecimalKnob(page, 'address-digit-0', 0);
  await setDecimalKnob(page, 'address-digit-1', 0);
  await setDecimalKnob(page, 'address-digit-2', 0);
  await setDecimalKnob(page, 'address-digit-3', 0);
  await clickPanelButton(page, 'TRANSFER');
  await expect(page.getByTestId('address-display')).toHaveAttribute('data-address-value', '0000');
  await clickPanelButton(page, 'PROGRAM START');

  await page.getByTestId('display-knob').getByText('LOWER ACCUM').click();
  await page.getByTestId('control-knob').getByText('ADDRESS STOP').click();
  await clickPanelButton(page, 'PROGRAM START');
  await expect(page.getByTestId('address-display')).toHaveAttribute('data-address-value', '0000');
  await expect(page.getByTestId('operating-program')).toHaveAttribute('data-lit', 'false', { timeout: 20000 });
});

test('manual transfer read-out from 8000 after setting entry switches', async ({ page }) => {
  await setupFrontPanelManualReadOut(page);
  await setDecimalKnob(page, 'address-digit-0', 8);

  await clickPanelButton(page, 'TRANSFER');
  await expect(page.getByTestId('address-display')).toHaveAttribute('data-address-value', '8000');

  await setDecimalKnob(page, 'entry-digit-0', 0);
  await setDecimalKnob(page, 'entry-digit-1', 1);
  await setDecimalKnob(page, 'entry-digit-2', 2);
  await setDecimalKnob(page, 'entry-digit-3', 3);
  await setDecimalKnob(page, 'entry-digit-4', 4);
  await setDecimalKnob(page, 'entry-digit-5', 5);
  await setDecimalKnob(page, 'entry-digit-6', 6);
  await setDecimalKnob(page, 'entry-digit-7', 7);
  await setDecimalKnob(page, 'entry-digit-8', 8);
  await setDecimalKnob(page, 'entry-digit-9', 9);
  await page.getByTestId('entry-sign-knob').getByText('-', { exact: true }).click();

  await clickPanelButton(page, 'PROGRAM START');
  await expect(page.getByTestId('display-section')).toHaveAttribute('data-display-value', '0123456789-');
});

test('emulator console can run and stop a program and show state output', async ({ page }) => {
  const output = await setupEmulatorConsole(page);

  await sendConsoleCommand(page, 'deposit 0 1');
  await sendConsoleCommand(page, 'go');
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();

  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
  await expect(output).toHaveValue(
    /Simulation stopped,\s+IC:\s+(?:00000\s+\(\s+0000000001\+\s+NOOP\s+0000\s+0001\s+\)|00001\s+\(\s+0000000000\+\s+NOOP\s+0000\s+0000\s+\))/m
  );
});

test('console register deposit round-trip and front panel display mapping', async ({ page }) => {
  const output = await setupEmulatorConsole(page);

  await sendConsoleCommand(page, 'examine state');
  await expect(output).toHaveValue(/ACCLO:\s*0000000000\+/);
  await expect(output).toHaveValue(/ACCUP:\s*0000000000\+/);
  await expect(output).toHaveValue(/PR:\s*0000000000\+/);
  await expect(output).toHaveValue(/DIST:\s*0000000000\+/);
  await expect(output).toHaveValue(/AR:\s*00000/);
  await expect(output).toHaveValue(/CSW:\s*0000000000\+/);
  await expect(output).toHaveValue(/OV:\s*0/);
  await expect(output).toHaveValue(/CSWPS:\s*1/);
  await expect(output).toHaveValue(/CSWOS:\s*0/);
  await expect(output).toHaveValue(/HALF:\s*0/);

  await sendConsoleCommand(page, 'deposit ACCLO 0123456789+');
  await sendConsoleCommand(page, 'deposit ACCUP 9876543210-');
  await sendConsoleCommand(page, 'deposit PR 0246813579-');
  await sendConsoleCommand(page, 'deposit DIST 0123498765+');
  await sendConsoleCommand(page, 'deposit AR 02468');
  await sendConsoleCommand(page, 'deposit CSW 0918273645-');
  await sendConsoleCommand(page, 'deposit OV 1');
  await sendConsoleCommand(page, 'deposit CSWPS 0');
  await sendConsoleCommand(page, 'deposit CSWOS 1');
  await sendConsoleCommand(page, 'deposit HALF 1');

  await sendConsoleCommand(page, 'examine state');
  await expect(output).toHaveValue(/ACCLO:\s*0123456789\+/);
  await expect(output).toHaveValue(/ACCUP:\s*9876543210-/);
  await expect(output).toHaveValue(/PR:\s*0246813579-/);
  await expect(output).toHaveValue(/DIST:\s*0123498765\+/);
  await expect(output).toHaveValue(/AR:\s*02468/);
  await expect(output).toHaveValue(/CSW:\s*0918273645-/);
  await expect(output).toHaveValue(/OV:\s*1/);
  await expect(output).toHaveValue(/CSWPS:\s*0/);
  await expect(output).toHaveValue(/CSWOS:\s*1/);
  await expect(output).toHaveValue(/HALF:\s*1/);

  await page.getByRole('link', { name: 'Front Panel' }).click();
  await expect(page).toHaveURL(/\/front-panel\/?$/);

  await expect(page.getByTestId('entry-section')).toHaveAttribute('data-entry-value', '0918273645-');
  await expect(page.getByTestId('address-display')).toHaveAttribute('data-address-value', /0?2468/);
  await expect(page.getByTestId('programmed-knob')).toHaveAttribute('data-current-label', 'RUN');
  await expect(page.getByTestId('half-cycle-knob')).toHaveAttribute('data-current-label', 'HALF');
  await expect(page.getByTestId('overflow-knob')).toHaveAttribute('data-current-label', 'STOP');

  await page.getByTestId('display-knob').getByText('LOWER ACCUM').click();
  await expect(page.getByTestId('display-section')).toHaveAttribute('data-display-value', '0123456789+');

  await page.getByTestId('display-knob').getByText('UPPER ACCUM').click();
  await expect(page.getByTestId('display-section')).toHaveAttribute('data-display-value', '9876543210-');

  await page.getByTestId('display-knob').getByText('DISTRIBUTOR').click();
  await expect(page.getByTestId('display-section')).toHaveAttribute('data-display-value', '0123498765+');

  await page.getByTestId('display-knob').getByText('PROGRAM REGISTER').click();
  await expect(page.getByTestId('display-section')).toHaveAttribute('data-display-value', '0246813579-');

  await page.getByTestId('display-knob').locator('span').filter({ hasText: /READ.?OUT STORAGE/ }).click();
  await expect(page.getByTestId('display-section')).toHaveAttribute('data-display-value', '0123498765+');

  await page.getByTestId('display-knob').locator('span').filter({ hasText: /READ.?IN STORAGE/ }).click();
  await expect(page.getByTestId('display-section')).toHaveAttribute('data-display-value', '0123498765+');

  await page.getByRole('link', { name: 'Emulator' }).click();
  await expect(page).toHaveURL(/\/emulator\/?$/);
  await sendConsoleCommand(page, 'examine state');
  await expectConsoleState(output, {
    ACCLO: '0123456789+',
    ACCUP: '9876543210-',
    PR: '0246813579-',
    DIST: '0123498765+',
    AR: '02468',
    CSW: '0918273645-',
    OV: '1',
    CSWPS: '0',
    CSWOS: '1',
    HALF: '1',
  });

  await page.getByRole('link', { name: 'Front Panel' }).click();
  await expect(page).toHaveURL(/\/front-panel\/?$/);
  await expect(page.getByTestId('entry-section')).toHaveAttribute('data-entry-value', '0918273645-');
});

test('emulator console runs i650_test.ini from /tests and reports success', async ({ page }) => {
  test.setTimeout(120000);
  const output = await setupEmulatorConsole(page);

  await sendConsoleCommand(page, 'cd /tests');
  await sendConsoleCommand(page, 'do i650_test.ini');
  await expect(output).toHaveValue(/All Tests Passed/i, { timeout: 90000 });
});

test('program reset stops execution and clears PR and AR', async ({ page }) => {
  const output = await setupEmulatorConsole(page);

  await sendConsoleCommand(page, 'deposit 0 1');
  await sendConsoleCommand(page, 'go');
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();

  await page.getByRole('link', { name: 'Front Panel' }).click();
  await clickPanelButton(page, 'PROGRAM RESET');
  await expect(page.getByTestId('operating-program')).toHaveAttribute('data-lit', 'false');

  await page.getByRole('link', { name: 'Emulator' }).click();
  await sendConsoleCommand(page, 'examine state');
  await expectConsoleState(output, {
    PR: '0000000000+',
    AR: '00000',
  });
});

test('computer reset stops execution and restores baseline register values', async ({ page }) => {
  const output = await setupEmulatorConsole(page);

  await sendConsoleCommand(page, 'deposit 0 1');
  await sendConsoleCommand(page, 'deposit OV 1');
  await sendConsoleCommand(page, 'go');
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();

  await page.getByRole('link', { name: 'Front Panel' }).click();
  await clickPanelButton(page, 'COMPUTER RESET');
  await expect(page.getByTestId('operating-program')).toHaveAttribute('data-lit', 'false');

  await page.getByRole('link', { name: 'Emulator' }).click();
  await sendConsoleCommand(page, 'examine state');
  // Computer reset issues SIMH RESET and should restore baseline register values.
  await expectConsoleState(output, {
    AR: '00000',
    OV: '0',
  });
});

test('emulator reset clears console output and keeps console usable', async ({ page }) => {
  const output = await setupEmulatorConsole(page);

  await sendConsoleCommand(page, 'deposit ACCLO 123+');
  await sendConsoleCommand(page, 'examine state');
  await expect(output).toHaveValue(/ACCLO:\s*0000000123\+/);

  await page.getByRole('link', { name: 'Front Panel' }).click();
  await clickPanelButtonDom(page, 'MASTER RESET');
  await page.getByRole('link', { name: 'Emulator' }).click();
  await expect(output).toHaveValue('');
  await sendConsoleCommand(page, 'examine state');
  await expect(output).toHaveValue(/ACCLO:\s*0000000123\+/);
});

test('display selector changes visible value without mutating register state', async ({ page }) => {
  const output = await setupEmulatorConsole(page);

  await sendConsoleCommand(page, 'deposit ACCLO 1122334455+');
  await sendConsoleCommand(page, 'deposit ACCUP 5566778899-');
  await sendConsoleCommand(page, 'deposit PR 0246813579-');
  await sendConsoleCommand(page, 'deposit DIST 1029384756+');

  await page.getByRole('link', { name: 'Front Panel' }).click();
  await expect(page).toHaveURL(/\/front-panel\/?$/);

  await page.getByTestId('display-knob').getByText('LOWER ACCUM').click();
  await expect(page.getByTestId('display-section')).toHaveAttribute('data-display-value', '1122334455+');

  await page.getByTestId('display-knob').getByText('UPPER ACCUM').click();
  await expect(page.getByTestId('display-section')).toHaveAttribute('data-display-value', '5566778899-');

  await page.getByTestId('display-knob').getByText('PROGRAM REGISTER').click();
  await expect(page.getByTestId('display-section')).toHaveAttribute('data-display-value', '0246813579-');

  await page.getByTestId('display-knob').getByText('DISTRIBUTOR').click();
  await expect(page.getByTestId('display-section')).toHaveAttribute('data-display-value', '1029384756+');

  await page.getByRole('link', { name: 'Emulator' }).click();
  await sendConsoleCommand(page, 'examine state');
  await expectConsoleState(output, {
    ACCLO: '1122334455+',
    ACCUP: '5566778899-',
    PR: '0246813579-',
    DIST: '1029384756+',
  });
});

test('transfer only updates AR in manual operation mode', async ({ page }) => {
  const output = await setupEmulatorConsole(page);
  await sendConsoleCommand(page, 'deposit AR 00000');

  await page.getByRole('link', { name: 'Front Panel' }).click();
  await setDecimalKnob(page, 'address-digit-0', 4);
  await setDecimalKnob(page, 'address-digit-1', 3);
  await setDecimalKnob(page, 'address-digit-2', 2);
  await setDecimalKnob(page, 'address-digit-3', 1);

  await page.getByTestId('control-knob').getByText(/^RUN$/).click();
  await clickPanelButton(page, 'TRANSFER');
  await expect(page.getByTestId('address-display')).toHaveAttribute('data-address-value', '0000');

  await page.getByTestId('control-knob').getByText('ADDRESS STOP').click();
  await clickPanelButton(page, 'TRANSFER');
  await expect(page.getByTestId('address-display')).toHaveAttribute('data-address-value', '0000');

  await page.getByTestId('control-knob').getByText('MANUAL OPERATION').click();
  await clickPanelButton(page, 'TRANSFER');
  await expect(page.getByTestId('address-display')).toHaveAttribute('data-address-value', '4321');

  await page.getByRole('link', { name: 'Emulator' }).click();
  await sendConsoleCommand(page, 'examine state');
  await expectConsoleState(output, { AR: '04321' });
});

test('console command errors are shown and console remains usable', async ({ page }) => {
  const output = await setupEmulatorConsole(page);

  await sendConsoleCommand(page, 'deposit AR ABC');
  await expect(output).toHaveValue(/(Invalid|error|non-existent|must|Value)/i);

  await sendConsoleCommand(page, 'examine state');
  await expect(output).toHaveValue(/ACCLO:\s*0000000000\+/);
});

test('manual read-in writes memory and manual read-out reads it back', async ({ page }) => {
  await setupFrontPanelManualReadIn(page);

  await setDecimalKnob(page, 'address-digit-0', 8);
  await setDecimalKnob(page, 'address-digit-1', 1);
  await setDecimalKnob(page, 'address-digit-2', 2);
  await setDecimalKnob(page, 'address-digit-3', 3);

  await setDecimalKnob(page, 'entry-digit-0', 1);
  await setDecimalKnob(page, 'entry-digit-1', 2);
  await setDecimalKnob(page, 'entry-digit-2', 3);
  await setDecimalKnob(page, 'entry-digit-3', 4);
  await setDecimalKnob(page, 'entry-digit-4', 5);
  await setDecimalKnob(page, 'entry-digit-5', 6);
  await setDecimalKnob(page, 'entry-digit-6', 7);
  await setDecimalKnob(page, 'entry-digit-7', 8);
  await setDecimalKnob(page, 'entry-digit-8', 9);
  await setDecimalKnob(page, 'entry-digit-9', 0);
  await clickPanelButton(page, 'PROGRAM START');
  await expect(page.getByTestId('display-section')).toHaveAttribute('data-display-value', '1234567890+');

  await setDecimalKnob(page, 'entry-digit-0', 9);
  await setDecimalKnob(page, 'entry-digit-1', 9);
  await setDecimalKnob(page, 'entry-digit-2', 9);
  await setDecimalKnob(page, 'entry-digit-3', 9);
  await setDecimalKnob(page, 'entry-digit-4', 9);
  await setDecimalKnob(page, 'entry-digit-5', 9);
  await setDecimalKnob(page, 'entry-digit-6', 9);
  await setDecimalKnob(page, 'entry-digit-7', 9);
  await setDecimalKnob(page, 'entry-digit-8', 9);
  await setDecimalKnob(page, 'entry-digit-9', 9);

  await page.getByTestId('display-knob').locator('span').filter({ hasText: /READ.?OUT STORAGE/ }).click();
  await clickPanelButton(page, 'PROGRAM START');
  await expect(page.getByTestId('display-section')).toHaveAttribute('data-display-value', '1234567890+');
});

test('programmed stop and overflow stop conditions are surfaced in console output', async ({ page }) => {
  const output = await setupEmulatorConsole(page);
  const PROGRAMMED_STOP_WORD = '0100000001+';

  await sendConsoleCommand(page, `deposit 0 ${PROGRAMMED_STOP_WORD}`);
  await sendConsoleCommand(page, 'deposit CSWPS 1');
  await sendConsoleCommand(page, 'go');
  await expect(output).toHaveValue(/Programmed Stop/i, { timeout: 20000 });

  await sendConsoleCommand(page, 'deposit 0 1');
  await sendConsoleCommand(page, 'deposit OV 1');
  await sendConsoleCommand(page, 'deposit CSWPS 0');
  await sendConsoleCommand(page, 'deposit CSWOS 1');
  await sendConsoleCommand(page, 'go');
  await expect(output).toHaveValue(/Overflow/i, { timeout: 20000 });
});

test('front panel ARIA roles and labels are present', async ({ page }) => {
  await page.goto('/front-panel');

  // Labeled knobs have slider role with aria-label
  const controlKnob = page.getByTestId('control-knob');
  await expect(controlKnob).toHaveRole('slider');
  await expect(controlKnob).toHaveAttribute('aria-label', 'Control');
  await expect(controlKnob).toHaveAttribute('aria-valuetext', /RUN|MANUAL OPERATION|ADDRESS STOP/);

  const displayKnob = page.getByTestId('display-knob');
  await expect(displayKnob).toHaveRole('slider');
  await expect(displayKnob).toHaveAttribute('aria-label', 'Display');

  const programmedKnob = page.getByTestId('programmed-knob');
  await expect(programmedKnob).toHaveRole('slider');
  await expect(programmedKnob).toHaveAttribute('aria-label', 'Programmed');

  // Decimal knobs have spinbutton role
  const entryDigit0 = page.getByTestId('entry-digit-0');
  await expect(entryDigit0).toHaveRole('spinbutton');
  await expect(entryDigit0).toHaveAttribute('aria-valuemin', '0');
  await expect(entryDigit0).toHaveAttribute('aria-valuemax', '9');

  // Operating status has group role
  const operatingGroup = page.getByRole('group', { name: 'Operating status' });
  await expect(operatingGroup).toBeVisible();

  // Checking status has group role
  const checkingGroup = page.getByRole('group', { name: 'Checking status' });
  await expect(checkingGroup).toBeVisible();

  // All control buttons have type="button"
  const buttons = page.locator('button[type="button"]');
  const transferButton = buttons.filter({ hasText: 'TRANSFER' });
  await expect(transferButton).toBeVisible();
});

test('keyboard navigation works on labeled knobs', async ({ page }) => {
  await page.goto('/front-panel');

  // Focus the programmed knob (STOP/RUN) and use arrow keys
  const programmedKnob = page.getByTestId('programmed-knob');
  await expect(programmedKnob).toHaveAttribute('data-current-label', 'RUN');

  await programmedKnob.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(programmedKnob).toHaveAttribute('data-current-label', 'STOP');

  await page.keyboard.press('ArrowRight');
  await expect(programmedKnob).toHaveAttribute('data-current-label', 'RUN');

  // Home and End keys on the control knob (3 positions)
  const controlKnob = page.getByTestId('control-knob');
  await controlKnob.focus();
  await page.keyboard.press('End');
  await expect(controlKnob).toHaveAttribute('data-current-label', 'MANUAL OPERATION');

  await page.keyboard.press('Home');
  await expect(controlKnob).toHaveAttribute('data-current-label', 'ADDRESS STOP');
});

test('keyboard navigation works on decimal knobs', async ({ page }) => {
  await page.goto('/front-panel');

  const digit0 = page.getByTestId('entry-digit-0');
  const digit1 = page.getByTestId('entry-digit-1');
  await digit0.focus();

  // Initial value should be 0
  await expect(digit0).toHaveAttribute('aria-valuenow', '0');

  // ArrowUp increments
  await page.keyboard.press('ArrowUp');
  await expect(digit0).toHaveAttribute('aria-valuenow', '1');

  // ArrowDown decrements
  await page.keyboard.press('ArrowDown');
  await expect(digit0).toHaveAttribute('aria-valuenow', '0');

  // Digit key directly sets value
  await page.keyboard.press('5');
  await expect(digit0).toHaveAttribute('aria-valuenow', '5');
  await expect(digit1).toBeFocused();

  // Refocus first knob for wrap-around checks.
  await digit0.focus();

  // Wraps around: ArrowDown from 0 goes to 9
  await page.keyboard.press('0');
  await expect(digit0).toHaveAttribute('aria-valuenow', '0');
  await digit0.focus();
  await page.keyboard.press('ArrowDown');
  await expect(digit0).toHaveAttribute('aria-valuenow', '9');
});

test('yield steps control remains usable across navigation', async ({ page }) => {
  const output = await setupEmulatorConsole(page);
  const yieldInput = page.locator('#yield-steps');

  // Ensure simulator init has completed before changing advanced options.
  await sendConsoleCommand(page, 'examine state');
  await page.evaluate(() => {
    const input = document.querySelector<HTMLInputElement>('#yield-steps');
    if (!input) throw new Error('yield-steps input not found');
    input.value = '777';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  // This test verifies control usability/navigation; it does not assert persisted yield configuration semantics.
  await expect(yieldInput).toHaveValue('777');

  await page.getByRole('link', { name: 'Front Panel' }).click();
  await expect(page).toHaveURL(/\/front-panel\/?$/);
  await page.getByRole('link', { name: 'Emulator' }).click();

  await expect(page.locator('#yield-steps')).toBeVisible();
  await sendConsoleCommand(page, 'examine state');
  await expect(output).toHaveValue(/IC:\s*00000/);
});
