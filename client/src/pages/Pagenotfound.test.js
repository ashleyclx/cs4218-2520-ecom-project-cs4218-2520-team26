import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Pagenotfound from "./Pagenotfound";

jest.mock("../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout">
    <div data-testid="layout-title">{title}</div>
    {children}
  </div>
));

// Khoo Jing Xiang, A0252605L

describe("Pagenotfound page", () => {
  it("should render 404 and heading", () => {
    // Arrange (Nothing needed)

    // Act
    render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>
    );

    // Assert
    const code = screen.getByText("404");
    const heading = screen.getByRole("heading", { name: /oops ! page not found/i });

    expect(code).toBeInTheDocument();
    expect(heading).toBeInTheDocument();
  });

  it("should render inside Layout with correct title", () => {
    // Arrange (Nothing needed)

    // Act
    render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>
    );

    // Assert
    const layoutTitle = screen.getByTestId("layout-title");

    expect(layoutTitle).toHaveTextContent("go back- page not found");
  });

  it("should render Go Back link to /", () => {
    // Arrange (Nothing needed)

    // Act
    render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>
    );

    // Assert
    const link = screen.getByRole("link", { name: /go back/i });

    expect(link).toHaveAttribute("href", "/");
  });
});
