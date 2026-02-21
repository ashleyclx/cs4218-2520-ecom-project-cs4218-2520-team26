import React from "react";
import { render, screen } from "@testing-library/react";
import Categories from "./Categories";

// Earnest Suprapmo, A0251966U
// Mock the useCategory hook so we can fully control its output
const mockUseCategory = jest.fn();
jest.mock("../hooks/useCategory", () => ({
  __esModule: true,
  default: () => mockUseCategory(),
}));

// Simplify Layout to avoid pulling in Header/Footer and router dependencies
jest.mock("../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));

// Mock Link so we do not need an actual Router and can assert hrefs
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  Link: ({ to, children, ...rest }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

describe("Categories page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a list of categories with correct links", () => {
    // Arrange
    const mockCategories = [
      { _id: "cat1", name: "Category One", slug: "category-one" },
      { _id: "cat2", name: "Category Two", slug: "category-two" },
    ];
    mockUseCategory.mockReturnValue(mockCategories);

    // Act
    render(<Categories />);

    // Assert
    mockCategories.forEach((category) => {
      const link = screen.getByRole("link", { name: category.name });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", `/category/${category.slug}`);
    });
  });

  it("renders no category links when useCategory returns an empty list", () => {
    // Arrange
    mockUseCategory.mockReturnValue([]);

    // Act
    render(<Categories />);

    // Assert
    expect(screen.queryByRole("link")).toBeNull();
  });
});
