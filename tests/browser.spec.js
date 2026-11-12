import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { db, makeAccount, password } from './emulatorFixture.mjs';

const screenshots = process.env.GOGREEN_SCREENSHOT_DIR;
const baseline = process.env.GOGREEN_BASELINE_URL;
const eventId = 'browser-test-event';
const postId = 'browser-test-post';
const publicRoutes = [
  ['home', '/', /green steps/i], ['about', '/about', /about.*club/i],
  ['events', '/events', /join our events/i], ['blog', '/blog', /GoGreen Club Blog/i],
];

let memberEmail, adminEmail;
test.beforeAll(async () => {
  [memberEmail, adminEmail] = await Promise.all([
    makeAccount('browser-member'), makeAccount('browser-admin', true),
  ]);
  await Promise.all([
    db.doc(`events/${eventId}`).set({
      title: 'Emulator event fixture', isPublic: true, status: 'upcoming', date: '2090-07-20',
      location: 'Local test venue', description: 'This record exists only in the Firebase emulator.',
      registeredCount: 0, maxParticipants: 4, category: 'cleanup',
    }),
    db.doc(`posts/${postId}`).set({
      title: 'Emulator article fixture', isPublished: true, authorName: 'Test author',
      content: 'This article exists only in the Firebase emulator.', createdAt: new Date(), tags: ['Cleanup'],
    }),
  ]);
});

async function signIn(page, email, origin = '') {
  await page.goto(`${origin}/login`);
  await page.getByPlaceholder('Email', { exact: true }).fill(email);
  await page.getByPlaceholder('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: /^(sign in|login|log in)$/i }).click();
  await expect(page).toHaveURL(/\/(member|admin)$/);
}

async function capture(page, name) {
  if (!screenshots) return;
  await mkdir(screenshots, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(screenshots, name + '.png'), animations: 'disabled' });
}

async function hasNoOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
}

test('public routes fit mobile, tablet, and desktop with labeled navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
    for (const [name, path, heading] of publicRoutes) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      await hasNoOverflow(page);
      if ([390, 1280].includes(width)) await capture(page, `after-${name}-${width}`);
    }
    if (width < 500) {
      const toggle = page.getByRole('button', { name: 'Open menu' });
      await toggle.click();
      await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Events' })).toBeVisible();
      if (width === 390) await capture(page, 'after-mobile-menu-390');
      await page.keyboard.press('Escape');
      await expect(toggle).toBeFocused();
    }
  }
});

test('keyboard event details trap focus, dismiss on Escape, and restore focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/events');
  const button = page.getByRole('button', { name: /details for Emulator event fixture/i });
  await button.focus();
  await page.keyboard.press('Enter');
  const modal = page.getByRole('dialog', { name: 'Emulator event fixture' });
  await expect(modal).toBeVisible();
  await page.keyboard.press('Tab');
  expect(await modal.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await capture(page, 'after-event-dialog-390');
  const deepLink = page.url();
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(button).toBeFocused();
  await page.goto(deepLink);
  await expect(modal).toBeVisible();
});

test('blog card links and article deep links work after refresh', async ({ page }) => {
  await page.goto('/blog');
  await page.getByRole('link', { name: 'Read More' }).first().click();
  await expect(page).toHaveURL(new RegExp('/blog/' + postId));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Emulator article fixture' })).toBeVisible();
});

test('member can register, see the event, cancel, and access the mobile dashboard menu', async ({ page }) => {
  await signIn(page, memberEmail);
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
    await expect(page.getByRole('heading', { name: 'Test Member' })).toBeVisible();
    await hasNoOverflow(page);
    if ([390, 1280].includes(width)) await capture(page, `after-member-${width}`);
    if (width === 390) {
      await page.getByRole('button', { name: 'Open dashboard navigation' }).click();
      await expect(page.getByRole('dialog', { name: 'Impact Hub' })).toBeVisible();
      await capture(page, 'after-member-menu-390');
      await page.keyboard.press('Escape');
    }
  }
  await page.goto(`/events?event=${eventId}`);
  const modal = page.getByRole('dialog');
  await modal.getByRole('button', { name: /register for event/i }).click();
  await expect(modal).toBeHidden();
  await page.goto('/member/events');
  await expect(page.getByText('Emulator event fixture').first()).toBeVisible();
  await page.goto(`/events?event=${eventId}`);
  await modal.getByRole('button', { name: /unregister|cancel registration/i }).click();
  await expect(modal).toBeHidden();
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Administrator access required' })).toBeVisible();
});

