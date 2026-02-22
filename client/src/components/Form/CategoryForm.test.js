import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CategoryForm from "./CategoryForm";

// Emberlynn Loo, A0255614E

describe("CategoryForm", () => {

    test("renders input field and submit button", () => {
        render(<CategoryForm handleSubmit={jest.fn()} value="" setValue={jest.fn()} />);
        expect(screen.getByPlaceholderText("Enter new category")).toBeInTheDocument();
        expect(screen.getByText("Submit")).toBeInTheDocument();
    });

    test("displays the current value in input", () => {
        render(<CategoryForm handleSubmit={jest.fn()} value="Electronics" setValue={jest.fn()} />);
        expect(screen.getByDisplayValue("Electronics")).toBeInTheDocument();
    });

    test("calls setValue when user types in input", () => {
        const setValue = jest.fn();
        render(<CategoryForm handleSubmit={jest.fn()} value="" setValue={setValue} />);
        fireEvent.change(screen.getByPlaceholderText("Enter new category"), {
            target: { value: "Books" },
        });
        expect(setValue).toHaveBeenCalledWith("Books");
    });

    test("calls handleSubmit when form is submitted", () => {
        const handleSubmit = jest.fn((e) => e.preventDefault());
        render(<CategoryForm handleSubmit={handleSubmit} value="Books" setValue={jest.fn()} />);
        fireEvent.submit(screen.getByRole("button", { name: /submit/i }));
        expect(handleSubmit).toHaveBeenCalled();
    });

    test("calls handleSubmit when submit button is clicked", () => {
        const handleSubmit = jest.fn((e) => e.preventDefault());
        render(<CategoryForm handleSubmit={handleSubmit} value="Books" setValue={jest.fn()} />);
        fireEvent.click(screen.getByText("Submit"));
        expect(handleSubmit).toHaveBeenCalled();
    });

    test("input is empty when value prop is empty string", () => {
        render(<CategoryForm handleSubmit={jest.fn()} value="" setValue={jest.fn()} />);
        expect(screen.getByPlaceholderText("Enter new category").value).toBe("");
    });

});