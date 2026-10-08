import { test, expect, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
test("real seller → moderation → buyer workflow", async ({ browser }) => {
  test.skip(
    !existsSync(".env.local"),
    "A running isolated local Supabase and .env.local are required.",
  );
  test.skip(
    test.info().project.name !== "desktop",
    "The multi-account transaction is tested once; public/mobile tests run separately.",
  );
  const localConfig = readFileSync(".env.local", "utf8");
  const configuredUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    localConfig
      .match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]
      .replace(/^"|"$/g, "");
  expect(["127.0.0.1", "localhost"]).toContain(
    new URL(configuredUrl || "https://invalid.example").hostname,
  );
  test.setTimeout(180000);
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
  const token = crypto.randomUUID();
  const emails = ["seller", "buyer", "admin"].map(
    (role) => `browser-${role}-${token}@example.test`,
  );
  let password = crypto.randomUUID() + "aA1!";
  const contexts = await Promise.all(
    emails.map(() => browser.newContext({ baseURL: "http://localhost:3000" })),
  );
  const [seller, buyer, admin] = await Promise.all(
    contexts.map((c) => c.newPage()),
  );
  async function signup(page: Page, email: string, name: string) {
    await page.goto("/sign-up");
    await page.getByLabel("Display name", { exact: true }).fill(name);
    await page.getByLabel("Email (kept private)", { exact: true }).fill(email);
    await page
      .getByLabel("Password (at least 10 characters)", { exact: true })
      .fill(password);
    await page.getByRole("checkbox").check();
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(page).toHaveURL(/\/account$/);
  }
  try {
    await signup(seller, emails[0], "Local browser seller");
    await signup(buyer, emails[1], "Local browser buyer");
    await signup(admin, emails[2], "Local browser moderator");
    sql(
      `insert into public.admin_members(user_id) select id from auth.users where email='${emails[2]}';`,
    );
    await seller.reload();
    await expect(
      seller.getByRole("heading", { name: "Your account" }),
    ).toBeVisible();
    await seller.goto("/sell/new");
    const title = `Local workflow ${token.slice(0, 8)} console`;
    await seller.getByLabel("Title", { exact: true }).fill(title);
    await seller.getByLabel("Brand", { exact: true }).fill("Sony");
    await seller.getByLabel("Model", { exact: true }).fill("PS5");
    await seller.getByLabel("Price (₦)", { exact: true }).fill("245000");
    await seller
      .getByLabel("Description (20–5000 characters)", { exact: true })
      .fill(
        "Development-only test equipment, with controller and power cable.",
      );
    await seller
      .getByLabel("Known defects (write ‘None’ if none)", { exact: true })
      .fill("None");
    await seller
      .getByLabel("What’s included", { exact: true })
      .fill("Controller and power cable");
    await seller.getByRole("checkbox").check();
    await seller
      .getByRole("button", { name: "Save draft & add photos" })
      .click();
    await expect(seller).toHaveURL(/\/sell\/[\w-]+\/edit$/);
    const id = seller.url().split("/")[4];
    const photo = await sharp({
      create: { width: 320, height: 400, channels: 3, background: "#cccccc" },
    })
      .jpeg()
      .toBuffer();
    await seller.getByLabel("Add a photo").setInputFiles({
      name: "local-test-photo.jpg",
      mimeType: "image/jpeg",
      buffer: photo,
    });
    await seller
      .getByRole("button", { name: "Upload photo", exact: true })
      .click();
    await expect(
      seller.getByRole("status").filter({ hasText: "Photo added." }),
    ).toBeVisible();
    await expect(seller.getByRole("img")).toBeVisible();
    await seller.getByRole("button", { name: "Submit for review" }).click();
    await expect(seller).toHaveURL(/\/my-listings$/);
    await expect(
      seller.getByText("pending review / Lagos", { exact: true }),
    ).toBeVisible();
    await buyer.goto(`/listings/${id}`);
    await expect(
      buyer.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
    await admin.goto("/admin");
    const review = admin
      .locator("article")
      .filter({ has: admin.getByRole("link", { name: title, exact: true }) });
    await review.getByRole("button", { name: "Approve listing" }).click();
    await expect(
      review.getByText("active / Seller", { exact: false }),
    ).toBeVisible();
    await buyer.goto("/");
    await buyer.getByRole("searchbox").fill(title);
    await buyer.getByRole("button", { name: "Search", exact: true }).click();
    await buyer
      .getByRole("article")
      .filter({ has: buyer.getByRole("heading", { name: title, exact: true }) })
      .getByRole("link")
      .click();
    await expect(buyer.getByRole("heading", { name: title })).toBeVisible();
    await buyer.getByRole("button", { name: "Save equipment" }).click();
    await expect(
      buyer.getByRole("button", { name: "Remove from saved" }),
    ).toBeVisible();
    await buyer.goto("/saved");
    await expect(buyer.getByRole("heading", { name: title })).toBeVisible();
    await buyer.goto(`/listings/${id}`);
    await buyer.getByText("Message seller", { exact: true }).click();
    await buyer
      .getByLabel("Your message", { exact: true })
      .fill("May I inspect the console before arranging payment?");
    await buyer.getByRole("button", { name: "Send message" }).click();
    await expect(buyer).toHaveURL(/\/messages\/[\w-]+$/);
    const conversation = buyer.url();
    await seller.goto("/messages");
    await seller.getByRole("link", { name: /Conversation/ }).click();
    await expect(
      seller.getByText("May I inspect the console before arranging payment?", {
        exact: true,
      }),
    ).toBeVisible();
    await seller
      .getByLabel("Reply", { exact: true })
      .fill("Yes. Let’s arrange an inspection.");
    await seller.getByRole("button", { name: "Send reply" }).click();
    await expect(
      seller.getByText("Yes. Let’s arrange an inspection.", { exact: true }),
    ).toBeVisible();
    await buyer.goto(conversation);
    await expect(
      buyer.getByText("Yes. Let’s arrange an inspection.", { exact: true }),
    ).toBeVisible();
    await buyer.goto(`/listings/${id}`);
    await buyer.getByText("Request to buy", { exact: true }).click();
    await buyer.getByRole("button", { name: "Send purchase request" }).click();
    await expect(buyer).toHaveURL(/\/offers$/);
    await expect(
      buyer.getByText("Sent · pending", { exact: false }),
    ).toBeVisible();
    await seller.goto("/offers");
    await seller.getByRole("button", { name: "Accept request" }).click();
    await expect(
      seller.getByText("Received · accepted", { exact: false }),
    ).toBeVisible();
    await buyer.goto("/offers");
    await expect(
      buyer.getByText("Sent · accepted", { exact: false }),
    ).toBeVisible();
    await seller
      .getByRole("button", { name: "Mark handover completed" })
      .click();
    await expect(
      seller.getByText("Received · completed", { exact: false }),
    ).toBeVisible();
    await buyer.goto("/");
    await buyer.getByRole("searchbox").fill(title);
    await buyer.getByRole("button", { name: "Search", exact: true }).click();
    await expect(
      buyer.getByRole("heading", { name: "No matching listings" }),
    ).toBeVisible();
    await seller.goto("/account");
    await seller
      .locator("main")
      .getByRole("button", { name: "Sign out" })
      .click();
    await expect(seller).toHaveURL(/\/$/);
    await seller.goto("/saved");
    await expect(seller).toHaveURL(/sign-in/);
    await seller.getByLabel("Email", { exact: true }).fill(emails[0]);
    await seller.getByLabel("Password", { exact: true }).fill(password);
    await seller.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(seller).toHaveURL(/\/$/);
    await seller.goto("/my-listings");
    await expect(seller.getByRole("heading", { name: title })).toBeVisible();
    await seller.goto("/account");
    await seller
      .locator("main")
      .getByRole("button", { name: "Sign out" })
      .click();
    await expect(seller).toHaveURL(/\/$/);
    await seller.goto("/forgot-password");
    await seller.getByLabel("Email", { exact: true }).fill(emails[0]);
    await seller.getByRole("button", { name: "Send reset link" }).click();
    await expect(seller.getByRole("status")).toContainText(
      "password reset link has been sent",
    );
    let mailId = "";
    await expect
      .poll(async () => {
        const inbox = (await (
          await seller.request.get("http://127.0.0.1:54324/api/v1/messages")
        ).json()) as { messages: { ID: string; To: { Address: string }[] }[] };
        mailId =
          inbox.messages.find((m) => m.To.some((t) => t.Address === emails[0]))
            ?.ID || "";
        return mailId;
      })
      .not.toBe("");
    const email = (await (
      await seller.request.get(
        `http://127.0.0.1:54324/api/v1/message/${mailId}`,
      )
    ).json()) as { HTML: string };
    const verification = await seller.evaluate((html) => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      return Array.from(doc.querySelectorAll("a")).find((a) =>
        a.href.includes("/auth/v1/verify"),
      )?.href;
    }, email.HTML);
    expect(verification).toBeTruthy();
    await seller.goto(verification!);
    await expect(seller).toHaveURL(/\/reset-password$/);
    password = crypto.randomUUID() + "aA1!";
    await seller
      .getByLabel("New password (at least 10 characters)")
      .fill(password);
    await seller.getByRole("button", { name: "Update password" }).click();
    await expect(seller).toHaveURL(/\/account$/);
    await seller.request.delete(`http://127.0.0.1:54324/api/v1/messages`, {
      data: { IDs: [mailId] },
    });
  } finally {
    const quoted = emails.map((e) => `'${e}'`).join(",");
    const users = `select id from auth.users where email in (${quoted})`;
    // The test owns only these generated local users; clean its tagged records without resetting shared local data.
    const rows = sql(
      `select i.storage_path from public.listing_images i join public.listings l on l.id=i.listing_id where l.seller_id in (${users});`,
    )
      .split("\n")
      .filter(Boolean);
    sql(
      `update public.listings set status='draft' where seller_id in (${users});`,
    );
    if (rows.length) {
      await seller.request.post("/api/command", {
        headers: { origin: "http://localhost:3000" },
        multipart: { command: "sign-in", email: emails[0], password },
      });
      await seller.goto("/my-listings");
      for (const path of rows) {
        const imageId = sql(
          `select id from public.listing_images where storage_path='${path}';`,
        );
        await seller.request.post("/api/command", {
          headers: { origin: "http://localhost:3000" },
          multipart: { command: "remove-image", id: imageId },
        });
      }
    }
    sql(
      `begin; delete from public.moderation_events where admin_id in (${users}); delete from public.reports where reporter_id in (${users}); delete from public.messages where sender_id in (${users}); delete from public.offers where buyer_id in (${users}) or seller_id in (${users}); delete from public.conversations where buyer_id in (${users}) or seller_id in (${users}); delete from public.saved_listings where user_id in (${users}); delete from public.listing_images where listing_id in (select id from public.listings where seller_id in (${users})); delete from public.listings where seller_id in (${users}); delete from auth.users where email in (${quoted}); commit;`,
    );
    await Promise.all(contexts.map((c) => c.close()));
  }
});
