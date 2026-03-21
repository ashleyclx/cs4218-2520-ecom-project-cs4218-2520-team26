import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import {
  getAllOrdersController,
  getOrdersController,
  orderStatusController,
  updateProfileController,
} from "./authController.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";
import { comparePassword, hashPassword } from "../helpers/authHelper.js";

const createMockResponse = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.send = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const createRequest = (userId, body) => ({
  user: { _id: userId.toString() },
  body,
});

const createUserFixture = async (overrides = {}) => {
  const password = overrides.rawPassword || "oldPassword123";
  const hashedPassword = await hashPassword(password);

  const user = await userModel.create({
    name: "Original Name",
    email: "integration-user@test.com",
    password: hashedPassword,
    phone: "11111111",
    address: { line1: "Old Address", postal: "000000" },
    answer: "blue",
    ...overrides,
    password: overrides.password || hashedPassword,
  });

  return { user, oldPasswordHash: hashedPassword };
};

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await orderModel.deleteMany({});
  await productModel.deleteMany({});
  await categoryModel.deleteMany({});
  await userModel.deleteMany({});
  jest.clearAllMocks();
});

describe("updateProfileController integration with userModel", () => {
  it("updates name, phone, and address and persists the changes", async () => {
    // Arrange
    const { user, oldPasswordHash } = await createUserFixture({
      email: "integration-user-1@test.com",
      address: { line1: "Old Address" },
    });
    const req = createRequest(user._id, {
      name: "Updated Name",
      phone: "99998888",
      address: { line1: "New Address", postal: "123456" },
    });
    const res = createMockResponse();

    // Act
    await updateProfileController(req, res);

    // Assert
    const updatedUser = await userModel.findById(user._id).lean();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Profile Updated Successfully",
      })
    );

    expect(updatedUser.name).toBe("Updated Name");
    expect(updatedUser.phone).toBe("99998888");
    expect(updatedUser.address).toEqual({ line1: "New Address", postal: "123456" });
    expect(updatedUser.password).toBe(oldPasswordHash);
  });

  it("hashes a new password before saving to the database", async () => {
    // Arrange
    const { user, oldPasswordHash } = await createUserFixture({
      email: "integration-user-2@test.com",
      name: "Password User",
      phone: "22222222",
      address: { line1: "Address" },
      answer: "green",
    });
    const req = createRequest(user._id, { password: "newPassword456" });
    const res = createMockResponse();

    // Act
    await updateProfileController(req, res);

    // Assert
    const updatedUser = await userModel.findById(user._id).lean();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(updatedUser.password).not.toBe("newPassword456");
    expect(updatedUser.password).not.toBe(oldPasswordHash);
    expect(await comparePassword("newPassword456", updatedUser.password)).toBe(true);
  });

  it("returns an error when password is shorter than 6 characters", async () => {
    // Arrange
    const { user, oldPasswordHash } = await createUserFixture({
      email: "integration-user-3@test.com",
      name: "Short Password User",
      phone: "33333333",
      address: { line1: "Address" },
      answer: "red",
    });
    const req = createRequest(user._id, { password: "12345" });
    const res = createMockResponse();

    // Act
    await updateProfileController(req, res);

    // Assert
    const unchangedUser = await userModel.findById(user._id).lean();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Password is required to be at least 6 characters long",
    });
    expect(unchangedUser.password).toBe(oldPasswordHash);
  });

  it("keeps fields unchanged when they are not provided in request body", async () => {
    // Arrange
    const { user, oldPasswordHash } = await createUserFixture({
      email: "integration-user-4@test.com",
      name: "Keep Fields User",
      phone: "44444444",
      address: { line1: "Initial Address", postal: "654321" },
      answer: "yellow",
    });
    const req = createRequest(user._id, { name: "Only Name Changed" });
    const res = createMockResponse();

    // Act
    await updateProfileController(req, res);

    // Assert
    const updatedUser = await userModel.findById(user._id).lean();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(updatedUser.name).toBe("Only Name Changed");
    expect(updatedUser.phone).toBe("44444444");
    expect(updatedUser.address).toEqual({ line1: "Initial Address", postal: "654321" });
    expect(updatedUser.password).toBe(oldPasswordHash);
  });
});

