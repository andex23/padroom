import { test, expect } from "@playwright/test";
test("public browse, responsive navigation and brand font", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Browse", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("searchbox")).toBeVisible();
  await page.getByRole("searchbox").fill("No inventory matches this 917324");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=No/);
  await expect(
    page.getByRole("heading", {
      name: /No matching listings|Connect the marketplace database/,
    }),
  ).toBeVisible();
  const brand = await page.evaluate(async () => {
    await document.fonts.load('12px "Paper Mono"');
    return {
      loaded: document.fonts.check('12px "Paper Mono"'),
      overflow: document.documentElement.scrollWidth > innerWidth,
      bg: getComputedStyle(document.body).backgroundColor,
    };
  });
  expect(brand.loaded).toBe(true);
  expect(brand.overflow).toBe(false);
  expect(brand.bg).toBe("rgb(243, 242, 238)");
  await page.waitForTimeout(300);
  await page.screenshot({
    path: `/tmp/padroom-${test.info().project.name}.png`,
    fullPage: true,
  });
});
test("private routes require real authentication", async ({ page }) => {
  for (const path of ["/saved", "/messages", "/sell/new", "/admin"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/sign-in/);
  }
});
test("pilot copy and no simulated checkout", async ({ page }) => {
  await page.goto("/how-it-works");
  await expect(
    page.getByText(
      "PADROOM does not currently hold funds or guarantee transactions.",
      { exact: false },
    ),
  ).toBeVisible();
});
test("cross-origin mutations are rejected", async ({ request }) => {
  const response = await request.post("/api/command", {
    headers: { origin: "https://evil.example" },
    form: { command: "sign-out" },
  });
  expect(response.status()).toBe(403);
});

test("filters, search and immediate sorting preserve the selected inventory query", async ({
  page,
}) => {
  await page.goto("/?category=Consoles");
  const toggle = page.getByRole("button", { name: "Filters & sort" });
  if (await toggle.isVisible()) await toggle.click();
  await page.getByLabel("Location", { exact: true }).selectOption("Lagos");
  await page.getByLabel("Minimum price (₦)", { exact: true }).fill("1000");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/city=Lagos/);
  await expect(page).toHaveURL(/category=Consoles/);
  await page.getByRole("searchbox").fill("PlayStation");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/q=PlayStation/);
  await expect(page).toHaveURL(/city=Lagos/);
  await expect(page).toHaveURL(/min=1000/);
  await page
    .getByLabel("Sort by", { exact: true })
    .selectOption("Price: low to high");
  await expect
    .poll(() => new URL(page.url()).searchParams.get("sort"))
    .toBe("Price: low to high");
  await expect(page).toHaveURL(/q=PlayStation/);
  await page
    .getByRole("navigation", { name: "Categories" })
    .getByRole("link", { name: "Controllers", exact: true })
    .click();
  await expect(page).toHaveURL(/category=Controllers/);
  await expect(page).toHaveURL(/city=Lagos/);
  await page
    .getByRole("link", { name: "Remove Lagos filter", exact: true })
    .click();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("city"))
    .toBeNull();
  await expect(page).toHaveURL(/category=Controllers/);
});

test("the catalogue and account shell fit every required viewport", async ({
  page,
}) => {
  for (const width of [375, 430, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("searchbox")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.goto("/sign-in");
    await expect(
      page.getByRole("heading", { name: "Sign in", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
