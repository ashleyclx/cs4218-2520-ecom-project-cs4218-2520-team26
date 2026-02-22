import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Layout from "./Layout";

jest.mock("./Header", () => () => <div data-testid="header">Header</div>);
jest.mock("./Footer", () => () => <div data-testid="footer">Footer</div>);

jest.mock("react-hot-toast", () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

// Khoo Jing Xiang, A0252605L
describe("Layout", () => {
  it("should render Header, Footer, Toaster and children", () => {
    // Arrange (Nothing needed)

    // Act
    render(
      <Layout title="My Page">
        <div data-testid="child">Hello</div>
      </Layout>
    );

    // Assert
    const header = screen.getByTestId("header");
    const footer = screen.getByTestId("footer");
    const toaster = screen.getByTestId("toaster");
    const child = screen.getByTestId("child");

    expect(header).toBeInTheDocument();
    expect(footer).toBeInTheDocument();
    expect(toaster).toBeInTheDocument();
    expect(child).toHaveTextContent("Hello");
  });

  it("should set document title from props", async () => {
    // Arrange (Nothing needed)

    // Act
    render(
      <Layout title="Custom Title">
        <div>Content</div>
      </Layout>
    );

    // Assert
    await waitFor(() => {
      expect(document.title).toBe("Custom Title");
    });
  });

  it("should use default title when none provided", async () => {
    // Arrange (Nothing needed)

    // Act
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    // Assert
    await waitFor(() => {
      expect(document.title).toBe("Ecommerce app - shop now");
    });
  });
});
