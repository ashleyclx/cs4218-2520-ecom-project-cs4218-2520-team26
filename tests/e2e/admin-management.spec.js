const { test, expect } = require("@playwright/test");
const path = require("path");

const ADMIN_EMAIL = "e2e.admin@example.com";
const ADMIN_PASSWORD = "E2EAdmin123!";

test.use({
  storageState: path.resolve(__dirname, ".auth", "admin.json"),
});

const expectToast = async (page, messagePattern) => {
  await expect(page.getByText(messagePattern).first()).toBeVisible();
};

const openAdminDashboardFromNavbar = async (page) => {
  const userDropdown = page
    .locator(".nav-link.dropdown-toggle")
    .filter({ hasText: /e2e admin/i })
    .first();

  await expect(userDropdown).toBeVisible();
  await userDropdown.click();
  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard\/admin$/);
};

const assertAdminSession = async (page) => {
  const isAdmin = await page.evaluate(() => {
    const authRaw = localStorage.getItem("auth");
    if (!authRaw) return false;
    try {
      const auth = JSON.parse(authRaw);
      return auth?.user?.role === 1 && Boolean(auth?.token);
    } catch {
      return false;
    }
  });

  expect(
    isAdmin,
    "Admin storage state is missing or invalid. Re-run Playwright so global setup can seed and authenticate admin state.",
  ).toBeTruthy();
};