test('admin dashboard, form and confirmation are usable on narrow screens', async ({ page }) => {
  await signIn(page, adminEmail);
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
    await expect(page.getByRole('heading', { name: 'Command Center' })).toBeVisible();
    await hasNoOverflow(page);
    if ([390, 1280].includes(width)) await capture(page, `after-admin-${width}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin/events');
  await page.getByRole('button', { name: /new event|add event|create event/i }).click();
  await expect(page.getByLabel(/event title/i)).toBeVisible();
  await hasNoOverflow(page);
  await capture(page, 'after-admin-event-form-390');
  await page.getByRole('button', { name: /^(cancel|close)$/i }).first().click();
  await page.getByRole('button', { name: 'Delete', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await capture(page, 'after-confirmation-390');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('administrator creates an event and publishes a draft through the CMS', async ({ page, browser }) => {
  await signIn(page, adminEmail);
  await page.goto('/admin/events');
  await page.getByRole('button', { name: /create event/i }).click();
  await page.getByLabel(/event title/i).fill('Admin-created emulator event');
  await page.getByLabel(/description/i).fill('Local verification only.');
  await page.getByLabel(/event date/i).fill('2091-05-02');
  await page.getByLabel(/location/i).fill('Local test venue');
  await page.getByRole('button', { name: 'Create Event', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Admin-created emulator event' })).toBeVisible();

  await page.goto('/admin/blog');
  await page.getByRole('button', { name: /new post|create post/i }).click();
  await page.getByLabel('Title', { exact: true }).fill('Admin-created emulator article');
  await page.getByLabel('Author', { exact: true }).fill('Local tester');
  await page.getByLabel('Content', { exact: true }).fill('Local verification only.');
  await page.getByRole('button', { name: 'Create Post', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Admin-created emulator article' })).toBeVisible();

  const visitor = await browser.newPage();
  try {
    await visitor.goto('/blog');
    await expect(visitor.getByRole('heading', { name: 'Emulator article fixture' })).toBeVisible();
    await expect(visitor.getByRole('heading', { name: 'Admin-created emulator article' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Set Draft', exact: true })).toHaveCount(2);
    await visitor.reload();
    await expect(visitor.getByRole('heading', { name: 'Admin-created emulator article' })).toBeVisible();
  } finally {
    await visitor.close();
    for (const [collection, title] of [
      ['events', 'Admin-created emulator event'], ['posts', 'Admin-created emulator article'],
    ]) {
      const fixtures = await db.collection(collection).where('title', '==', title).get();
      await Promise.all(fixtures.docs.map(doc => doc.ref.delete()));
    }
  }
});

test('public pages and the event dialog pass automated accessibility checks', async ({ page }) => {
  for (const [, path, heading] of publicRoutes) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(scan.violations.map(({ id, nodes }) => [id, nodes.map(node => [node.target, node.failureSummary])])).toEqual([]);
  }
  await page.goto(`/events?event=${eventId}`);
  await expect(page.getByRole('dialog')).toBeVisible();
  const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(scan.violations.map(({ id, nodes }) => [id, nodes.map(node => [node.target, node.failureSummary])])).toEqual([]);
});

test('email signup and profile completion work with the Auth trigger', async ({ page }) => {
  await page.goto('/signup');
  await page.getByRole('textbox', { name: 'Email' }).fill('browser-new@example.test');
  await page.getByPlaceholder(/Password/).fill(password);
  await page.getByRole('button', { name: /sign up|create account/i }).first().click();
  await expect(page).toHaveURL(/\/welcome$/);
  await page.getByRole('textbox', { name: 'Full Name' }).fill('New Test Member');
  await page.getByRole('textbox', { name: 'Branch/Department' }).fill('Local test');
  await page.getByRole('textbox', { name: /Interests/ }).fill('Recycling, Planting');
  await page.getByRole('button', { name: 'Get Started' }).click();
  await expect(page.getByRole('heading', { name: 'New Test Member' })).toBeVisible();
});

test('capture baseline routes from the audited commit', async ({ browser }) => {
  test.skip(!baseline || !screenshots, 'Baseline capture is optional.');
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      for (const [name, path] of publicRoutes) {
        await page.goto(baseline + path);
        await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
        await capture(page, `before-${name}-${width}`);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(baseline + '/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await capture(page, 'before-mobile-menu-390');
    await page.goto(baseline + `/events?event=${eventId}`);
    await expect(page.getByRole('heading', { level: 2, name: 'Emulator event fixture' })).toBeVisible();
    await capture(page, 'before-event-dialog-390');
    await signIn(page, memberEmail, baseline);
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      for (const [name, path] of [['member', '/member']]) {
        await page.goto(baseline + path);
        await expect(page.getByText('Test Member', { exact: true })).toBeVisible();
        await capture(page, `before-${name}-${width}`);
      }
      if (width === 390) {
        await page.getByRole('button', { name: 'Open navigation' }).click();
        await capture(page, 'before-member-menu-390');
        await page.getByRole('button', { name: 'Close navigation' }).click();
      }
    }
    await context.clearCookies();
    await page.goto(baseline);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      indexedDB.deleteDatabase('firebaseLocalStorageDb');
    });
    await context.close();
    const adminPage = await browser.newPage({ reducedMotion: 'reduce' });
    await signIn(adminPage, adminEmail, baseline);
    for (const width of [390, 1280]) {
      await adminPage.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await adminPage.goto(baseline + '/admin');
      await expect(adminPage.getByRole('heading', { name: 'Command Center' }).first()).toBeVisible();
      await capture(adminPage, `before-admin-${width}`);
    }
    await adminPage.setViewportSize({ width: 390, height: 844 });
    await adminPage.goto(baseline + '/admin/events');
    await adminPage.getByRole('button', { name: /create event/i }).click();
    await expect(adminPage.getByRole('heading', { name: 'Create New Event' })).toBeVisible();
    await capture(adminPage, 'before-admin-event-form-390');
    await adminPage.getByRole('button', { name: 'Cancel', exact: true }).click();
    await adminPage.getByRole('button', { name: 'Delete', exact: true }).first().click();
    await expect(adminPage.getByRole('heading', { name: 'Delete this event?' })).toBeVisible();
    await capture(adminPage, 'before-confirmation-390');
    await adminPage.close();
  } finally {
    await context.close();
  }
});
