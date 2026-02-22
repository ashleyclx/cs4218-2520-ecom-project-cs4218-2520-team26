import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import About from "./About";

jest.mock("../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout">
    <div data-testid="layout-title">{title}</div>
    {children}
  </div>
));

// Khoo Jing Xiang, A0252605L
describe("About page", () => {
  it("should render inside Layout with correct title", () => {
    // Arrange (Nothing needed)

    // Act
    render(<About />);

    // Assert
    const layout = screen.getByTestId("layout");
    const title = screen.getByTestId("layout-title");

    expect(layout).toBeInTheDocument();
    expect(title).toHaveTextContent("About us - Ecommerce app");
  });

  it("should render about image with correct src + alt", () => {
    // Arrange (Nothing needed)

    // Act
    render(<About />);

    // Assert
    const img = screen.getByAltText("contactus");

    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/about.jpeg");
  });

  it("should render the about text", () => {
    // Arrange (Nothing needed)

    // Act
    render(<About />);
    
    // Assert
    const text = screen.getByText(/add text/i);

    expect(text).toBeInTheDocument();
  });
});
