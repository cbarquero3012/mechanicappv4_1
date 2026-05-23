# MechanicApp — User Guide

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Dashboard](#3-dashboard)
4. [Customer Management](#4-customer-management)
5. [Vehicle Management](#5-vehicle-management)
6. [Mechanic Management](#6-mechanic-management)
7. [Inventory](#7-inventory)
8. [Repair Orders](#8-repair-orders)
9. [Payments](#9-payments)
10. [Currencies](#10-currencies)
11. [User Management](#11-user-management)
12. [App Settings](#12-app-settings)
13. [Subscription](#13-subscription)
14. [User Roles & Permissions](#14-user-roles--permissions)

---

## 1. Introduction

**MechanicApp** is a web-based workshop management system designed for automotive repair shops. It allows you to manage customers, vehicles, mechanics, inventory (parts, products, and services), repair orders, payments, and multi-currency billing — all from a single application.

### Key Features

- Customer and vehicle registry
- Repair order lifecycle tracking (Pending → In Progress → Completed)
- Parts, Products, and Services inventory with automatic stock control
- Multi-currency support with exchange rate conversion
- Photo attachments for repair orders
- Invoice generation for orders and payments
- Role-based access control (Admin, Supervisor, Mechanic)
- Bilingual interface (English / Spanish)
- Subscription management via Stripe

---

## 2. Getting Started

### 2.1 Logging In

1. Open the application in your browser.
2. Enter your **Username** and **Password**.
3. Click **Login**.

> The default administrator account is created during installation. Contact your system administrator for credentials.

### 2.2 Navigating the Application

After login, you will see the **sidebar menu** on the left with the following sections (depending on your role):

| Menu Item | Route | Description |
|-----------------|------------------------|------------------------------------||
| Dashboard | `/dashboard` | Overview and statistics |
| Customers | `/customers` | Manage customer records |
| Cars | `/cars` | Manage vehicles, brands, and models |
| Mechanics | `/mechanics` | Manage mechanic records |
| Inventory | `/inventory` | Parts, Products, and Services |
| Repair Orders | `/repair-orders` | Create and manage work orders |
| Payments | `/payments` | Record and track payments |
| Currencies | `/currencies` | Configure exchange rates |
| Users | `/users` | Manage user accounts (Admin only) |
| Settings | `/settings` | App branding and configuration |

### 2.3 Changing Language

The application supports **English** and **Spanish**. Use the language selector in the interface to switch between them.

---

## 3. Dashboard

The Dashboard provides a real-time overview of your shop's activity.

### Key Metrics

| Metric             | Description                      |
| ------------------ | -------------------------------- |
| Total Customers    | Number of registered customers   |
| Total Vehicles     | Number of registered vehicles    |
| Total Mechanics    | Number of active mechanics       |
| Total Orders       | Total repair orders created      |
| Pending Orders     | Orders waiting to be started     |
| In Progress Orders | Orders currently being worked on |
| Completed Orders   | Finished repair orders           |
| Total Revenue      | Sum of all repair order costs    |
| Total Paid         | Sum of all recorded payments     |

### Recent Orders

A quick-view list of the 5 most recent repair orders, showing the vehicle, mechanic, status, and cost.

> **Note:** Mechanics only see their own assigned orders and statistics.

---

## 4. Customer Management

### 4.1 Viewing Customers

Navigate to **Customers** to see a list of all registered customers, sorted alphabetically by last name.

### 4.2 Adding a Customer

1. Click **Add Customer**.
2. Fill in the required fields:
   - **First Name** (required)
   - **Last Name** (required)
   - **Phone Number** (required)
   - **Email** (optional)
   - **Address** (optional)
3. Click **Save**.

### 4.3 Customer Detail

Click on a customer to see their detail page, which shows:

- Customer information
- Vehicles owned by this customer
- Quick link to add a new vehicle for this customer

### 4.4 Editing / Deleting a Customer

- Click the **Edit** button to modify customer information.
- Click **Delete** to remove a customer. Linked vehicles will have their customer reference cleared (not deleted).

---

## 5. Vehicle Management

Vehicles are organized in a three-tier hierarchy: **Brand → Model → Vehicle**.

### 5.1 Car Brands

Navigate to **Cars > Brands** to manage vehicle manufacturers.

- **Add Brand:** Enter the brand name and country of origin.
- Brands are used as a catalog for organizing car models.

### 5.2 Car Models

Navigate to **Cars > Models** to manage model names per brand.

- **Add Model:** Select a brand and enter the model name (e.g., Toyota → Camry).
- Models can be filtered by brand.

### 5.3 Vehicles (Detail Cars)

Navigate to **Cars** to see all registered vehicles.

#### Adding a Vehicle

1. Click **Add Vehicle**.
2. Fill in the fields:
   - **Brand / Model** (required) — select from the catalog
   - **Customer** (optional) — link to an existing customer
   - **VIN** (optional, unique) — Vehicle Identification Number
   - **Year** (required)
   - **Fuel Type** (required) — Gasoline, Diesel, Hybrid, Electric, etc.
   - **Vehicle Type** (required) — Sedan, SUV, Truck, Coupe, etc.
   - **Transmission** (required) — Automatic, Manual, CVT, etc.
   - **License Plate** (optional)
   - **Mileage** (optional)
3. Click **Save**.

#### Viewing Vehicles by Customer

From the Customer Detail page, you can see all vehicles belonging to that customer.

---

## 6. Mechanic Management

Navigate to **Mechanics** to manage your workshop staff.

### 6.1 Adding a Mechanic

1. Click **Add Mechanic**.
2. Fill in:
   - **First Name** (required)
   - **Last Name** (required)
   - **Specialty** (optional) — e.g., Engine Repair, Brakes, Electrical
   - **Hire Date** (optional)
   - **Active** (default: Yes)
3. Click **Save**.

### 6.2 Linking a Mechanic to a User Account

When a mechanic record is linked to a user account (with the `mechanic` role), that user will only see repair orders assigned to them.

To link:

1. First create the user account in **Users** with the `mechanic` role.
2. Edit the mechanic record and select the associated user from the dropdown.

---

## 7. Inventory

The Inventory module has three sub-sections: **Parts**, **Products**, and **Services**.

### 7.1 Parts

Parts are components used in repairs (e.g., oil filters, brake pads, batteries).

| Field       | Description                            |
| ----------- | -------------------------------------- |
| Name        | Part name                              |
| Part Number | Unique identifier code                 |
| Category    | Classification (Filters, Brakes, etc.) |
| Quantity    | Current stock level                    |
| Min Stock   | Alert threshold                        |
| Unit Cost   | Purchase price                         |
| Sell Price  | Customer price                         |
| Supplier    | Vendor name                            |
| Location    | Storage location (e.g., shelf A-1)     |
| Currency    | Price currency                         |

> **Automatic stock control:** When a part is added to a repair order, its quantity is automatically decremented. When removed from an order, the stock is restored.

### 7.2 Products

Products are consumable items sold to customers (e.g., motor oil, brake fluid, cleaning products).

| Field       | Description             |
| ----------- | ----------------------- |
| Name        | Product name            |
| SKU         | Stock Keeping Unit code |
| Category    | Classification          |
| Description | Product description     |
| Quantity    | Current stock level     |
| Min Stock   | Alert threshold         |
| Unit Cost   | Purchase price          |
| Sell Price  | Customer price          |
| Brand       | Product brand           |
| Currency    | Price currency          |

> **Automatic stock control:** Same as parts — stock is adjusted when products are added/removed from repair orders.

### 7.3 Services

Services are labor items offered by the shop (e.g., oil change, brake inspection, diagnostics).

| Field           | Description                    |
| --------------- | ------------------------------ |
| Name            | Service name                   |
| Category        | Classification                 |
| Description     | Service description            |
| Base Price      | Standard charge                |
| Estimated Hours | Expected duration              |
| Active          | Whether the service is offered |
| Currency        | Price currency                 |

> Services do **not** affect inventory stock levels.

---

## 8. Repair Orders

Repair orders are the core of MechanicApp. Each order represents a job performed on a vehicle by a mechanic.

### 8.1 Order Lifecycle

```
Pending  →  In Progress  →  Completed
                            ↘ Cancelled
```

| Status      | Meaning                                     |
| ----------- | ------------------------------------------- |
| Pending     | Order created, work not yet started         |
| In Progress | Mechanic is actively working on the vehicle |
| Completed   | Work finished                               |
| Cancelled   | Order was cancelled                         |

### 8.2 Creating a Repair Order

1. Navigate to **Repair Orders** and click **Add Order**.
2. Select:
   - **Vehicle** (optional) — the car being repaired
   - **Mechanic** (optional) — assigned technician
   - **Status** — defaults to Pending
   - **Notes** — any observations
3. Click **Save**.

> **Mechanic users** are automatically assigned as the mechanic on orders they create.

### 8.3 Order Detail Page

The order detail page is where most of the work happens. From here you can:

#### Add Services

1. Click **Add Service**.
2. Select a service from the catalog.
3. Set quantity and unit price (auto-filled from catalog).
4. The order total is automatically recalculated.

#### Add Parts

1. Click **Add Part**.
2. Select a part from inventory.
3. Set quantity and unit price.
4. Stock is **automatically decremented**.
5. The order total is recalculated.

#### Add Products

1. Click **Add Product**.
2. Select a product from inventory.
3. Set quantity and unit price.
4. Stock is **automatically decremented**.
5. The order total is recalculated.

#### Attach Photos

1. Click **Add Photo**.
2. Upload a JPG/JPEG image (max 5 MB).
3. Add an optional description.
4. Photos are stored in the `orders/{orderId}/` directory.

> Photos can be used to document the vehicle condition before, during, and after repair.

#### Generate Invoice

Click the **Invoice** button to view a printable invoice for the order, showing all services, parts, products, and totals.

### 8.4 Removing Items

When you remove a part or product from an order:

- The **stock is automatically restored**.
- The **order total is recalculated**.

---

## 9. Payments

### 9.1 Recording a Payment

1. Navigate to **Payments** and click **Add Payment**.
2. Fill in:
   - **Customer** (optional)
   - **Repair Orders** — select one or more orders to pay
   - **Amount** — total payment amount
   - **Payment Method** — Cash, Credit Card, Debit Card, Transfer, Check, or Other
   - **Reference Number** (optional) — transaction ID
   - **Currency** — payment currency
   - **Notes** (optional)
3. Click **Save**.

### 9.2 Multi-Currency Payments

If the payment is made in a currency different from the shop's default:

- The system automatically converts the amount using the configured exchange rate.
- Both the **original amount/currency** and the **converted amount** are stored.

### 9.3 Multi-Order Payments

A single payment can be distributed across multiple repair orders. The system automatically distributes the amount evenly across the selected orders.

### 9.4 Viewing Payments

- From the **Payments** list, see all recorded payments.
- From a **Repair Order** detail, see payments linked to that specific order.
- **Total Paid** is tracked per order.

### 9.5 Payment Invoice

Click the **Invoice** button on a payment to generate a printable receipt.

---

## 10. Currencies

Navigate to **Currencies** to manage the multi-currency system.

### 10.1 Default Currency

One currency must be set as **default**. This is the base currency for all calculations. It cannot be deleted.

### 10.2 Exchange Rates

Set exchange rates relative to the default currency. For example, if your default is Costa Rican Colón (CRC):

| Currency | Rate  | Meaning         |
| -------- | ----- | --------------- |
| CRC      | 1.0   | Default (base)  |
| USD      | 459.0 | 1 USD = 459 CRC |
| EUR      | 503.0 | 1 EUR = 503 CRC |

### 10.3 Adding a Currency

1. Click **Add Currency**.
2. Enter: Code (3 letters), Name, Symbol, Exchange Rate, Active status.
3. Click **Save**.

---

## 11. User Management

> Available to **Admin** and **Super Admin** roles only.

### 11.1 Creating a User

1. Navigate to **Users** and click **Add User**.
2. Fill in:
   - **Username** (required, unique)
   - **Password** (required)
   - **Full Name** (required)
   - **Email** (required)
   - **Role** — Admin, Supervisor, or Mechanic
   - **Active** — enable/disable the account
3. Click **Save**.

### 11.2 Editing a User

- You can update any field. Password is only changed if you enter a new one.
- You **cannot delete your own account**.

### 11.3 Role Descriptions

| Role        | Access                                                      |
| ----------- | ----------------------------------------------------------- |
| Super Admin | Full access, subscription management, sees all users        |
| Admin       | Full access, cannot see super-admin accounts                |
| Supervisor  | Customers, vehicles, inventory, mechanics, orders, payments |
| Mechanic    | Only their own assigned repair orders                       |

---

## 12. App Settings

> Available to **Admin** and **Super Admin** roles only.

Navigate to **Settings** to configure your shop's branding and information.

| Setting        | Description                                        |
| -------------- | -------------------------------------------------- |
| App Name       | Your shop's name (shown in header/title)           |
| Logo           | Upload a logo (PNG, JPG, SVG, ICO, WebP; max 2 MB) |
| Favicon        | Upload a favicon for the browser tab               |
| Address        | Shop address                                       |
| Phone          | Contact phone number                               |
| WhatsApp Phone | WhatsApp contact number                            |
| Email          | Contact email address                              |

### Photo Cleanup

Configure automatic cleanup of old repair order photos:

- **Photo Cleanup Days** — delete photos older than this many days (0 = disabled).
- Run cleanup manually from the settings page.

---

## 13. Subscription

MechanicApp uses a subscription model. When the subscription expires, all API access is blocked except login, settings, and subscription management.

### For Administrators

- Check subscription status from the **Subscription** page.
- Renew via the configured Stripe payment link.
- **Super Admin** can manually activate a subscription.

### Subscription Statuses

| Status    | Meaning                          |
| --------- | -------------------------------- |
| Active    | Full access to all features      |
| Inactive  | Access blocked, renewal required |
| Cancelled | Subscription was cancelled       |
| Expired   | Subscription period has ended    |

---

## 14. User Roles & Permissions

### Permission Matrix

| Feature           | Admin | Supervisor | Mechanic |
| ----------------- | :---: | :--------: | :------: |
| Dashboard         |  ✅   |     ✅     | ✅ (own) |
| Customers         |  ✅   |     ✅     |    ❌    |
| Vehicles          |  ✅   |     ✅     |    ❌    |
| Car Brands/Models |  ✅   |     ✅     |    ❌    |
| Mechanics         |  ✅   |     ✅     |    ❌    |
| Inventory (all)   |  ✅   |     ✅     |    ❌    |
| Repair Orders     |  ✅   |     ✅     | ✅ (own) |
| Payments          |  ✅   |     ✅     |    ❌    |
| Currencies        |  ✅   |     ❌     |    ❌    |
| Users             |  ✅   |     ✅     |    ❌    |
| Settings          |  ✅   |     ❌     |    ❌    |
| Subscription Mgmt |  ✅   |     ❌     |    ❌    |

---

## Quick Tips

- **Search and filter** are available on most list pages.
- **Invoice pages** are printer-friendly — use your browser's Print function (Ctrl+P / Cmd+P).
- **Stock alerts** — Monitor the Min Stock column in Parts and Products to avoid running out.
- **VIN field** is unique — no two vehicles can have the same VIN.
- Always **complete or cancel** old orders to keep your dashboard metrics accurate.

---

_MechanicApp — Workshop Management Made Simple._
