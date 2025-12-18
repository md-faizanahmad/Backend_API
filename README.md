MyAZStore Backend API
<p>A production-ready backend for the MyAZStore e-commerce platform, supporting both Shop and Admin features. Built with Node.js, Express, MongoDB, JWT authentication, Cloudinary uploads, Razorpay payments, and PDF invoice generation.</p>
📦 Tech Stack
<ul> <li><strong>Runtime:</strong> Node.js (ES Modules)</li> <li><strong>Framework:</strong> Express.js</li> <li><strong>Database:</strong> MongoDB + Mongoose</li> <li><strong>Authentication:</strong> JWT + bcrypt</li> <li><strong>File Uploads:</strong> Multer + Cloudinary</li> <li><strong>Payments:</strong> Razorpay</li> <li><strong>Emailing:</strong> Nodemailer</li> <li><strong>PDF Generation:</strong> pdfkit + pdfkit-table</li> <li><strong>Validation:</strong> Zod</li> <li><strong>Testing:</strong> Node test runner + Supertest + MongoDB Memory Server</li> <li><strong>Serverless Ready:</strong> serverless-http</li> </ul>
🔗 API Route Structure
<strong>Shop / Public Routes</strong>
<ul> <li>/v1/products</li> <li>/api/categories</li> <li>/v1/users</li> <li>/v1/wishlist</li> <li>/v1/cart</li> <li>/v1/addresses</li> <li>/v1/orders</li> <li>/v1/checkout</li> <li>/v1/payment</li> <li>/v1/invoice</li> <li>/v1/notifications</li> <li>/v1/hero</li> <li>/v1/ai</li> </ul>
<strong>Admin Routes</strong>
<ul> <li>/v1/admin</li> <li>/v1/admin/inventory</li> <li>/v1/admin/profit</li> </ul>
⚙️ Environment Variables
<p>Create a <code>.env</code> file with:</p>
PORT=
MONGO_URI=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=1d

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# SMTP
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

BASE_URL=
FRONTEND_URL=

📁 Key Features
<ul> <li><strong>User Authentication:</strong> Register, login, JWT auth, password hashing</li> <li><strong>Product Management:</strong> CRUD, search, filters, pagination, Cloudinary image upload</li> <li><strong>Categories:</strong> Full CRUD</li> <li><strong>Cart System:</strong> Add/update/remove items</li> <li><strong>Wishlist:</strong> User wishlist management</li> <li><strong>Checkout:</strong> Razorpay payments, address handling</li> <li><strong>Orders:</strong> Create orders, order tracking, admin status updates</li> <li><strong>Inventory (Admin):</strong> Stock management</li> <li><strong>Profit Analytics (Admin):</strong> Reporting and statistics</li> <li><strong>PDF Invoices:</strong> Auto invoice generation + email</li> <li><strong>Notifications:</strong> System updates and alerts</li> <li><strong>Hero/Banner:</strong> Manage homepage banners</li> <li><strong>AI Endpoints:</strong> Internal automation tools</li> </ul>
🧪 Testing
<ul> <li>Node’s built-in test runner</li> <li>Supertest for endpoint testing</li> <li>MongoDB Memory Server for fast in-memory DB instance</li> </ul>
📦 npm Scripts
<pre> npm start → production server npm run dev → nodemon development server npm test → run tests </pre>
🛡️ Security
<ul> <li>Passwords hashed with bcrypt</li> <li>JWT-based authentication</li> <li>Zod validation for inputs</li> <li>CORS configured</li> <li>Secrets in environment variables</li> </ul>
📄 Notes
<ul> <li>Backend is nearly completed</li> <li>Frontend integration in progress</li> <li>Admin + Shop features fully supported by API</li> </ul>
