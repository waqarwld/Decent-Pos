# Requirements Document

## Introduction

An Angular-based frontend application for a Point of Sale (POS) inventory management system, delivered as a Docker container. The application connects to an existing Go REST API at http://localhost:8080 and provides two main areas: a POS home page for day-to-day sales operations, and an administration section for managing products, categories, locations, suppliers, inventory movements, and reports. All API routes require JWT Bearer token authentication.

## Glossary

- **POS_App**: The Angular frontend application running in a Docker container
- **Auth_Service**: The Angular service responsible for JWT token management and authentication state
- **API_Client**: The Angular HTTP service layer that communicates with the Go REST API at http://localhost:8080
- **POS_Interface**: The point-of-sale home page used for day-to-day sales operations
- **Admin_Section**: The administration area of the application for managing system data
- **JWT_Token**: JSON Web Token used as a Bearer token for authenticating API requests
- **Product**: A sellable item with a SKU, name, price, category, and stock information
- **SKU**: Stock Keeping Unit — a unique identifier for a product
- **Category**: A grouping classification for products
- **Location**: A physical or logical storage location for inventory
- **Supplier**: A vendor or provider of products
- **Inventory_Movement**: A record of stock change — receive, ship, transfer, or adjust
- **Stock_Alert**: A notification triggered when a product's stock falls below a defined threshold
- **Docker_Container**: The containerized deployment unit for the POS_App

---

## Requirements

### Requirement 1: Authentication

**User Story:** As a user, I want to log in with my credentials, so that I can securely access the POS system.

#### Acceptance Criteria

