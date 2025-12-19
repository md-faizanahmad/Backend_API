MyStore Backend – Production-Ready E-commerce API

A scalable, secure backend system powering the MyStore e-commerce platform, supporting customer shopping workflows and a full-featured admin dashboard.
Designed to reflect real-world business logic, not a demo or toy API.

🎯 Purpose (Why this backend exists)

This backend handles end-to-end e-commerce operations, including authentication, product management, payments, orders, invoices, and admin analytics — similar to what small to mid-scale production systems use.

It is built with clean architecture, validation, and security best practices, and is serverless-ready for modern deployments.

🧱 Core Capabilities
🔐 Authentication & Security

User registration and login with JWT (HttpOnly cookies)

Email verification & OTP-based login

Password hashing using bcrypt

Role-based access (User / Admin)

Secure admin authentication (Google OAuth + JWT verification)

🛍️ Product & Catalog Management

Product CRUD with image uploads (Cloudinary)

Category management

Search, filters, pagination

Stock and inventory tracking (Admin)

🛒 Cart, Checkout & Payments

Cart add/update/remove logic

Razorpay payment integration

Address management during checkout

Order creation after successful payment

📦 Orders & Post-Purchase Flow

Order tracking with status updates

Admin-controlled order lifecycle

Automatic PDF invoice generation

Invoice emailed to customer + downloadable from dashboard

📊 Admin & Business Features

Sales and order analytics

Profit and inventory insights

User and order management dashboards

Real-time data ready for chart visualization

📩 Notifications & Emails

Transactional emails via Nodemailer

Order confirmation and invoice delivery

System notifications support

🧰 Tech Stack

Runtime & Framework

Node.js (ES Modules)

Express.js

Database

MongoDB + Mongoose

Authentication & Validation

JWT + bcrypt

Zod schema validation

Payments & Media

Razorpay (test & live ready)

Multer + Cloudinary

Documents & Emails

pdfkit + pdfkit-table (Invoice generation)

Nodemailer

Testing & Quality

Node Test Runner

Supertest

MongoDB Memory Server

Deployment

Serverless-ready (serverless-http)

Optimized for Vercel Functions

🧠 Engineering Highlights (What recruiters should notice)

Clear separation of routes, controllers, services, and validations

Defensive programming with schema validation (Zod)

Secure cookie-based authentication (not localStorage)

Real payment workflow (not mocked)

Production-style invoice generation and email delivery

Written with scalability and maintainability in mind
