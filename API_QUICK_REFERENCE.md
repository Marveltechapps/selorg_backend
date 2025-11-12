# SELORG API - Quick Reference Guide

## Base URL
```
Development: http://localhost:3000
Production: https://api.selorg.com
```

## Authentication

All authenticated endpoints require JWT token in header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Get Token Flow
1. Send OTP → 2. Verify OTP → 3. Get Token

```bash
# 1. Send OTP
POST /v1/otp/send-otp
{
  "mobileNumber": "9876543210"
}

# 2. Verify OTP
POST /v1/otp/verify-otp
{
  "mobileNumber": "9876543210",
  "enteredOTP": "1234"
}
# Response includes: { token, userId }

# 3. Use token in subsequent requests
Authorization: Bearer <token>
```

---

## 🛒 **Shopping Flow**

### 1. Browse Products
```bash
# Get all products
GET /v1/products?page=1&limit=20&category=Fruits

# Search products
GET /v1/products/search?q=organic apple

# Get product details
GET /v1/products/:productId

# Check stock
POST /v1/products/check-availability
{
  "productId": "...",
  "quantity": 2
}
```

### 2. Add to Cart
```bash
# Add item
POST /v1/carts/add
Authorization: Bearer <token>
{
  "productId": "...",
  "quantity": 2,
  "variantLabel": "1kg",
  "price": 100,
  "discountPrice": 90
}

# Get cart
GET /v1/carts/:userId
Authorization: Bearer <token>

# Update quantity
POST /v1/carts/update
Authorization: Bearer <token>
{
  "productId": "...",
  "quantity": 3
}

# Remove item
POST /v1/carts/decrease
Authorization: Bearer <token>
{
  "userId": "...",
  "productId": "..."
}

# Save for later
POST /v1/carts/save-for-later
Authorization: Bearer <token>
{
  "productId": "...",
  "variantLabel": "1kg"
}

# Validate before checkout
POST /v1/carts/validate
Authorization: Bearer <token>
```

### 3. Apply Coupon
```bash
# Get available coupons
GET /v1/coupons/available
Authorization: Bearer <token>

# Validate coupon
POST /v1/coupons/validate
Authorization: Bearer <token>
{
  "code": "SAVE10"
}

# Apply coupon
POST /v1/coupons/apply
Authorization: Bearer <token>
{
  "code": "SAVE10"
}
```

### 4. Create Order
```bash
POST /v1/orders/create
Authorization: Bearer <token>
{
  "items": [
    {
      "productId": "...",
      "quantity": 2,
      "variantLabel": "1kg"
    }
  ],
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001"
  },
  "paymentMethod": "cod",
  "deliveryInstructions": "Call before delivery"
}
```

### 5. Track Order
```bash
# Get all orders
GET /v1/orders/list?page=1&status=pending
Authorization: Bearer <token>

# Get order details
GET /v1/orders/:orderId
Authorization: Bearer <token>

# Track order
GET /v1/orders/:orderId/track
Authorization: Bearer <token>
```

---

## ⭐ **Reviews & Ratings**

```bash
# Get product reviews
GET /v1/reviews/product/:productId?page=1&limit=20

# Create review (after delivery)
POST /v1/reviews
Authorization: Bearer <token>
{
  "productId": "...",
  "rating": 5,
  "comment": "Excellent quality!",
  "images": ["url1", "url2"]
}

# Mark review helpful
POST /v1/reviews/:reviewId/helpful
Authorization: Bearer <token>
```

---

## 💝 **Wishlist**

```bash
# Get wishlist
GET /v1/wishlist
Authorization: Bearer <token>

# Add to wishlist
POST /v1/wishlist/add
Authorization: Bearer <token>
{
  "productId": "...",
  "variantLabel": "1kg"
}

# Remove from wishlist
DELETE /v1/wishlist/remove/:productId
Authorization: Bearer <token>

# Move to cart
POST /v1/wishlist/move-to-cart/:productId
Authorization: Bearer <token>
```

---

## 🔄 **Returns & Refunds**