describe("order controllers integration with orderModel", () => {
  const createUser = async ({ email, name }) => {
    const passwordHash = await hashPassword("orderPassword123");
    return userModel.create({
      name,
      email,
      password: passwordHash,
      phone: "88888888",
      address: { line1: "Order Address" },
      answer: "pet",
    });
  };

  const createProduct = async ({ name, slug, price }) => {
    const category = await categoryModel.create({
      name: `${name} Category`,
      slug: `${slug}-category`,
    });

    return productModel.create({
      name,
      slug,
      description: `${name} description`,
      price,
      category: category._id,
      quantity: 20,
      shipping: true,
    });
  };

  const createOrder = async ({ buyerId, productIds, status = "Not Processed" }) => {
    return orderModel.create({
      products: productIds,
      payment: { id: "payment-1", success: true },
      buyer: buyerId,
      status,
    });
  };

  describe("getOrdersController integration", () => {
    it("returns only orders for the authenticated user with populated product details", async () => {
      // Arrange
      const buyer = await createUser({
        name: "Buyer User",
        email: "orders-buyer@test.com",
      });
      const otherUser = await createUser({
        name: "Other User",
        email: "orders-other@test.com",
      });
      const buyerProduct = await createProduct({
        name: "Buyer Product",
        slug: "buyer-product",
        price: 120,
      });
      const otherProduct = await createProduct({
        name: "Other Product",
        slug: "other-product",
        price: 70,
      });

      await createOrder({
        buyerId: buyer._id,
        productIds: [buyerProduct._id],
        status: "Processing",
      });
      await createOrder({
        buyerId: otherUser._id,
        productIds: [otherProduct._id],
        status: "Shipped",
      });

      const req = { user: { _id: buyer._id.toString() } };
      const res = createMockResponse();

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledTimes(1);
      const returnedOrders = res.json.mock.calls[0][0];

      expect(Array.isArray(returnedOrders)).toBe(true);
      expect(returnedOrders).toHaveLength(1);
      expect(returnedOrders[0].buyer._id.toString()).toBe(buyer._id.toString());
      expect(returnedOrders[0].products).toHaveLength(1);
      expect(returnedOrders[0].products[0].name).toBe("Buyer Product");
      expect(returnedOrders[0].products[0].photo?.data).toBeUndefined();
    });

    it("returns an empty array when authenticated user has no orders", async () => {
      // Arrange
      const userWithoutOrders = await createUser({
        name: "No Orders User",
        email: "orders-empty@test.com",
      });
      const req = { user: { _id: userWithoutOrders._id.toString() } };
      const res = createMockResponse();

      // Act
      await getOrdersController(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe("getAllOrdersController integration", () => {
    it("returns all orders sorted by createdAt descending", async () => {
      // Arrange
      const buyer = await createUser({
        name: "Admin Visible User",
        email: "orders-admin@test.com",
      });
      const firstProduct = await createProduct({
        name: "First Product",
        slug: "first-product",
        price: 40,
      });
      const secondProduct = await createProduct({
        name: "Second Product",
        slug: "second-product",
        price: 80,
      });

      const firstOrder = await createOrder({
        buyerId: buyer._id,
        productIds: [firstProduct._id],
        status: "Processing",
      });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const secondOrder = await createOrder({
        buyerId: buyer._id,
        productIds: [secondProduct._id],
        status: "Shipped",
      });

      const req = {};
      const res = createMockResponse();

      // Act
      await getAllOrdersController(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledTimes(1);
      const returnedOrders = res.json.mock.calls[0][0];

      expect(returnedOrders).toHaveLength(2);
      expect(returnedOrders[0]._id.toString()).toBe(secondOrder._id.toString());
      expect(returnedOrders[1]._id.toString()).toBe(firstOrder._id.toString());
    });
  });

  describe("orderStatusController integration", () => {
    it("updates order status and persists the change", async () => {
      // Arrange
      const buyer = await createUser({
        name: "Status User",
        email: "orders-status@test.com",
      });
      const product = await createProduct({
        name: "Status Product",
        slug: "status-product",
        price: 55,
      });
      const order = await createOrder({
        buyerId: buyer._id,
        productIds: [product._id],
        status: "Not Processed",
      });

      const req = {
        params: { orderId: order._id.toString() },
        body: { status: "Delivered" },
      };
      const res = createMockResponse();

      // Act
      await orderStatusController(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledTimes(1);
      const responseOrder = res.json.mock.calls[0][0];
      expect(responseOrder.status).toBe("Delivered");

      const persistedOrder = await orderModel.findById(order._id).lean();
      expect(persistedOrder.status).toBe("Delivered");
    });
  });
});
