import { updateProfileController, getOrdersController, getAllOrdersController, orderStatusController } from "./authController.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import { hashPassword } from "../helpers/authHelper.js";

jest.mock("../models/userModel.js");
jest.mock("../models/orderModel.js");
jest.mock("../helpers/authHelper.js");

describe("authController - Profile and Orders", () => {
    let req, res;

    beforeEach(() => {
        req = {
            user: { _id: "user123" },
            body: {},
            params: {},
        };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn(),
        };
        jest.clearAllMocks();
    });

    // Ashley Chang Le Xuan, A0252633J - updateProfileController tests
    describe("updateProfileController", () => {
        it("should update user profile successfully", async () => {
            // Arrange
            req.body = { name: "John Doe", email: "john@test.com", phone: "1234567890", address: "123 Main St" };
            const mockUser = { name: "Old Name", password: "oldpass", phone: "0000000000", address: "Old Address" };
            const mockUpdatedUser = { _id: "user123", name: "John Doe", email: "john@test.com", phone: "1234567890", address: "123 Main St" };
            userModel.findById.mockResolvedValue(mockUser);
            userModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

            // Act
            await updateProfileController(req, res);

            // Assert
            expect(userModel.findById).toHaveBeenCalledWith("user123");
            expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
                "user123",
                {
                    name: "John Doe",
                    password: mockUser.password,
                    phone: "1234567890",
                    address: "123 Main St",
                },
                { new: true }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Profile Updated Successfully",
                updatedUser: mockUpdatedUser,
            });
        });

        it("should update password when provided and valid", async () => {
            // Arrange
            req.body = { password: "newPassword123", name: "John" };
            const mockUser = { name: "John", password: "oldpass", phone: "123", address: "addr" };
            const hashedPass = "hashedNewPassword";
            userModel.findById.mockResolvedValue(mockUser);
            hashPassword.mockResolvedValue(hashedPass);
            userModel.findByIdAndUpdate.mockResolvedValue({ ...mockUser, password: hashedPass });

            // Act
            await updateProfileController(req, res);

            // Assert
            expect(hashPassword).toHaveBeenCalledWith("newPassword123");
            expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
                "user123",
                {
                    name: "John",
                    password: hashedPass,
                    phone: "123",
                    address: "addr",
                },
                { new: true }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Profile Updated Successfully",
                updatedUser: { ...mockUser, password: hashedPass },
            });
        });

        it("should return error when password is less than 6 characters", async () => {
            // Arrange
            req.body = { password: "short", name: "John" };
            const mockUser = { name: "John", password: "oldpass", phone: "123", address: "addr" };
            userModel.findById.mockResolvedValue(mockUser);

            // Act
            await updateProfileController(req, res);

            // Assert
            expect(res.json).toHaveBeenCalledWith(
                { error: "Passsword is required and 6 character long" }
            );
        });

        it("should handle errors during update", async () => {
            // Arrange
            req.body = { name: "John" };
            userModel.findById.mockRejectedValue(new Error("Database error"));

            // Act
            await updateProfileController(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Error While Updating Profile",
                error: new Error("Database error"),
            });
        });

        it("should preserve existing user data when fields not provided", async () => {
            // Arrange
            req.body = { name: "New Name" };
            const mockUser = { name: "Old Name", password: "pass", phone: "1234567890", address: "123 Main" };
            const mockUpdatedUser = { ...mockUser, name: "New Name" };
            userModel.findById.mockResolvedValue(mockUser);
            userModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

            // Act
            await updateProfileController(req, res);

            // Assert
            expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
                "user123",
                {
                    name: "New Name",
                    password: mockUser.password,
                    phone: mockUser.phone,
                    address: mockUser.address,
                },
                { new: true }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Profile Updated Successfully",
                updatedUser: mockUpdatedUser,
            });
        });
    });

    // Ashley Chang Le Xuan, A0252633J - getOrdersController tests
    describe("getOrdersController", () => {
        it("should retrieve orders for logged in user", async () => {
            // Arrange
            const mockOrders = [
                { _id: "order1", buyer: "user123", products: ["prod1"], status: "Not Processed" },
                { _id: "order2", buyer: "user123", products: ["prod2"], status: "Shipped" },
            ];
            orderModel.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockOrders),
                }),
            });

            // Act
            await getOrdersController(req, res);

            // Assert
            expect(orderModel.find).toHaveBeenCalledWith({ buyer: "user123" });
            expect(res.json).toHaveBeenCalledWith(mockOrders);
        });

        it("should handle errors when retrieving orders", async () => {
            // Arrange
            orderModel.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockRejectedValue(new Error("Database error")),
                }),
            });

            // Act
            await getOrdersController(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Error While Getting Orders",
                error: new Error("Database error"),
            });
        });

        it("should return empty array when user has no orders", async () => {
            // Arrange
            orderModel.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue([]),
                }),
            });

            // Act
            await getOrdersController(req, res);

            // Assert
            expect(orderModel.find).toHaveBeenCalledWith({ buyer: "user123" });
            expect(res.json).toHaveBeenCalledWith([]);
        });
    });

    // Ashley Chang Le Xuan, A0252633J - getAllOrdersController tests
    describe("getAllOrdersController", () => {
        it("should retrieve all orders sorted by creation date", async () => {
            // Arrange
            const mockOrders = [
                { _id: "order1", buyer: "user1", status: "Shipped" },
                { _id: "order2", buyer: "user2", status: "Not Processed" },
            ];
            orderModel.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockResolvedValue(mockOrders),
                    }),
                }),
            });

            // Act
            await getAllOrdersController(req, res);

            // Assert
            expect(orderModel.find).toHaveBeenCalledWith({});
            expect(res.json).toHaveBeenCalledWith(mockOrders);
        });

        it("should handle errors when retrieving all orders", async () => {
            // Arrange
            orderModel.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockRejectedValue(new Error("Database error")),
                    }),
                }),
            });

            // Act
            await getAllOrdersController(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Error While Getting Orders",
                error: new Error("Database error"),
            });
        });

        it("should return empty array when no orders exist", async () => {
            // Arrange
            orderModel.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockResolvedValue([]),
                    }),
                }),
            });

            // Act
            await getAllOrdersController(req, res);

            // Assert
            expect(orderModel.find).toHaveBeenCalledWith({});
            expect(res.json).toHaveBeenCalledWith([]);
        });
    });

    // Ashley Chang Le Xuan, A0252633J - orderStatusController tests
    describe("orderStatusController", () => {
        it("should update order status successfully", async () => {
            // Arrange
            req.params = { orderId: "order123" };
            req.body = { status: "Shipped" };
            const mockUpdatedOrder = { _id: "order123", status: "Shipped", buyer: "user123" };
            orderModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedOrder);

            // Act
            await orderStatusController(req, res);

            // Assert
            expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
                "order123",
                { status: "Shipped" },
                { new: true }
            );
            expect(res.json).toHaveBeenCalledWith(mockUpdatedOrder);
        });

        it("should handle different status values", async () => {
            // Arrange
            req.params = { orderId: "order123" };
            req.body = { status: "Delivered" };
            const mockUpdatedOrder = { _id: "order123", status: "Delivered", buyer: "user123" };
            orderModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedOrder);

            // Act
            await orderStatusController(req, res);

            // Assert
            expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
                "order123",
                { status: "Delivered" },
                { new: true }
            );
            expect(res.json).toHaveBeenCalledWith(mockUpdatedOrder);
        });

        it("should handle errors when updating order status", async () => {
            // Arrange
            req.params = { orderId: "order123" };
            req.body = { status: "Shipped" };
            orderModel.findByIdAndUpdate.mockRejectedValue(new Error("Database error"));

            // Act
            await orderStatusController(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Error While Updating Order",
                error: new Error("Database error"),
            });
        });

        it("should handle missing orderId", async () => {
            // Arrange
            req.params = { orderId: "" };
            req.body = { status: "Shipped" };
            orderModel.findByIdAndUpdate.mockResolvedValue(null);

            // Act
            await orderStatusController(req, res);

            // Assert
            expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
                "",
                { status: "Shipped" },
                { new: true }
            );
            expect(res.json).toHaveBeenCalledWith(null);
        });
    });
});