```bash
# Create return request
POST /v1/returns
Authorization: Bearer <token>
{
  "orderId": "...",
  "items": [
    {
      "productId": "...",
      "quantity": 1,
      "reason": "Product quality issue"
    }
  ],
  "reason": "defective",
  "reasonDetails": "Product was damaged",
  "images": ["url1", "url2"]
}

# Check return status
GET /v1/returns/order/:orderId
Authorization: Bearer <token>

# Cancel return
POST /v1/returns/:returnId/cancel
Authorization: Bearer <token>
```

---

## 📧 **Invoices**

```bash
# Get all invoices
GET /v1/invoices
Authorization: Bearer <token>

# Get invoice for order
GET /v1/invoices/order/:orderId
Authorization: Bearer <token>

# Download invoice PDF
GET /v1/invoices/:invoiceId/download
Authorization: Bearer <token>
```

---

## 🔔 **Notifications**

```bash
# Get notifications
GET /v1/notifications?page=1&limit=20
Authorization: Bearer <token>

# Get unread count
GET /v1/notifications/unread/count
Authorization: Bearer <token>

# Mark as read
PATCH /v1/notifications/:notificationId/read
Authorization: Bearer <token>

# Mark all as read
POST /v1/notifications/mark-all-read
Authorization: Bearer <token>
```

---

## 👤 **User Profile**

```bash
# Get profile with completeness
GET /v1/users/profile/completeness
Authorization: Bearer <token>

# Update profile
POST /v1/users/update-profile
Authorization: Bearer <token>
{
  "name": "John Doe",
  "email": "john@example.com",
  "notificationPreferences": {
    "orderUpdates": true,
    "marketing": false
  }
}

# Update avatar
POST /v1/users/profile/avatar
Authorization: Bearer <token>
{
  "avatarUrl": "https://..."
}
```

---

## 📍 **Addresses**

```bash
# Get all addresses
GET /v1/addresses
Authorization: Bearer <token>

# Create address
POST /v1/addresses
Authorization: Bearer <token>
{
  "label": "Home",
  "street": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "zipCode": "400001",
  "isDefault": true
}

# Update address
PUT /v1/addresses/:addressId
Authorization: Bearer <token>

# Set as default
POST /v1/addresses/set-default
Authorization: Bearer <token>
{
  "addressId": "..."
}
```

---

## 🔍 **Search & Discovery**

```bash
# Autocomplete
GET /v1/products/autocomplete?q=org

# Featured products
GET /v1/products/featured?limit=10

# Similar products
GET /v1/products/:productId/similar?limit=10

# Filter by category
GET /v1/products/category/Fruits?page=1&limit=20

# Advanced filters
GET /v1/products?category=Fruits&minPrice=50&maxPrice=200&inStock=true&sortBy=price&sortOrder=asc
```

---

## 💡 **Advanced Features**

### Field Selection
```bash
# Get only specific fields
GET /v1/products?fields=title,price,imageURL
```

### Pagination
```bash
# All list endpoints support pagination
GET /v1/products?page=2&limit=20
```

### ETag Caching
```bash
# Client sends:
If-None-Match: "etag-value"

# Server responds:
304 Not Modified (if unchanged)
200 OK with data (if changed)
```

---

## 🚨 **Error Responses**

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "mobileNumber",
      "message": "Mobile number must be 10 digits"
    }
  ]
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (access denied)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## 🎯 **Quick Integration Checklist**

Frontend must implement:
- [x] OTP-based login flow
- [x] JWT token storage and refresh
- [x] Product browsing with search
- [x] Cart management
- [x] Coupon application
- [x] Order placement
- [x] Order tracking
- [x] Profile management
- [x] Address management
- [x] Wishlist features
- [x] Review submission
- [x] Notification handling
- [x] Returns workflow

---

## 📞 **Support**

- API Documentation: `http://localhost:3000/api-docs` (after installing swagger)
- Health Check: `http://localhost:3000/health`
- Postman Collection: `postman_collection.json`

---

**Happy Coding! 🚀**

