import { test as base, expect, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import sharp from "sharp";

const sql = (query: string) =>
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      "supabase_db_padroom",
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-At",
      "-c",
      query,
    ],
    { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
  ).trim();

type Marketplace = { seller: Page; buyer: Page; admin: Page; token: string };
const test = base.extend<{ marketplace: Marketplace }>({
  marketplace: async ({ browser, viewport }, provide) => {
    expect(
      existsSync(".env.local"),
      "Isolated local Supabase is required; this journey must not silently skip.",
    ).toBe(true);
    const configuration = readFileSync(".env.local", "utf8");
    const url =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      configuration
        .match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]
        .replace(/^"|"$/g, "");
    expect(["localhost", "127.0.0.1"]).toContain(
      new URL(url || "https://invalid.example").hostname,
    );
    const token = crypto.randomUUID();
    const emails = ["seller", "buyer", "admin"].map(
      (role) => `management-${role}-${token}@example.test`,
    );
    const password = crypto.randomUUID() + "aA1!";
    const contexts = await Promise.all(
      emails.map(() =>
        browser.newContext({ baseURL: "http://localhost:3000", viewport }),
      ),
    );
    const [seller, buyer, admin] = await Promise.all(
      contexts.map((c) => c.newPage()),
    );
    try {
      for (const [i, page] of [seller, buyer, admin].entries()) {
        await page.goto("/sign-up");
        await page
          .getByLabel("Display name", { exact: true })
          .fill(`Management ${["seller", "buyer", "admin"][i]}`);
        await page
          .getByLabel("Email (kept private)", { exact: true })
          .fill(emails[i]);
        await page
          .getByLabel("Password (at least 10 characters)", { exact: true })
          .fill(password);
        await page.getByRole("checkbox").check();
        await page
          .getByRole("button", { name: "Create account", exact: true })
          .click();
        await expect(page).toHaveURL(/\/account$/);
      }
      sql(
        `insert into public.admin_members(user_id) select id from auth.users where email='${emails[2]}';`,
      );
      await provide({ seller, buyer, admin, token });
    } finally {
      const users = `select id from auth.users where email in (${emails.map((email) => `'${email}'`).join(",")})`;
      sql(
        `update public.listings set status='draft' where seller_id in (${users}); update public.profiles set suspended_at=null where id in (${users});`,
      );
      for (const [i, page] of [seller, buyer].entries()) {
        const images = sql(
          `select i.id from public.listing_images i join public.listings l on l.id=i.listing_id where l.seller_id=(select id from auth.users where email='${emails[i]}');`,
        )
          .split("\n")
          .filter(Boolean);
        for (const id of images) {
          const result = await page.request.post("/api/command", {
            headers: { origin: "http://localhost:3000" },
            multipart: { command: "remove-image", id },
          });
          expect(result.ok(), "Local fixture photo cleanup").toBe(true);
        }
      }
      sql(
        `begin; delete from public.moderation_events where admin_id in (${users}); delete from public.reports where reporter_id in (${users}); delete from public.messages where sender_id in (${users}); delete from public.offers where buyer_id in (${users}) or seller_id in (${users}); delete from public.conversations where buyer_id in (${users}) or seller_id in (${users}); delete from public.saved_listings where user_id in (${users}); delete from public.listing_images where listing_id in (select id from public.listings where seller_id in (${users})); delete from public.listings where seller_id in (${users}); delete from auth.users where id in (${users}); commit;`,
      );
      await Promise.all(contexts.map((context) => context.close()));
    }
  },
});

async function draft(page: Page, title: string) {
  await page.goto("/sell/new");
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.getByLabel("Price (₦)", { exact: true }).fill("65000");
  await page
    .getByLabel("Description (20–5000 characters)", { exact: true })
    .fill(
      "Local verification equipment, owned by this temporary test account.",
    );
  await page
    .getByLabel("Known defects (write ‘None’ if none)", { exact: true })
    .fill("None");
  await page
    .getByRole("textbox", { name: "What’s included", exact: true })
    .fill("Original cable");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Save draft & add photos" }).click();
  await expect(page).toHaveURL(/\/sell\/[\w-]+\/edit$/);
  return page.url().split("/")[4];
}

