const { test, expect } = require("@playwright/test");

const fillRegisterForm = async (page, user) => {
  await page.getByPlaceholder("Enter Your Name").fill(user.name);
  await page.getByPlaceholder("Enter Your Email").fill(user.email);
  await page.getByPlaceholder("Enter Your Password").fill(user.password);
  await page.getByPlaceholder("Enter Your Phone").fill(user.phone);
  await page.getByPlaceholder("Enter Your Address").fill(user.address);
  await page.locator("#exampleInputDOB1").fill(user.dob);
  await page.getByPlaceholder("What is Your Favorite sports").fill(user.answer);
};

const expectToast = async (page, message) => {
  await expect(page.getByText(message).first()).toBeVisible({ timeout: 10000 });
};

const registerUser = async (page, user) => {
  await page.goto("/register");
  await fillRegisterForm(page, user);
  await page.getByRole("button", { name: "REGISTER" }).click();
  await expect(page).toHaveURL(/\/login$/);
};

const loginUser = async (page, email, password) => {
  await page.goto("/login");
  await page.getByPlaceholder("Enter Your Email").fill(email);
  await page.getByPlaceholder("Enter Your Password").fill(password);
  await page.getByRole("button", { name: "LOGIN" }).click();
};

// Nicholas Koh Zi Lun, A0272806B
test("user can register, login, logout, and sees failed login feedback", async ({
  page,
}) => {
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const user = {
    name: `E2E User ${uniqueId}`,
    email: `e2e.user.${uniqueId}@example.com`,
    password: "Password123!",
    phone: "91234567",
    address: "123 E2E Street",
    dob: "1999-01-01",
    answer: "football",
  };

  await registerUser(page, user);
  await expectToast(page, /register successfully, please login/i);

  await page.getByPlaceholder("Enter Your Email").fill(user.email);
  await page.getByPlaceholder("Enter Your Password").fill(user.password);
  await page.getByRole("button", { name: "LOGIN" }).click();
  await expectToast(page, /login successful/i);
  await expect(page).toHaveURL(/\/$/);

  const userDropdownToggle = page
    .locator(".nav-link.dropdown-toggle")
    .filter({ hasText: user.name })
    .first();

  await expect(userDropdownToggle).toBeVisible();

  await userDropdownToggle.click();
  await page.getByRole("link", { name: "Logout" }).click();
  await expectToast(page, /logout successfully/i);

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Register" })).toBeVisible();

  await expect(page.getByPlaceholder("Enter Your Email")).toBeVisible();
  await expect(page.getByPlaceholder("Enter Your Password")).toBeVisible();

  await page.getByPlaceholder("Enter Your Email").fill(user.email);
  await page.getByPlaceholder("Enter Your Password").fill("WrongPassword123!");
  await page.getByRole("button", { name: "LOGIN" }).click();
  await expectToast(page, /incorrect password/i);
  await expect(page).toHaveURL(/\/login$/);
});

