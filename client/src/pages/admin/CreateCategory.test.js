import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import CreateCategory from "./CreateCategory";

// Emberlynn Loo, A0255614E

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("./../../components/Layout", () => ({
    __esModule: true,
    default: ({ children }) => <div>{children}</div>,
}));

jest.mock("./../../components/AdminMenu", () => ({
    __esModule: true,
    default: () => <div>AdminMenu</div>,
}));

jest.mock("antd", () => ({
    Modal: ({ children, open, onCancel }) =>
        open ? (
            <div>
                <button onClick={onCancel}>Close</button>
                {children}
            </div>
        ) : null,
}));

const mockCategories = [
    { _id: "1", name: "Electronics" },
    { _id: "2", name: "Books" },
];

describe("CreateCategory", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        axios.get.mockResolvedValue({
            data: { success: true, category: mockCategories },
        });
    });

    test("renders page with heading and form", async () => {
        render(<CreateCategory />);
        expect(screen.getByText("Manage Category")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter new category")).toBeInTheDocument();
        expect(screen.getByText("Submit")).toBeInTheDocument();
    });

    test("loads and displays categories on mount", async () => {
        render(<CreateCategory />);
        await waitFor(() => {
            expect(screen.getByText("Electronics")).toBeInTheDocument();
            expect(screen.getByText("Books")).toBeInTheDocument();
        });
    });

    test("shows error toast when getAllCategory fails", async () => {
        axios.get.mockRejectedValueOnce(new Error("Network error"));
        render(<CreateCategory />);
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalled();
        });
    });

    test("submits new category successfully", async () => {
        axios.post.mockResolvedValueOnce({ data: { success: true } });
        render(<CreateCategory />);

        fireEvent.change(screen.getByPlaceholderText("Enter new category"), {
            target: { value: "Clothing" },
        });
        fireEvent.click(screen.getByText("Submit"));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                "/api/v1/category/create-category",
                { name: "Clothing" }
            );
            expect(toast.success).toHaveBeenCalledWith("Clothing is created");
        });
    });

    test("shows error toast when category creation fails with success false", async () => {
        axios.post.mockResolvedValueOnce({
            data: { success: false, message: "Already exists" },
        });
        render(<CreateCategory />);

        fireEvent.change(screen.getByPlaceholderText("Enter new category"), {
            target: { value: "Electronics" },
        });
        fireEvent.click(screen.getByText("Submit"));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Already exists");
        });
    });

    test("does not set categories when success is false", async () => {
        axios.get.mockResolvedValueOnce({
            data: { success: false, category: [] },
        });
        render(<CreateCategory />);
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalled();
        });
        expect(screen.queryByText("Electronics")).not.toBeInTheDocument();
    });

    test("shows error toast when category creation throws", async () => {
        axios.post.mockRejectedValueOnce(new Error("Server error"));
        render(<CreateCategory />);

        fireEvent.click(screen.getByText("Submit"));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Something went wrong in input form");
        });
    });

    test("opens modal and populates field when Edit is clicked", async () => {
        render(<CreateCategory />);
        await waitFor(() => screen.getByText("Electronics"));

        fireEvent.click(screen.getAllByText("Edit")[0]);

        await waitFor(() => {
            const inputs = screen.getAllByPlaceholderText("Enter new category");
            expect(inputs.length).toBe(2);
            expect(inputs[1].value).toBe("Electronics");
        });
    });

    test("updates category successfully", async () => {
        axios.put.mockResolvedValueOnce({ data: { success: true } });
        render(<CreateCategory />);
        await waitFor(() => screen.getByText("Electronics"));

        fireEvent.click(screen.getAllByText("Edit")[0]);

        await waitFor(() => screen.getByDisplayValue("Electronics"));

        const inputs = screen.getAllByPlaceholderText("Enter new category");
        const modalInput = inputs[inputs.length - 1];
        fireEvent.change(modalInput, { target: { value: "Updated Electronics" } });

        const submitButtons = screen.getAllByText("Submit");
        fireEvent.click(submitButtons[submitButtons.length - 1]);

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith("Updated Electronics is updated");
        });
    });

    test("shows error toast when update fails with success false", async () => {
        axios.put.mockResolvedValueOnce({
            data: { success: false, message: "Update failed" },
        });
        render(<CreateCategory />);
        await waitFor(() => screen.getByText("Electronics"));

        fireEvent.click(screen.getAllByText("Edit")[0]);
        await waitFor(() => screen.getByDisplayValue("Electronics"));

        const submitButtons = screen.getAllByText("Submit");
        fireEvent.click(submitButtons[submitButtons.length - 1]);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Update failed");
        });
    });

    test("shows error toast when category update throws", async () => {
        axios.post.mockRejectedValueOnce(new Error("Server error"));
        render(<CreateCategory />);
        await waitFor(() => screen.getByText("Electronics"));

        fireEvent.click(screen.getAllByText("Edit")[0]);
        await waitFor(() => {
            const inputs = screen.getAllByPlaceholderText("Enter new category");
            expect(inputs.length).toBe(2);
        });

        const submitButtons = screen.getAllByText("Submit");
        fireEvent.click(submitButtons[submitButtons.length - 1]);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Something went wrong");
        });
    });

    test("deletes category successfully", async () => {
        axios.delete.mockResolvedValueOnce({ data: { success: true } });
        render(<CreateCategory />);
        await waitFor(() => screen.getByText("Electronics"));

        fireEvent.click(screen.getAllByText("Delete")[0]);

        await waitFor(() => {
            expect(axios.delete).toHaveBeenCalledWith(
                "/api/v1/category/delete-category/1"
            );
            expect(toast.success).toHaveBeenCalledWith("category is deleted");
        });
    });

    test("shows error toast when delete fails with success false", async () => {
        axios.delete.mockResolvedValueOnce({
            data: { success: false, message: "Delete failed" },
        });
        render(<CreateCategory />);
        await waitFor(() => screen.getByText("Electronics"));

        fireEvent.click(screen.getAllByText("Delete")[0]);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Delete failed");
        });
    });

    test("shows error toast when delete throws", async () => {
        axios.delete.mockRejectedValueOnce(new Error("Server error"));
        render(<CreateCategory />);
        await waitFor(() => screen.getByText("Electronics"));

        fireEvent.click(screen.getAllByText("Delete")[0]);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Something went wrong");
        });
    });

    test("closes modal when cancel is clicked", async () => {
        render(<CreateCategory />);
        await waitFor(() => screen.getByText("Electronics"));

        fireEvent.click(screen.getAllByText("Edit")[0]);
        await waitFor(() => {
            const inputs = screen.getAllByPlaceholderText("Enter new category");
            expect(inputs.length).toBe(2);
        });

        fireEvent.click(screen.getByText("Close"));

        await waitFor(() => {
            const inputs = screen.getAllByPlaceholderText("Enter new category");
            expect(inputs.length).toBe(1);
        });
    });
});