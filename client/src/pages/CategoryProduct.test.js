import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import CategoryProduct from "./CategoryProduct";

//Emberlynn Loo, A0255614E

jest.mock("axios");
jest.mock("../components/Layout", () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>,
}));
jest.mock("../styles/CategoryProductStyles.css", () => { });
jest.mock("react-router-dom", () => ({
    useParams: jest.fn(),
    useNavigate: jest.fn(),
}));

import { useParams, useNavigate } from "react-router-dom";

const mockNavigate = jest.fn();
const mockProducts = [
    {
        _id: "p1",
        name: "Laptop",
        description: "A really great laptop for everyday use and work",
        price: 999,
        slug: "laptop",
    },
    {
        _id: "p2",
        name: "Phone",
        description: "A great smartphone for calls and browsing the web",
        price: 499,
        slug: "phone",
    },
];
const mockCategory = { _id: "c1", name: "Electronics" };

describe("CategoryProduct", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useNavigate.mockReturnValue(mockNavigate);
        useParams.mockReturnValue({ slug: "electronics" });
        axios.get.mockResolvedValue({
            data: { products: mockProducts, category: mockCategory },
        });
    });

    test("renders category and product count", async () => {
        render(<CategoryProduct />);
        await waitFor(() => {
            expect(screen.getByText("Category - Electronics")).toBeInTheDocument();
            expect(screen.getByText("2 result found")).toBeInTheDocument();
        });
    });

    test("fetches products by category slug on mount", async () => {
        render(<CategoryProduct />);
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(
                "/api/v1/product/product-category/electronics"
            );
        });
    });

    test("does not fetch when slug is missing", async () => {
        useParams.mockReturnValue({});
        render(<CategoryProduct />);
        await waitFor(() => expect(axios.get).not.toHaveBeenCalled());
    });

    test("displays product names and prices", async () => {
        render(<CategoryProduct />);
        await waitFor(() => {
            expect(screen.getByText("Laptop")).toBeInTheDocument();
            expect(screen.getByText("Phone")).toBeInTheDocument();
            expect(screen.getByText("$999.00")).toBeInTheDocument();
            expect(screen.getByText("$499.00")).toBeInTheDocument();
        });
    });

    test("truncates product description to 60 chars", async () => {
        render(<CategoryProduct />);
        await waitFor(() => {
            expect(
                screen.getByText("A really great laptop for everyday use and work...")
            ).toBeInTheDocument();
        });
    });

    test("renders product images with correct src and alt", async () => {
        render(<CategoryProduct />);
        await waitFor(() => screen.getByText("Laptop"));
        const images = screen.getAllByRole("img");
        expect(images[0]).toHaveAttribute(
            "src",
            "/api/v1/product/product-photo/p1"
        );
        expect(images[0]).toHaveAttribute("alt", "Laptop");
    });

    test("navigates to product detail on More Details click", async () => {
        render(<CategoryProduct />);
        await waitFor(() => screen.getByText("Laptop"));
        const buttons = screen.getAllByText("More Details");
        fireEvent.click(buttons[0]);
        expect(mockNavigate).toHaveBeenCalledWith("/product/laptop");
    });

    test("logs error when fetch fails", async () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => { });
        axios.get.mockRejectedValueOnce(new Error("fetch failed"));
        render(<CategoryProduct />);
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });
        consoleSpy.mockRestore();
    });

    test("shows 0 result found when no products", async () => {
        axios.get.mockResolvedValueOnce({
            data: { products: [], category: mockCategory },
        });
        render(<CategoryProduct />);
        await waitFor(() => {
            expect(screen.getByText("0 result found")).toBeInTheDocument();
        });
    });
});