import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import CreateProduct from "./CreateProduct";

// Emberlynn Loo, A0255614E

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("react-router-dom", () => ({
    useNavigate: jest.fn(),
}));
jest.mock("./../../components/Layout", () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>,
}));
jest.mock("./../../components/AdminMenu", () => ({
    __esModule: true,
    default: () => <div>AdminMenu</div>,
}));
jest.mock("antd", () => {
    const Select = ({ children, onChange, placeholder }) => (
        <select
            onChange={(e) => onChange && onChange(e.target.value)}
            aria-label={placeholder}
        >
            <option value="">{placeholder}</option>
            {children}
        </select>
    );
    Select.Option = ({ value, children }) => (
        <option value={value}>{children}</option>
    );
    return { Select };
});

const mockNavigate = jest.fn();

const mockCategories = [
    { _id: "c1", name: "Electronics" },
    { _id: "c2", name: "Books" },
];

global.URL.createObjectURL = jest.fn(() => "fake-url");

describe("CreateProduct", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useNavigate.mockReturnValue(mockNavigate);
        axios.get.mockResolvedValue({
            data: { success: true, category: mockCategories },
        });
    });

    test("renders page with all form fields", async () => {
        render(<CreateProduct />);
        expect(screen.getByText("Create Product")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("write a name")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("write a description")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("write a Price")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("write a quantity")).toBeInTheDocument();
        expect(screen.getByText("CREATE PRODUCT")).toBeInTheDocument();
    });

    test("loads categories on mount", async () => {
        render(<CreateProduct />);
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
        });
        await waitFor(() => {
            expect(screen.getByText("Electronics")).toBeInTheDocument();
        });
    });

    test("shows error toast when category fetch fails", async () => {
        axios.get.mockRejectedValueOnce(new Error("Network error"));
        render(<CreateProduct />);
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(
                "Something went wrong in getting category"
            );
        });
    });

    test("does not set categories when success is false", async () => {
        axios.get.mockResolvedValueOnce({ data: { success: false } });
        render(<CreateProduct />);
        await waitFor(() => expect(axios.get).toHaveBeenCalled());
        expect(screen.queryByText("Electronics")).not.toBeInTheDocument();
    });

    test("updates name input when typed", () => {
        render(<CreateProduct />);
        fireEvent.change(screen.getByPlaceholderText("write a name"), {
            target: { value: "Test Product" },
        });
        expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
    });

    test("updates description when typed", () => {
        render(<CreateProduct />);
        fireEvent.change(screen.getByPlaceholderText("write a description"), {
            target: { value: "A great product" },
        });
        expect(screen.getByDisplayValue("A great product")).toBeInTheDocument();
    });

    test("updates price when typed", () => {
        render(<CreateProduct />);
        fireEvent.change(screen.getByPlaceholderText("write a Price"), {
            target: { value: "99" },
        });
        expect(screen.getByDisplayValue("99")).toBeInTheDocument();
    });

    test("updates quantity when typed", () => {
        render(<CreateProduct />);
        fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
            target: { value: "10" },
        });
        expect(screen.getByDisplayValue("10")).toBeInTheDocument();
    });

    test("shows Upload Photo label initially", () => {
        render(<CreateProduct />);
        expect(screen.getByText("Upload Photo")).toBeInTheDocument();
    });

    test("creates product successfully and navigates", async () => {
        axios.post.mockResolvedValueOnce({ data: { success: true } });
        render(<CreateProduct />);

        fireEvent.change(screen.getByPlaceholderText("write a name"), {
            target: { value: "Test Product" },
        });
        fireEvent.click(screen.getByText("CREATE PRODUCT"));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith("Product Created Successfully");
            expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
        });
    });

    test("shows error toast when product creation returns success false", async () => {
        axios.post.mockResolvedValueOnce({
            data: { success: false, message: "Creation failed" },
        });
        render(<CreateProduct />);
        fireEvent.click(screen.getByText("CREATE PRODUCT"));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Creation failed");
        });
    });

    test("shows error toast when product creation throws", async () => {
        axios.post.mockRejectedValueOnce(new Error("Server error"));
        render(<CreateProduct />);
        fireEvent.click(screen.getByText("CREATE PRODUCT"));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("something went wrong");
        });
    });

    test("sets category when Select category changes", async () => {
        render(<CreateProduct />);
        await waitFor(() => screen.getByText("Electronics"));

        const categorySelect = screen.getByRole("combobox", {
            name: /Select a category/i
        });
        fireEvent.change(categorySelect, { target: { value: "c1" } });

        expect(categorySelect.value).toBe("c1");
    });

    test("sets shipping when Select Shipping changes", async () => {
        render(<CreateProduct />);

        const shippingSelect = screen.getByRole("combobox", {
            name: /Select Shipping/i
        });
        fireEvent.change(shippingSelect, { target: { value: "1" } });

        expect(shippingSelect.value).toBe("1");
    });

    test("sets photo when file is uploaded and shows filename", () => {
        render(<CreateProduct />);

        const fakeFile = new File(["image"], "photo.jpg", { type: "image/jpeg" });

        const fileInput = document.querySelector('input[type="file"]');

        fireEvent.change(fileInput, {
            target: { files: [fakeFile] },
        });

        expect(screen.getByText("photo.jpg")).toBeInTheDocument();
    });
});