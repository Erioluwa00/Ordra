# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
# Ordra - Vendor Order & Customer Tracking MVP

Welcome to the Ordra repository. This document outlines the Minimum Viable Product (MVP) plan for the web application, designed to help vendors seamlessly record customers and track orders without stress.

## MVP Goal
Build a sleek, premium, and dynamic web application. The core focus is on removing the stress of manual bookkeeping for vendors. To achieve a fast time-to-market and immediate usability, the MVP will utilize React and persist data locally in the browser (`localStorage`), which can later be easily swapped to a real backend database (like Supabase or Firebase).

## MVP Features Scope

### 1. Dashboard Overview
- High-level metrics: Total Revenue, Total Orders, Active Customers.
- Quick Actions: "New Order", "Add Customer".
- Recent Activity: A quick table showing the latest 5 orders and their statuses.

### 2. Customer Management
- List all customers in a modern table format.
- Create, Edit, and Delete customers.
- Core attributes: Full Name, Phone Number, Email (Optional), and Address.

### 3. Order Tracking
- List orders with status badges (Pending, Processing, Completed, Cancelled).
- Order creation flow:
  - Select an existing customer or quick-add a new one.
  - Add items (Item Name, Price, Quantity).
  - Calculate subtotal and total.
- Change order statuses with a simple dropdown or button group.

## Technical Architecture (MVP)

- **Frontend Framework**: React (bootstrapped with Vite, available in `ordra_frontend/`).
- **Routing**: React Router DOM for Client-Side Routing.
- **Styling**: Modern, vanilla CSS implementing a rich aesthetic (glassmorphism, vibrant colors in dark mode, micro-animations) prioritizing no-framework overhead for maximum flexibility.
- **Icons**: Lucide-react for sharp, scalable SVG iconography.
- **Data Persistence**: A custom `useData` React hook that interfaces with the browser's `localStorage` to emulate a database in the client.

## Development Phases

1. **Phase 1: Foundation & Design System**
   - Clean up Vite template.
   - Setup global CSS styles, CSS variables, typography (Inter), and layout components.
2. **Phase 2: Hooks & State Layer**
   - Implement `useData`, `useCustomers`, and `useOrders` hooks.
3. **Phase 3: Reusable UI Components**
   - Build Buttons, Inputs, Cards, and Tables.
4. **Phase 4: Assembly**
   - Develop Dashboard, Customers, and Orders pages using the built components and hooks.

---
*This plan is meant to act as a living guide while developing the Ordra MVP. It will be updated as the product evolves.*
