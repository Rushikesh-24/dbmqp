# **Restaurant Order & Kitchen Display System**

## **Project Overview**

This project is a comprehensive solution designed to streamline the ordering process for restaurant customers and provide an efficient kitchen display system for restaurant staff. It aims to enhance the dining experience by offering a seamless way for customers to place and manage their orders, while simultaneously empowering restaurants with tools to manage food preparation and track sales effectively.

The system is built with a focus on real-time updates and a user-friendly interface, ensuring a smooth flow from order placement to meal delivery.

## **Features**

### **Customer-Facing Application**

- **Intuitive Order Placement:** Customers can easily browse the menu and add items to their cart.
- **Dynamic Cart Management:**
  - Add new items to an existing order.
  - Increase the quantity of already ordered items (additional quantities are treated as new additions to the order).
  - Remove newly added items from the cart before placing the order.
  - Existing, placed order items cannot be removed or have their quantity decreased below the originally ordered amount.
- **Special Instructions:** Customers can add specific notes or requests for their order items.
- **Real-time Bill Summary:** Displays subtotal, taxes (18% GST), delivery fees (free for orders over ₹500), and the total amount.
- **Integrated Checkout & Payment:**
  - "Pay Bills" option triggers a payment modal.
  - Simulated payment process that finalizes the order.
  - Updates order status to "completed" and marks the associated table as "available" after successful payment.
- **User Legacy Points:** Customers earn 10 base points per order, plus 1 additional point for every ₹100 spent.
- **Order History Dashboard:** A collapsible section on the order page showing a summary of previous orders and total lifetime spending.

### **Restaurant-Facing Kitchen Display System**

- **Real-time Pending Orders:** Displays all pending orders for a specific restaurant.
- **Prioritized Cooking Plan:** Each order's items are dynamically sorted based on their PrepTimeMinutes and CookTimeMinutes, ensuring kitchen staff start with items that take the longest to prepare.
- **Item Status Updates:** Kitchen staff can update the status of individual items (e.g., from "pending" to "preparing" to "ready").
- **Order Completion Tracking:** Completed orders are automatically removed from the pending list.
- **Restaurant Sales Dashboard:** A dashboard showing the restaurant's total sales and a history of all completed orders.

## **Technologies Used**

This project leverages a modern, robust, and scalable tech stack to deliver a high-performance restaurant ordering and kitchen display system.

- Frontend: Flutter  
    Flutter is chosen for the customer-facing and restaurant display applications due to its ability to build natively compiled, high-performance applications for mobile, web, and desktop from a single codebase. This ensures a consistent and beautiful user experience across all platforms.
- Backend: Next.js API Routes  
    Next.js API Routes provide a powerful and flexible serverless backend. This allows for rapid development of RESTful APIs, handling order processing, status updates, and data retrieval with efficiency and scalability.
- Database: Turso (SQLite)  
    Turso is utilized as the database solution for its lightweight nature and edge-friendly capabilities. Built on SQLite, Turso offers excellent performance for read-heavy workloads and simplifies database management. Its ability to run close to your users (at the "edge") ensures low latency and a highly responsive application, making it ideal for real-time order management.

## **Team Members**

- Rushikesh Gaonkar
- Shikhaa Prabhudesai
- Shrutvika Mapari