test("registered user can reset password and login with new password", async ({
  page,
}) => {
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const user = {
    name: `E2E Recover ${uniqueId}`,
    email: `e2e.recover.${uniqueId}@example.com`,
    password: "Password123!",
    newPassword: "NewPassword123!",
    phone: "91234567",
    address: "123 E2E Street",
    dob: "1999-01-01",
    answer: "football",
  };

  await registerUser(page, user);

  await page.getByRole("button", { name: "Forgot Password" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await expect(
    page.getByRole("heading", { name: /reset password/i }),
  ).toBeVisible();

  await page.getByPlaceholder("Enter Your Email").fill(user.email);
  await page.getByPlaceholder("What is Your Favorite sports").fill(user.answer);
  await page.getByPlaceholder("Enter Your New Password").fill(user.newPassword);
  await page.getByRole("button", { name: "RESET PASSWORD" }).click();

  await expectToast(page, /password reset successfully/i);
  await expect(page).toHaveURL(/\/login$/);

  await page.getByPlaceholder("Enter Your Email").fill(user.email);
  await page.getByPlaceholder("Enter Your Password").fill(user.newPassword);
  await page.getByRole("button", { name: "LOGIN" }).click();
  await expectToast(page, /login successful/i);
  await expect(page).toHaveURL(/\/$/);

  await page
    .locator(".nav-link.dropdown-toggle")
    .filter({ hasText: user.name })
    .first()
    .click();
  await page.getByRole("link", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByPlaceholder("Enter Your Email").fill(user.email);
  await page.getByPlaceholder("Enter Your Password").fill(user.password);
  await page.getByRole("button", { name: "LOGIN" }).click();
  await expectToast(page, /incorrect password/i);
  await expect(page).toHaveURL(/\/login$/);
});

test("authenticated session persists after browser refresh", async ({
  page,
}) => {
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const user = {
    name: `E2E Persist ${uniqueId}`,
    email: `e2e.persist.${uniqueId}@example.com`,
    password: "Password123!",
    phone: "91234567",
    address: "123 E2E Street",
    dob: "1999-01-01",
    answer: "football",
  };

  await registerUser(page, user);
  await loginUser(page, user.email, user.password);
  await expect(page).toHaveURL(/\/$/);

  await page.reload();

  const userDropdownToggle = page
    .locator(".nav-link.dropdown-toggle")
    .filter({ hasText: user.name })
    .first();
  await expect(userDropdownToggle).toBeVisible();

  await userDropdownToggle.click();
  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard\/user$/);
  await expect(page.getByText(user.email)).toBeVisible();
});

test("registered user can access dashboard and profile after login", async ({
  page,
}) => {
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const user = {
    name: `E2E Profile ${uniqueId}`,
    email: `e2e.profile.${uniqueId}@example.com`,
    password: "Password123!",
    phone: "91234567",
    address: "123 E2E Street",
    dob: "1999-01-01",
    answer: "football",
  };

  await registerUser(page, user);
  await loginUser(page, user.email, user.password);

  await expect(page).toHaveURL(/\/$/);

  const userDropdownToggle = page
    .locator(".nav-link.dropdown-toggle")
    .filter({ hasText: user.name })
    .first();

  await expect(userDropdownToggle).toBeVisible();
  await userDropdownToggle.click();
  await page.getByRole("link", { name: "Dashboard" }).click();

  await expect(page).toHaveURL(/\/dashboard\/user$/);
  const dashboardCard = page.locator(".card.w-75.p-3");
  await expect(
    dashboardCard.getByRole("heading", { name: user.name }),
  ).toBeVisible();
  await expect(
    dashboardCard.getByRole("heading", { name: user.email }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Profile" }).click();
  await expect(page).toHaveURL(/\/dashboard\/user\/profile$/);
  await expect(
    page.getByRole("heading", { name: "USER PROFILE" }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("Enter Your Name")).toHaveValue(user.name);
  await expect(page.getByPlaceholder("Enter Your Email")).toHaveValue(
    user.email,
  );
});

test("duplicate registration shows error toast and stays on register page", async ({
  page,
}) => {
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const user = {
    name: `E2E Duplicate ${uniqueId}`,
    email: `e2e.duplicate.${uniqueId}@example.com`,
    password: "Password123!",
    phone: "91234567",
    address: "123 E2E Street",
    dob: "1999-01-01",
    answer: "football",
  };

  await registerUser(page, user);

  await page.goto("/register");
  await fillRegisterForm(page, user);
  await page.getByRole("button", { name: "REGISTER" }).click();
  await expectToast(
    page,
    /unable to register right now\. please try again later\./i,
  );
  await expect(page).toHaveURL(/\/register$/);
});

test("unregistered email login shows error and stays on login page", async ({
  page,
}) => {
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  await loginUser(page, `no.account.${uniqueId}@example.com`, "Password123!");

  await expectToast(page, /no account found with this email/i);
  await expect(page).toHaveURL(/\/login$/);
});
