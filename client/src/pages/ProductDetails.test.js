import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import ProductDetails from "./ProductDetails";

//Emberlynn Loo, A0255614E

jest.mock("axios");
jest.mock("./../components/Layout", () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>,
}));
jest.mock("../styles/ProductDetailsStyles.css", () => { });
jest.mock("react-router-dom", () => ({
    useParams: jest.fn(),
    useNavigate: jest.fn(),
}));

import { useParams, useNavigate } from "react-router-dom";

const mockNavigate = jest.fn();
const mockProduct = {
    _id: "p1",
    name: "Laptop",
    description: "A great laptop",
    price: 999,
    slug: "laptop",
    category: { _id: "c1", name: "Electronics" },
};
const mockRelated = [
    {
        _id: "p2",
        name: "Phone",
        description: "A great smartphone for calls and browsing the web ok",
        price: 499,
        slug: "phone",
    },
];

describe("ProductDetails", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useNavigate.mockReturnValue(mockNavigate);
        useParams.mockReturnValue({ slug: "laptop" });
        axios.get.mockImplementation((url) => {
            if (url.includes("get-product")) {
                return Promise.resolve({ data: { product: mockProduct } });
            }
            if (url.includes("related-product")) {
                return Promise.resolve({ data: { products: mockRelated } });
            }
            return Promise.resolve({ data: {} });
        });
    });

    test("renders Product Details heading", async () => {
        render(<ProductDetails />);
        await waitFor(() => {
            expect(screen.getByText("Product Details")).toBeInTheDocument();
        });
    });

    test("fetches product on mount when slug exists", async () => {
        render(<ProductDetails />);
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(
                "/api/v1/product/get-product/laptop"
            );
        });
    });

    test("does not fetch when slug is missing", async () => {
        useParams.mockReturnValue({});
        render(<ProductDetails />);
        expect(axios.get).not.toHaveBeenCalled();
    });

    test("displays product details correctly", async () => {
        render(<ProductDetails />);
        await waitFor(() => {
            expect(screen.getByText("Name : Laptop")).toBeInTheDocument();
            expect(screen.getByText("Description : A great laptop")).toBeInTheDocument();
            expect(screen.getByText("Category : Electronics")).toBeInTheDocument();
        });
    });

    test("displays product price formatted as currency", async () => {
        render(<ProductDetails />);
        await waitFor(() => {
            expect(screen.getByText(/\$999\.00/)).toBeInTheDocument();
        });
    });

    test("renders product image with correct src", async () => {
        render(<ProductDetails />);
        await waitFor(() => screen.getByText("Name : Laptop"));
        const images = screen.getAllByRole("img");
        expect(images[0]).toHaveAttribute(
            "src",
            "/api/v1/product/product-photo/p1"
        );
    });

    test("fetches similar products after getting product", async () => {
        render(<ProductDetails />);
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(
                "/api/v1/product/related-product/p1/c1"
            );
        });
    });

    test("displays similar products", async () => {
        render(<ProductDetails />);
        await waitFor(() => {
            expect(screen.getByText("Phone")).toBeInTheDocument();
            expect(screen.getByText("$499.00")).toBeInTheDocument();
        });
    });

    test("shows no similar products message when empty", async () => {
        axios.get.mockImplementation((url) => {
            if (url.includes("get-product")) {
                return Promise.resolve({ data: { product: mockProduct } });
            }
            return Promise.resolve({ data: { products: [] } });
        });
        render(<ProductDetails />);
        await waitFor(() => {
            expect(
                screen.getByText("No Similar Products found")
            ).toBeInTheDocument();
        });
    });

    test("navigates to product on More Details click", async () => {
        render(<ProductDetails />);
        await waitFor(() => screen.getByText("Phone"));
        fireEvent.click(screen.getByText("More Details"));
        expect(mockNavigate).toHaveBeenCalledWith("/product/phone");
    });

    test("logs error when getProduct fails", async () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => { });
        axios.get.mockRejectedValueOnce(new Error("fetch failed"));
        render(<ProductDetails />);
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });
        consoleSpy.mockRestore();
    });

    test("logs error when getSimilarProduct fails", async () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => { });
        axios.get.mockImplementation((url) => {
            if (url.includes("get-product")) {
                return Promise.resolve({ data: { product: mockProduct } });
            }
            return Promise.reject(new Error("related fetch failed"));
        });
        render(<ProductDetails />);
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });
        consoleSpy.mockRestore();
    });

    test("renders ADD TO CART button", async () => {
        render(<ProductDetails />);
        await waitFor(() => {
            expect(screen.getByText("ADD TO CART")).toBeInTheDocument();
        });
    });
});