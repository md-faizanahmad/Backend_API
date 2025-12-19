<h1>🛒 MyStore Backend – Production-Ready E-commerce API</h1>

<p>
A <strong>secure, scalable backend system</strong> powering a real-world e-commerce platform,
supporting both <strong>customer-facing shopping flows</strong> and a
<strong>full-featured admin dashboard</strong>.
</p>

<hr />

<h2>🎯 Project Purpose</h2>
<p>
This backend is designed to handle <strong>end-to-end e-commerce operations</strong> including
authentication, product management, payments, orders, invoicing, and admin analytics.
It reflects <strong>production-style backend architecture</strong>, not a demo or tutorial API.
</p>

<hr />

<h2>🧱 Core Features</h2>

<h3>🔐 Authentication & Security</h3>
<ul>
  <li>User registration and login using JWT (HttpOnly cookies)</li>
  <li>Email verification and OTP-based authentication</li>
  <li>Password hashing with bcrypt</li>
  <li>Role-based access control (User / Admin)</li>
  <li>Secure admin authentication with Google OAuth and JWT verification</li>
</ul>

<h3>🛍️ Product & Catalog Management</h3>
<ul>
  <li>Product CRUD operations with Cloudinary image uploads</li>
  <li>Category management</li>
  <li>Search, filtering, and pagination</li>
  <li>Inventory and stock tracking (Admin)</li>
</ul>

<h3>🛒 Cart, Checkout & Payments</h3>
<ul>
  <li>Cart add, update, and remove logic</li>
  <li>Razorpay payment integration</li>
  <li>Address handling during checkout</li>
  <li>Order creation after successful payment</li>
</ul>

<h3>📦 Orders & Post-Purchase</h3>
<ul>
  <li>Order tracking with status updates</li>
  <li>Admin-controlled order lifecycle</li>
  <li>Automatic PDF invoice generation</li>
  <li>Invoice delivery via email and user dashboard download</li>
</ul>

<h3>📊 Admin & Business Capabilities</h3>
<ul>
  <li>Sales and order analytics</li>
  <li>Profit and inventory insights</li>
  <li>User and order management</li>
  <li>Analytics-ready APIs for dashboards</li>
</ul>

<hr />

<h2>🧰 Tech Stack</h2>

<ul>
  <li><strong>Runtime:</strong> Node.js (ES Modules)</li>
  <li><strong>Framework:</strong> Express.js</li>
  <li><strong>Database:</strong> MongoDB + Mongoose</li>
  <li><strong>Authentication:</strong> JWT, bcrypt</li>
  <li><strong>Validation:</strong> Zod</li>
  <li><strong>Payments:</strong> Razorpay</li>
  <li><strong>File Uploads:</strong> Multer + Cloudinary</li>
  <li><strong>Email:</strong> Nodemailer</li>
  <li><strong>PDF Invoices:</strong> pdfkit, pdfkit-table</li>
  <li><strong>Testing:</strong> Node Test Runner, Supertest, MongoDB Memory Server</li>
  <li><strong>Deployment:</strong> Serverless-ready (Vercel Functions)</li>
</ul>

<hr />

<h2>🧠 Engineering Highlights</h2>
<ul>
  <li>Clean separation of routes, controllers, services, and validation layers</li>
  <li>Schema-based validation to prevent invalid API requests</li>
  <li>Secure cookie-based authentication (no localStorage tokens)</li>
  <li>Real payment workflow (not mocked)</li>
  <li>Production-style invoice generation and email delivery</li>
  <li>Designed for scalability and maintainability</li>
</ul>

<hr />

<h2>🔗 Related Applications</h2>
<ul>
  <li>Customer Storefront (React-based frontend)</li>
  <li>Admin Dashboard (React with analytics)</li>
</ul>

<hr />

<h2>🚀 Project Status</h2>
<p>
Actively developed and improved.
Built to demonstrate <strong>real backend responsibilities</strong> expected in
<strong>junior to mid-level full-stack developer roles</strong>.
</p>