async function upload(page: Page, size?: number) {
  const image = await sharp({
    create: { width: 160, height: 200, channels: 3, background: "#dddddd" },
  })
    .png()
    .toBuffer();
  const buffer = size
    ? Buffer.concat([image, Buffer.alloc(size - image.length)])
    : image;
  await page.getByLabel("Add a photo").setInputFiles({
    name: "local-verification.png",
    mimeType: "image/png",
    buffer,
  });
  await page.getByRole("button", { name: "Upload photo", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Photo added." }),
  ).toBeVisible();
  await expect(page.getByRole("img")).toBeVisible();
}

async function submit(page: Page) {
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page).toHaveURL(/\/my-listings$/);
}

async function approve(admin: Page, title: string) {
  await admin.goto("/admin");
  const review = admin
    .locator("article")
    .filter({ has: admin.getByRole("link", { name: title, exact: true }) });
  await review
    .getByRole("button", { name: "Approve listing", exact: true })
    .click();
  await expect(
    review.getByText("active / Seller", { exact: false }),
  ).toBeVisible();
}

async function capture(page: Page, step: string) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `test-results/verification-${test.info().project.name}-${step}.png`,
    fullPage: true,
  });
}

test("seller photo/edit lifecycle and report moderation", async ({
  marketplace: { seller, buyer, admin, token },
}) => {
  test.setTimeout(180000);
  const title = `[LOCAL TEST] Managed equipment ${token.slice(0, 8)}`;
  const id = await draft(seller, title);
  await seller.getByRole("button", { name: "Submit for review" }).click();
  await expect(seller.locator("main").getByRole("alert")).toContainText(
    "Add at least one photo",
  );
  await seller.getByLabel("Add a photo").setInputFiles({
    name: "invalid-photo.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from("<html>This is not a photo</html>"),
  });
  await seller
    .getByRole("button", { name: "Upload photo", exact: true })
    .click();
  await expect(
    seller
      .locator("main")
      .getByRole("alert")
      .filter({ hasText: /unsupported image format|Invalid photo content/ }),
  ).toBeVisible();
  await expect(seller.getByRole("img")).toHaveCount(0);
  await expect(seller.getByText("1–8 photos.", { exact: false })).toContainText(
    "up to 4 MB each",
  );
  const tooLarge = Buffer.alloc(4_000_001);
  await seller.getByLabel("Add a photo").setInputFiles({
    name: "too-large.png",
    mimeType: "image/png",
    buffer: tooLarge,
  });
  const uploadRequest = seller
    .waitForRequest(
      (request) =>
        request.method() === "POST" && request.url().endsWith("/api/command"),
      { timeout: 1500 },
    )
    .then(
      () => true,
      () => false,
    );
  await seller
    .getByRole("button", { name: "Upload photo", exact: true })
    .click();
  await expect(
    seller
      .locator("main")
      .getByRole("alert")
      .filter({ hasText: "Choose a photo up to 4 MB." }),
  ).toBeVisible();
  await expect(
    seller.getByRole("button", { name: "Upload photo", exact: true }),
  ).toBeEnabled();
  expect(await uploadRequest, "Oversized photo must never be sent").toBe(false);
  await capture(seller, "11-upload-limit");
  // A caller bypassing the browser must also be rejected by the real route.
  const rejected = await seller.request.post("/api/command", {
    headers: { origin: "http://localhost:3000" },
    multipart: {
      command: "upload",
      listing_id: id,
      photo: { name: "too-large.png", mimeType: "image/png", buffer: tooLarge },
    },
  });
  expect(rejected.status()).toBe(413);
  expect((await rejected.json()).error).toBe("Choose a photo up to 4 MB.");
  expect(
    sql(`select count(*) from public.listing_images where listing_id='${id}';`),
  ).toBe("0");
  const acceptedRequest = seller.waitForRequest(
    (request) =>
      request.method() === "POST" && request.url().endsWith("/api/command"),
  );
  // Real decoded PNG, padded to the exact source-byte boundary.
  await upload(seller, 4_000_000);
  const headers = await (await acceptedRequest).allHeaders();
  // Chromium omits Blob-backed binary post data from Playwright's body accessor.
  const transmittedBytes = Number(headers["content-length"]);
  expect(transmittedBytes).toBeGreaterThan(4_000_000);
  expect(transmittedBytes).toBeLessThanOrEqual(4_250_000);
  expect(transmittedBytes).toBeLessThan(4_500_000);
  await seller
    .getByRole("button", { name: "Remove photo", exact: true })
    .click();
  await expect(seller.getByRole("img")).toHaveCount(0);
  await upload(seller);
  await submit(seller);
  await seller.goto(`/sell/${id}/edit`);
  await seller.getByRole("button", { name: "Withdraw from review" }).click();
  await expect(seller).toHaveURL(/\/my-listings$/);
  await seller.goto(`/sell/${id}/edit`);
  await seller
    .getByLabel("Category", { exact: true })
    .selectOption("Controllers");
  await seller
    .getByLabel("Condition", { exact: true })
    .selectOption("Open-box");
  await seller.getByLabel("City", { exact: true }).selectOption("Abuja");
  await seller.getByRole("checkbox").check();
  await seller.getByRole("button", { name: "Save changes as draft" }).click();
  await expect(
    seller.getByRole("status").filter({ hasText: "Saved." }),
  ).toBeVisible();
  await submit(seller);
  await admin.goto("/admin");
  const review = admin
    .locator("article")
    .filter({ has: admin.getByRole("link", { name: title, exact: true }) });
  await review
    .getByLabel("Reason (5–1000 characters)")
    .fill("Please clarify the included cable.");
  await review.getByRole("button", { name: "Reject listing" }).click();
  await expect(review).toHaveCount(0);
  await seller.goto("/my-listings");
  await expect(
    seller.getByText("Review note: Please clarify the included cable.", {
      exact: true,
    }),
  ).toBeVisible();
  await seller.goto(`/sell/${id}/edit`);
  await seller
    .getByRole("textbox", { name: "What’s included", exact: true })
    .fill("Original USB-C cable");
  await seller.getByRole("checkbox").check();
  await seller.getByRole("button", { name: "Save changes as draft" }).click();
  await expect(
    seller.getByRole("status").filter({ hasText: "Saved." }),
  ).toBeVisible();
  await submit(seller);
  await approve(admin, title);
  await buyer.goto(
    `/?category=Controllers&city=Abuja&condition=Open-box&min=65000&max=65000&q=${encodeURIComponent(token.slice(0, 8))}`,
  );
  await expect(
    buyer.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await buyer.goto(`/sell/${id}/edit`);
  await expect(
    buyer.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  await seller.goto(`/sell/${id}/edit`);
  await seller.getByLabel("Price (₦)", { exact: true }).fill("64000");
  await seller.getByRole("checkbox").check();
  await seller.getByRole("button", { name: "Save changes as draft" }).click();
  await expect(
    seller.getByRole("status").filter({ hasText: "Saved." }),
  ).toBeVisible();
  await buyer.goto(`/listings/${id}`);
  await expect(
    buyer.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  await submit(seller);
  await approve(admin, title);
  await buyer.goto(`/listings/${id}`);
  await buyer.getByText("Report this listing", { exact: true }).click();
  await buyer
    .getByLabel("Reason", { exact: true })
    .selectOption("Misleading description");
  await buyer
    .getByLabel("Details (at least 10 characters)")
    .fill("Local verification report: please check the item condition.");
  await buyer.getByRole("button", { name: "Send report", exact: true }).click();
  await expect(
    buyer.getByRole("status").filter({ hasText: "Report sent to moderation." }),
  ).toBeVisible();
  await capture(buyer, "08-report");
  await admin.goto("/admin");
  const report = admin
    .locator("article")
    .filter({ hasText: "Local verification report:" });
  await expect(report).toBeVisible();
  await report.getByRole("button", { name: "Resolve report" }).click();
  await expect(report).toHaveCount(0);
  const profile = admin
    .locator("details")
    .filter({ hasText: /^Management seller / });
  await profile.locator("summary").click();
  await profile
    .getByLabel("Reason", { exact: true })
    .fill("Local verification suspension");
  await profile.getByRole("button", { name: "Suspend account" }).click();
  await expect(profile.locator("summary")).toContainText("Suspended");
  await seller.goto("/account");
  await expect(seller.locator("main").getByRole("alert")).toContainText(
    "This account is suspended",
  );
  await buyer.goto(`/listings/${id}`);
  await expect(
    buyer.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  await profile
    .getByLabel("Reason", { exact: true })
    .fill("Local verification restoration");
  await profile.getByRole("button", { name: "Restore account" }).click();
  await expect(profile.locator("summary")).toContainText("Active");
  await capture(admin, "09-moderation");
  await buyer.goto(`/listings/${id}`);
  await expect(
    buyer.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await review
    .getByLabel("Reason (5–1000 characters)")
    .fill("Hidden after local moderation review");
  await review.getByRole("button", { name: "Hide listing" }).click();
  await expect(review).toHaveCount(0);
  await buyer.goto(`/listings/${id}`);
  await expect(
    buyer.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  await seller.goto("/my-listings");
  await expect(
    seller.getByText("archived / Abuja", { exact: true }),
  ).toBeVisible();
  await expect(
    seller.getByText("Review note: Hidden after local moderation review", {
      exact: true,
    }),
  ).toBeVisible();
});

test("real trade decline, cancellation, reservations and completed handover", async ({
  marketplace: { seller, buyer, admin, token },
}) => {
  test.setTimeout(180000);
  const title = `[LOCAL TEST] Trade requested ${token.slice(0, 8)}`;
  const offeredTitle = `[LOCAL TEST] Trade offered ${token.slice(0, 8)}`;
  const id = await draft(seller, title);
  await upload(seller);
  await submit(seller);
  await approve(admin, title);
  const offered = await draft(buyer, offeredTitle);
  await upload(buyer);
  await submit(buyer);
  await approve(admin, offeredTitle);
  async function offer() {
    await buyer.goto(`/listings/${id}`);
    await buyer.getByText("Offer a trade", { exact: true }).click();
    await expect(buyer.getByRole("combobox")).toHaveAccessibleName(
      "Your active item",
    );
    await buyer
      .getByRole("combobox", { name: "Your active item", exact: true })
      .selectOption(offered);
    await buyer
      .getByLabel("Proposal (optional)")
      .fill("Local trade verification: inspect both items before handover.");
    await buyer.getByRole("button", { name: "Send trade offer" }).click();
    await expect(buyer).toHaveURL(/\/offers$/);
    await expect(
      buyer.getByText("Sent · pending", { exact: false }),
    ).toBeVisible();
  }
  await offer();
  await seller.goto("/offers");
  await seller.getByRole("button", { name: "Decline", exact: true }).click();
  await expect(
    seller.getByText("Received · declined", { exact: false }),
  ).toBeVisible();
  await offer();
  await buyer.getByRole("button", { name: "Cancel request" }).click();
  await expect(
    buyer.getByText("Sent · cancelled", { exact: false }),
  ).toBeVisible();
  await offer();
  await seller.goto("/offers");
  await seller.getByRole("button", { name: "Accept request" }).click();
  await expect(
    seller.getByText("Received · accepted", { exact: false }),
  ).toBeVisible();
  await buyer.goto("/my-listings");
  await buyer.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(buyer.locator("main").getByRole("alert")).toContainText(
    "Resolve the accepted request first",
  );
  await buyer.goto("/offers");
  await buyer.getByRole("button", { name: "Cancel arrangement" }).click();
  await expect(
    buyer.getByRole("button", { name: "Cancel arrangement" }),
  ).toHaveCount(0);
  await offer();
  await seller.goto("/offers");
  await seller.getByRole("button", { name: "Accept request" }).click();
  await expect(
    seller.getByText("Received · accepted", { exact: false }),
  ).toBeVisible();
  await capture(seller, "10-trade-accepted");
  await buyer.goto("/offers");
  await buyer.getByRole("button", { name: "Mark handover completed" }).click();
  await expect(
    buyer.getByText("Sent · completed", { exact: false }),
  ).toBeVisible();
  await seller.goto("/offers");
  await expect(
    seller.getByText("Received · completed", { exact: false }),
  ).toBeVisible();
  for (const [page, item] of [
    [seller, title],
    [buyer, offeredTitle],
  ] as const) {
    await page.goto("/my-listings");
    await expect(
      page.getByRole("heading", { name: item, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("sold / Lagos", { exact: true })).toBeVisible();
  }
  await buyer.goto(`/?q=${encodeURIComponent(token.slice(0, 8))}`);
  await expect(
    buyer.getByRole("heading", { name: "No matching listings" }),
  ).toBeVisible();
});