1. THE POS_App SHALL display a login form with username and password fields before granting access to any protected route.
2. WHEN a user submits valid credentials, THE Auth_Service SHALL store the JWT_Token in browser session storage and redirect the user to the POS_Interface.
3. WHEN a user submits invalid credentials, THE Auth_Service SHALL display a descriptive error message without exposing internal error details.
4. WHEN a JWT_Token is present in session storage on application load, THE Auth_Service SHALL restore the authenticated session without requiring re-login.
5. WHEN a JWT_Token expires or is rejected by the API, THE Auth_Service SHALL clear the stored token and redirect the user to the login page.
6. WHEN a user clicks logout, THE Auth_Service SHALL remove the JWT_Token from session storage and redirect to the login page.
7. THE API_Client SHALL attach the JWT_Token as a Bearer token Authorization header to every request to /api/v1/* routes.

---

### Requirement 2: POS Home Page

**User Story:** As a cashier, I want a point-of-sale interface, so that I can quickly look up products and process sales transactions.

#### Acceptance Criteria

1. WHEN the POS_Interface loads, THE POS_App SHALL display a product search input and a current transaction panel.
2. WHEN a user enters a SKU or product name in the search input, THE API_Client SHALL query GET /api/v1/products and display matching results within 500ms of the last keystroke using debounce.
3. WHEN a user selects a product from search results, THE POS_Interface SHALL add the product to the current transaction with a quantity of 1.
4. WHILE a product is in the current transaction, THE POS_Interface SHALL allow the user to increase, decrease, or remove the item quantity.
5. THE POS_Interface SHALL display a running total for the current transaction, calculated from item prices and quantities.
6. WHEN a user completes a transaction, THE API_Client SHALL submit a ship inventory movement via POST /api/v1/inventory/ship for each line item.
7. WHEN a transaction is successfully submitted, THE POS_Interface SHALL clear the current transaction and display a confirmation message.
8. IF the API_Client receives an error response during transaction submission, THEN THE POS_Interface SHALL display the error and preserve the current transaction state.

---

### Requirement 3: Product Management

**User Story:** As an administrator, I want to manage products, so that I can keep the product catalog accurate and up to date.

#### Acceptance Criteria

1. WHEN an administrator navigates to the products section, THE Admin_Section SHALL display a paginated list of all products retrieved from GET /api/v1/products.
2. WHEN an administrator submits a new product form, THE API_Client SHALL send a POST request to /api/v1/products with the product data.
3. WHEN an administrator edits an existing product, THE API_Client SHALL send a PUT request to /api/v1/products/{id} with the updated data.
4. WHEN an administrator deletes a product, THE API_Client SHALL send a DELETE request to /api/v1/products/{id} after the administrator confirms the action.
5. WHEN an administrator searches by SKU, THE API_Client SHALL query GET /api/v1/products/sku/{sku} and display the matching product.
6. IF the API_Client receives a 404 response for a SKU lookup, THEN THE Admin_Section SHALL display a "Product not found" message.
7. THE Admin_Section SHALL validate that SKU, name, and price fields are non-empty before submitting a product form.

---

### Requirement 4: Category Management

**User Story:** As an administrator, I want to manage product categories, so that products can be organized and filtered effectively.

#### Acceptance Criteria

1. WHEN an administrator navigates to the categories section, THE Admin_Section SHALL display a list of all categories retrieved from GET /api/v1/categories.
2. WHEN an administrator submits a new category form, THE API_Client SHALL send a POST request to /api/v1/categories.
3. WHEN an administrator edits a category, THE API_Client SHALL send a PUT request to /api/v1/categories/{id} with the updated data.
4. THE Admin_Section SHALL validate that the category name field is non-empty before submitting a category form.

---

### Requirement 5: Location Management

**User Story:** As an administrator, I want to manage storage locations, so that inventory can be tracked across physical or logical locations.

#### Acceptance Criteria

1. WHEN an administrator navigates to the locations section, THE Admin_Section SHALL display a list of all locations retrieved from GET /api/v1/locations.
2. WHEN an administrator submits a new location form, THE API_Client SHALL send a POST request to /api/v1/locations.
3. WHEN an administrator edits a location, THE API_Client SHALL send a PUT request to /api/v1/locations/{id} with the updated data.
4. THE Admin_Section SHALL validate that the location name field is non-empty before submitting a location form.

---

### Requirement 6: Supplier Management

**User Story:** As an administrator, I want to manage suppliers, so that I can track which vendors provide which products.

#### Acceptance Criteria

1. WHEN an administrator navigates to the suppliers section, THE Admin_Section SHALL display a list of all suppliers retrieved from GET /api/v1/suppliers.
2. WHEN an administrator submits a new supplier form, THE API_Client SHALL send a POST request to /api/v1/suppliers.
3. WHEN an administrator edits a supplier, THE API_Client SHALL send a PUT request to /api/v1/suppliers/{id} with the updated data.
4. THE Admin_Section SHALL validate that the supplier name field is non-empty before submitting a supplier form.

---

### Requirement 7: Inventory Movement Management

**User Story:** As a warehouse operator, I want to record inventory movements, so that stock levels remain accurate across all locations.

#### Acceptance Criteria

1. WHEN an administrator navigates to the inventory section, THE Admin_Section SHALL display a list of recent inventory movements retrieved from GET /api/v1/inventory/movements.
2. WHEN an administrator submits a receive movement form, THE API_Client SHALL send a POST request to /api/v1/inventory/receive with the product, location, quantity, and supplier data.
3. WHEN an administrator submits a ship movement form, THE API_Client SHALL send a POST request to /api/v1/inventory/ship with the product, location, and quantity data.
4. WHEN an administrator submits a transfer movement form, THE API_Client SHALL send a POST request to /api/v1/inventory/transfer with the product, source location, destination location, and quantity data.
5. WHEN an administrator submits an adjust movement form, THE API_Client SHALL send a POST request to /api/v1/inventory/adjust with the product, location, quantity delta, and reason data.
6. THE Admin_Section SHALL validate that all required fields for each movement type are non-empty before submitting a movement form.
7. IF the API_Client receives an error response for a movement submission, THEN THE Admin_Section SHALL display the error message returned by the API.

---

### Requirement 8: Reports and Dashboard

**User Story:** As a manager, I want to view inventory reports, so that I can make informed decisions about stock levels and purchasing.

#### Acceptance Criteria

1. WHEN an administrator navigates to the reports section, THE Admin_Section SHALL display a dashboard with summary data retrieved from GET /api/v1/reports/stock/summary.
2. WHEN an administrator views the stock report, THE API_Client SHALL retrieve data from GET /api/v1/reports/stock and display current stock levels per product and location.
3. WHEN an administrator views stock alerts, THE API_Client SHALL retrieve data from GET /api/v1/reports/stock/alerts and display products with low stock highlighted.
4. WHEN an administrator views the valuation report, THE API_Client SHALL retrieve data from GET /api/v1/reports/valuation and display total inventory value.
5. WHEN an administrator views the turnover report, THE API_Client SHALL retrieve data from GET /api/v1/reports/turnover and display product movement frequency.
6. WHEN an administrator views the supplier performance report, THE API_Client SHALL retrieve data from GET /api/v1/reports/suppliers/performance and display per-supplier metrics.
7. WHEN an administrator views recent movements, THE API_Client SHALL retrieve data from GET /api/v1/reports/movements/recent and display a time-ordered list.
8. WHEN an administrator views the aging report, THE API_Client SHALL retrieve data from GET /api/v1/reports/stock/aging and display products by time in inventory.

---

### Requirement 9: Navigation and Layout

**User Story:** As a user, I want clear navigation between the POS and administration areas, so that I can move efficiently between tasks.

#### Acceptance Criteria

1. THE POS_App SHALL provide a top-level navigation structure with a POS home route and an Admin_Section route.
2. WHILE a user is authenticated, THE POS_App SHALL display a persistent navigation bar with links to the POS_Interface and Admin_Section.
3. WHEN an unauthenticated user attempts to access a protected route, THE POS_App SHALL redirect the user to the login page.
4. THE Admin_Section SHALL provide a sidebar or sub-navigation with links to products, categories, locations, suppliers, inventory, and reports sections.
5. WHEN the application cannot reach the API health endpoint GET /health, THE POS_App SHALL display a connectivity warning to the user.

---

### Requirement 10: Docker Containerization

**User Story:** As a DevOps engineer, I want the frontend packaged as a Docker container, so that it can be deployed consistently across environments.

#### Acceptance Criteria

1. THE Docker_Container SHALL use a multi-stage Dockerfile: a build stage using a Node image to compile the Angular application, and a serve stage using an Nginx image to serve the static output.
2. THE Docker_Container SHALL expose port 80 for HTTP traffic.
3. THE Docker_Container SHALL serve the Angular application from the Nginx default static file directory.
4. WHEN the Angular application is built inside the Docker_Container, THE POS_App SHALL configure the API base URL via an environment variable so that it can be overridden at build time without modifying source code.
5. THE Docker_Container SHALL include an Nginx configuration that redirects all routes to index.html to support Angular client-side routing.