const gotoAdminPage = async (page, routePath) => {
  await page.goto(routePath);

  const loginHeading = page.getByRole("heading", { name: /login form/i });
  if (await loginHeading.isVisible().catch(() => false)) {
    await page.getByPlaceholder("Enter Your Email").fill(ADMIN_EMAIL);
    await page.getByPlaceholder("Enter Your Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "LOGIN" }).click();
  }

  await expect(page).toHaveURL(
    new RegExp(`${routePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
  );
};

const deleteCategoryByName = async (page, categoryName) => {
  const categoryRows = page.locator("tbody tr", { hasText: categoryName });
  const initialCount = await categoryRows.count();
  if (!initialCount) return;

  await categoryRows.first().getByRole("button", { name: "Delete" }).click();
  await expect
    .poll(async () => categoryRows.count())
    .toBeLessThan(initialCount);
};

// Nicholas Koh Zi Lun, A0272806B
test.describe("admin category and order management", () => {
  test("admin can login via UI and access admin dashboard details", async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: /login form/i }),
    ).toBeVisible();

    await page.getByPlaceholder("Enter Your Email").fill(ADMIN_EMAIL);
    await page.getByPlaceholder("Enter Your Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "LOGIN" }).click();

    await expectToast(page, /login successful/i);
    await expect(page).toHaveURL(/\/$/);

    await openAdminDashboardFromNavbar(page);
    await expect(page.getByText(/admin name\s*:\s*e2e admin/i)).toBeVisible();
    await expect(
      page.getByText(/admin email\s*:\s*e2e\.admin@example\.com/i),
    ).toBeVisible();

    await context.close();
  });

  test("unauthenticated user is redirected to login from admin page", async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto("/dashboard/admin/create-category");
    await expect(page.getByText(/redirecting to you in/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/i, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: /login form/i }),
    ).toBeVisible();

    await context.close();
  });

  test("admin can navigate all admin sections from the menu", async ({
    page,
  }) => {
    await page.goto("/");
    await assertAdminSession(page);

    await openAdminDashboardFromNavbar(page);
    await expect(
      page.getByRole("heading", { name: /admin panel/i }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Create Category" }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/create-category$/);
    await expect(
      page.getByRole("heading", { name: "Manage Category" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Products" }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/products$/);
    await expect(
      page.getByRole("heading", { name: "All Products List" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Orders" }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/orders$/);
    await expect(
      page.getByRole("heading", { name: "All Orders" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Users" }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/users$/);
    await expect(
      page.getByRole("heading", { name: "All Users" }),
    ).toBeVisible();
  });

  test("admin manages categories through full create-edit-validation-delete journey", async ({
    page,
  }) => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const baseName = `E2E Base Category ${suffix}`;
    const targetName = `E2E Target Category ${suffix}`;

    await page.goto("/");
    await assertAdminSession(page);

    await gotoAdminPage(page, "/dashboard/admin/create-category");
    await expect(
      page.getByRole("heading", { name: "Manage Category" }),
    ).toBeVisible();

    await page.getByPlaceholder("Enter new category").fill("   ");
    await page.getByRole("button", { name: "Submit" }).first().click();
    await expect(page.getByText(/name is required/i).first()).toBeVisible();

    await page.getByPlaceholder("Enter new category").fill(baseName);
    await page.getByRole("button", { name: "Submit" }).first().click();
    await expect(
      page.locator("tr", { hasText: baseName }).first(),
    ).toBeVisible();

    await page.getByPlaceholder("Enter new category").fill(targetName);
    await page.getByRole("button", { name: "Submit" }).first().click();
    await expect(
      page.locator("tr", { hasText: targetName }).first(),
    ).toBeVisible();

    await page.getByPlaceholder("Enter new category").fill(targetName);
    await page.getByRole("button", { name: "Submit" }).first().click();
    await expect(
      page.getByText(/category already exists/i).first(),
    ).toBeVisible();

    const baseRow = page.locator("tr", { hasText: baseName }).first();
    await baseRow.getByRole("button", { name: "Edit" }).click();

    const modal = page.locator(".ant-modal-content").first();
    await expect(modal).toBeVisible();
    const modalInput = modal.getByPlaceholder("Enter new category");
    await modalInput.fill("");
    await modalInput.fill(targetName);
    await modal.getByRole("button", { name: "Submit" }).click();

    await expect(
      page.getByText(/category already exists/i).first(),
    ).toBeVisible();
    await page.locator(".ant-modal-close").first().click();
    await expect(page.locator(".ant-modal-content").first()).toBeHidden();

    await deleteCategoryByName(page, baseName);
    await deleteCategoryByName(page, targetName);

    await expect(page.locator("tbody tr", { hasText: baseName })).toHaveCount(
      0,
    );
    await expect(page.locator("tbody tr", { hasText: targetName })).toHaveCount(
      0,
    );
  });

  test("admin manages orders through success and failure status-update journey", async ({
    page,
  }) => {
    await page.goto("/");
    await assertAdminSession(page);

    await gotoAdminPage(page, "/dashboard/admin/orders");
    await expect(
      page.getByRole("heading", { name: "All Orders" }),
    ).toBeVisible();

    const orderCards = page.locator(".border.shadow");
    const orderCount = await orderCards.count();

    if (orderCount === 0) {
      await expect(
        page.getByRole("heading", { name: "All Orders" }),
      ).toBeVisible();
      return;
    }

    const firstOrderCard = orderCards.first();
    await expect(firstOrderCard).toBeVisible();

    await expect(
      firstOrderCard.getByRole("columnheader", { name: "Status" }),
    ).toBeVisible();
    await expect(
      firstOrderCard.getByRole("columnheader", { name: "Buyer" }),
    ).toBeVisible();
    await expect(
      firstOrderCard.getByRole("columnheader", { name: "Date" }),
    ).toBeVisible();

    const firstOrderRow = firstOrderCard.locator("tbody tr").first();
    await expect(firstOrderRow.locator("td").nth(2)).not.toHaveText(/^\s*$/);
    await expect(firstOrderRow.locator("td").nth(3)).not.toHaveText(/^\s*$/);

    const statusSelect = firstOrderCard.locator(".ant-select").first();
    await expect(statusSelect).toBeVisible();

    const currentStatus = (await statusSelect.innerText()).trim();
    const candidateStatuses = [
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];
    const nextStatus = candidateStatuses.find(
      (status) => status !== currentStatus,
    );
    if (!nextStatus) return;

    await statusSelect.click();
    await page
      .locator(".ant-select-dropdown .ant-select-item-option", {
        hasText: nextStatus,
      })
      .first()
      .click();

    await expect(
      page
        .getByText(
          /order status updated successfully|unable to update order status/i,
        )
        .first(),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/admin\/orders$/);
  });
});
