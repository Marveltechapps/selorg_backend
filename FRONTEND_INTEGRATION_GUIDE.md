# Frontend Integration Guide - Selorg Organic E-commerce

This comprehensive guide shows frontend developers how to integrate each UI screen from the Figma design with the Selorg backend APIs.

---

## Table of Contents

1. [Authentication & Onboarding](#1-authentication--onboarding)
2. [Location & Addresses](#2-location--addresses)
3. [Home Screen](#3-home-screen)
4. [Product Catalog & Search](#4-product-catalog--search)
5. [Shopping Cart](#5-shopping-cart)
6. [Checkout & Payment](#6-checkout--payment)
7. [Orders & Tracking](#7-orders--tracking)
8. [Returns & Refunds](#8-returns--refunds)
9. [User Profile](#9-user-profile)
10. [Notifications](#10-notifications)
11. [Support & Help](#11-support--help)
12. [WebSocket Integration](#12-websocket-integration)

---

## Base URL

```
Development: http://localhost:5001
Production: https://api.selorg.com
```

All endpoints are prefixed with `/v1/`

---

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 1. Authentication & Onboarding

### 1.1 Login/OTP Screen

**Step 1: Send OTP**

```javascript
POST /v1/otp/send-otp
Content-Type: application/json

{
  "mobileNumber": "9876543210"
}

// Response
{
  "success": true,
  "data": {
    "message": "OTP sent successfully",
    "expiresIn": 300,
    "devMode": true
  }
}
```

**Step 2: Verify OTP**

```javascript
POST /v1/otp/verify-otp
Content-Type: application/json

{
  "mobileNumber": "9876543210",
  "otp": "123456"
}

// Response
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "mobileNumber": "9876543210",
      "isVerified": true,
      "name": null
    }
  }
}
```

**Usage in Frontend**:
```javascript
// Store tokens securely
localStorage.setItem('accessToken', response.data.token);
localStorage.setItem('refreshToken', response.data.refreshToken);

// Use token in subsequent requests
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

---

## 2. Location & Addresses

### 2.1 Select Your Location (Search)

**Search for addresses**:

```javascript
GET /v1/locations/search?query=T.Nagar

// Response
{
  "success": true,
  "data": [
    {
      "name": "T. Nagar",
      "fullAddress": "Pondy Bazaar, Sir Thyagaraya Road...",
      "latitude": 13.04,
      "longitude": 80.23
    }
  ]
}
```

### 2.2 Get Saved Addresses

```javascript
GET /v1/addresses
Authorization: Bearer {token}

// Response
{
  "success": true,
  "data": [
    {
      "id": "...",
      "label": "Home",
      "street": "Pondy Bazaar",
      "city": "Chennai",
      "state": "Tamil Nadu",
      "zipCode": "600021",
      "isDefault": true
    }
  ]
}
```

### 2.3 Add New Address

```javascript
POST /v1/addresses
Authorization: Bearer {token}
Content-Type: application/json

{
  "label": "Home",
  "houseNo": "13",
  "floor": "3rd",
  "building": "Vasatha Bhavan",
  "street": "Dr Muthu Lakshmi Rd",
  "landmark": "Near Temple",
  "city": "Chennai",
  "state": "Tamil Nadu",
  "zipCode": "600021",
  "country": "India",
  "coordinates": {
    "lat": 13.04,
    "lng": 80.23
  }
}

// Response
{
  "success": true,
  "data": {
    "id": "...",
    "label": "Home",
    ...
  }
}
```

### 2.4 Edit/Delete Address

```javascript
// Edit
PUT /v1/addresses/:id
Authorization: Bearer {token}
Body: { "label": "Work", "street": "..." }

// Delete
DELETE /v1/addresses/:id
Authorization: Bearer {token}
```

---

## 3. Home Screen

### 3.1 Get Home Banners

```javascript
GET /v1/banners/home?userSegment=adult_wellbeing

// Response
{
  "success": true,
  "data": {
    "top": [
      {
        "id": "...",
        "title": "Your Plate Deserves Organic",
        "imageUrl": "...",
        "ctaText": "Explore Now",
        "action": {
          "type": "category",
          "target": "organic_products"
        }
      }
    ],
    "middle": [...],
    "bottom": [...]
  }
}
```

### 3.2 Get Categories for Home

```javascript
GET /v1/categories

// Response
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Fresh Vegetables",
      "imageUrl": "...",
      "productCount": 120
    }
  ]
}
```

### 3.3 Get Deal Products

```javascript
GET /v1/products?minPrice=0&maxPrice=1000&sortBy=discountPrice&sortOrder=asc&limit=20

// Or use specific deals endpoint if implemented
GET /v1/products/deals?limit=20
```

### 3.4 Get Products by User Segment

```javascript
// For "Tiny Tummies" section
GET /v1/products/segment/tiny_tummies?limit=10

// Response
{
  "success": true,
  "data": [...products],
  "meta": { "page": 1, "limit": 10, "total": 45 }
}
```

### 3.5 Get Products by Health Goal

```javascript
// For "Improve immunity" card
GET /v1/products/health-goal/improve_immunity?limit=10

// Response
{
  "success": true,
  "data": [...products]
}
```

---

## 4. Product Catalog & Search

### 4.1 Browse Products by Category

```javascript
GET /v1/products?category=fresh_fruits&page=1&limit=20

// With filters
GET /v1/products?category=fresh_fruits&minPrice=50&maxPrice=200&inStock=true

// Response
{
  "success": true,
  "data": [
    {
      "id": "...",
      "SKUName": "Shimla Apple",
      "imageURL": "...",
      "variants": [
        {
          "id": "...",
          "label": "500 g",
          "price": 126,
          "discountPrice": 126,
          "discount": 16,
          "stockQuantity": 50
        },
        {
          "id": "...",
          "label": "1 kg",
          "price": 240,
          "stockQuantity": 30
        }
      ],
      "price": 126,
      "discountPrice": 126,
      "offer": "16% OFF",
      "averageRating": 4.5,
      "totalReviews": 120
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

### 4.2 Product Search

```javascript
GET /v1/products/search?q=apple&limit=20

// Response: Same format as product listing
```

### 4.3 Autocomplete Suggestions

```javascript
GET /v1/products/autocomplete?q=ap

// Response
{
  "success": true,
  "data": ["Royal Gala Apple", "Apple Juice", "Green Apple"]
}
```

### 4.4 Product Detail Screen

**Get product with full details**:

```javascript
GET /v1/products/:id

// Response
{
  "success": true,
  "data": {
    "id": "...",
    "SKUName": "Shimla Apple",
    "images": ["url1", "url2", "url3"],
    "variants": [
      {
        "id": "v1",
        "label": "500 g",
        "price": 126,
        "discountPrice": 126,
        "discount": 16,
        "inStock": true,
        "stockQuantity": 50
      }
    ],
    "description": {
      "about": "Fresh organic apples...",
      "healthBenefits": "Improves immunity...",
      "nutrition": "Rich in Vitamin C...",
      "origin": "Farms of India"
    },
    "certifications": ["organic", "non_gmo"],
    "ingredients": ["Apple"],
    "averageRating": 4.5,
    "totalReviews": 120
  }
}
```

**Get product variants**:

```javascript
GET /v1/products/:id/variants

// Response
{
  "success": true,
  "data": {
    "productId": "...",
    "productName": "Shimla Apple",
    "variants": [...]
  }
}
```

**Get similar products**:

```javascript
GET /v1/products/:id/similar?limit=10

// Response
{
  "success": true,
  "data": [...similar products]
}
```

---

## 5. Shopping Cart

### 5.1 Get Cart

```javascript
GET /v1/carts/:userId
Authorization: Bearer {token}

// Response
{
  "success": true,
  "data": {
    "userId": "...",
    "items": [
      {
        "productId": "...",
        "variantId": "...",
        "variantLabel": "500 g",
        "quantity": 1,
        "price": 126,
        "discountPrice": 126,
        "imageURL": "..."
      }
    ],
    "deliveryInstructions": {
      "noContactDelivery": true,
      "dontRingBell": false,
      "petAtHome": false,
      "additionalNotes": "Call upon arrival"
    },
    "billSummary": {
      "itemTotal": 126,
      "GST": 6.3,
      "handlingCharges": 5,
      "deliveryFee": 0,
      "deliveryTip": 30,
      "discountAmount": 63,
      "totalBill": 131,
      "savings": 63
    }
  }
}
```

### 5.2 Add Item to Cart

**With Variant ID (Recommended)**:

```javascript
POST /v1/carts/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "...",
  "variantId": "v1",  // From product variants endpoint
  "quantity": 1
}
```

**Legacy Method (with variant label)**:

```javascript
POST /v1/carts/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "...",
  "variantLabel": "500 g",
  "quantity": 1,
  "price": 126,
  "discountPrice": 126,
  "imageURL": "..."
}
```

### 5.3 Update Quantity

```javascript
POST /v1/carts/update
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "...",
  "variantLabel": "500 g",
  "quantity": 2
}
```

### 5.4 Remove Item

```javascript
POST /v1/carts/decrease
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "...",
  "variantLabel": "500 g",
  "quantity": 1
}
```

### 5.5 Apply Coupon

```javascript
// Get available coupons
GET /v1/coupons/available

// Apply coupon
POST /v1/carts/apply-coupon
Authorization: Bearer {token}
Content-Type: application/json

{
  "couponCode": "NAGATAR"
}

// Response
{
  "success": true,
  "data": {
    "code": "NAGATAR",
    "discount": 63,
    "message": "Coupon applied successfully"
  }
}

// Remove coupon
DELETE /v1/carts/remove-coupon
Authorization: Bearer {token}
```

### 5.6 Update Delivery Instructions

```javascript
PUT /v1/carts/delivery-instructions
Authorization: Bearer {token}
Content-Type: application/json

{
  "noContactDelivery": true,
  "dontRingBell": false,
  "petAtHome": false,
  "additionalNotes": "Call upon arrival"
}
```

### 5.7 Update Delivery Tip

```javascript
PUT /v1/carts/delivery-tip
Authorization: Bearer {token}
Content-Type: application/json

{
  "tipAmount": 30
}
```

### 5.8 Save for Later

```javascript
// Move item to "Save for Later"
POST /v1/carts/save-for-later
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "...",
  "variantLabel": "500 g"
}

// Move back to cart
POST /v1/carts/move-to-cart
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "...",
  "variantLabel": "500 g"
}
```

---

## 6. Checkout & Payment

### 6.1 Validate Cart Before Checkout

```javascript
POST /v1/carts/validate
Authorization: Bearer {token}

// Response
{
  "success": true,
  "data": {
    "valid": true,
    "cart": {...}
  }
}
```

### 6.2 Get Payment Methods

```javascript
GET /v1/payment-methods
Authorization: Bearer {token}

// Response
{
  "success": true,
  "data": [
    {
      "id": "...",
      "cardType": "Visa",
      "lastFourDigits": "2345",
      "expiryMonth": 12,
      "expiryYear": 2025,
      "issuer": "HDFC",
      "isDefault": true,
      "maskedCardNumber": "Visa XXXX 2345",
      "expiryDisplay": "12/25"
    }
  ]
}
```

### 6.3 Add Payment Method

**Important**: Never send raw card details! Frontend must tokenize using payment gateway SDK first.

```javascript
// Step 1: Tokenize card using Razorpay/Stripe SDK (client-side)
const cardToken = await razorpay.tokenize({
  number: "4111111111111111",
  cvv: "123",
  expiry_month: 12,
  expiry_year: 2025
});

// Step 2: Send token to backend
POST /v1/payment-methods
Authorization: Bearer {token}
Content-Type: application/json

{
  "cardToken": "token_abc123",
  "gateway": "razorpay",
  "cardType": "Visa",
  "lastFourDigits": "2345",
  "expiryMonth": 12,
  "expiryYear": 2025,
  "issuer": "HDFC",
  "isDefault": false
}
```

### 6.4 Delete Payment Method

```javascript
DELETE /v1/payment-methods/:id
Authorization: Bearer {token}
```

### 6.5 Create Order

```javascript
POST /v1/orders/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "addressId": "...",
  "paymentMethod": "card",
  "paymentMethodId": "..." // If using saved card
}

// Response
{
  "success": true,
  "data": {
    "orderId": "...",
    "orderCode": "SEL-20241203-A1B2C3",
    "finalAmount": 131,
    "paymentUrl": "https://razorpay.com/pay/..."
  }
}
```

---

## 7. Orders & Tracking

### 7.1 Get Orders List

```javascript
// All orders
GET /v1/orders/list?page=1&limit=20
Authorization: Bearer {token}

// Filtered by status
GET /v1/orders/list?status=delivered

// Response
{
  "success": true,
  "data": [
    {
      "id": "...",
      "orderCode": "SEL-20241203-A1B2C3",
      "status": "delivered",
      "placedAt": "2024-12-03T14:15:00Z",
      "items": [...],
      "finalAmount": 126,
      "canRate": true,
      "canReorder": true,
      "refundStatus": "completed"
    }
  ]
}
```

### 7.2 Get Order Details

```javascript
GET /v1/orders/:id
Authorization: Bearer {token}

// Response
{
  "success": true,
  "data": {
    "id": "...",
    "orderCode": "#1CEDGDFLK41662",
    "status": "delivered",
    "timeline": [
      { "status": "placed", "timestamp": "...", "note": "Order placed" },
      { "status": "confirmed", "timestamp": "...", "note": "Order confirmed" },
      { "status": "out_for_delivery", "timestamp": "..." },
      { "status": "delivered", "timestamp": "..." }
    ],
    "items": [
      {
        "productName": "Shimla Apple",
        "variantLabel": "500 g",
        "quantity": 2,
        "price": 126,
        "imageURL": "..."
      }
    ],
    "pricing": {
      "subtotal": 252,
      "tax": 12.6,
      "deliveryFee": 0,
      "tip": 5,
      "payable": 131
    },
    "address": {...},
    "deliveryInstructions": {...}
  }
}
```

### 7.3 Real-time Order Tracking

**REST Endpoint (Polling)**:

```javascript
GET /v1/orders/:id/tracking
Authorization: Bearer {token}

// Response
{
  "success": true,
  "data": {
    "orderId": "...",
    "status": "out_for_delivery",
    "isTrackable": true,
    "estimatedArrival": "15 mins",
    "statusMessage": "Your order is on the way",
    "deliveryPartner": {
      "name": "Sanjay",
      "phone": "+919876543210",
      "vehicleNumber": "TN01AB1234",
      "vehicleType": "bike",
      "currentLocation": {
        "latitude": 13.04,
        "longitude": 80.23,
        "updatedAt": "2024-12-03T14:20:00Z"
      }
    },
    "deliveryLocation": {
      "latitude": 13.05,
      "longitude": 80.24
    },
    "route": [
      { "latitude": 13.04, "longitude": 80.23, "timestamp": "..." }
    ],
    "distanceRemaining": 2500 // meters
  }
}
```

**WebSocket (Real-time)**:

```javascript
const ws = new WebSocket(`ws://localhost:5001/tracking?orderId=${orderId}`);

ws.onopen = () => {
  console.log('Connected to tracking');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'connected':
      console.log('WebSocket connected');
      break;
    
    case 'initial_data':
      // Update map with initial tracking data
      updateMap(data.data);
      break;
    
    case 'location_update':
      // Update delivery partner marker on map
      updateDeliveryPartnerLocation(data.data);
      break;
    
    case 'eta_update':
      // Update ETA display
      updateETA(data.data.estimatedMinutes);
      break;
    
    case 'status_change':
      // Update order status
      updateOrderStatus(data.data.status);
      break;
  }
};

// Send ping to keep connection alive
setInterval(() => {
  ws.send(JSON.stringify({ type: 'ping' }));
}, 30000);
```

### 7.4 Rate Order

```javascript
POST /v1/reviews
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": "...",
  "rating": 5,
  "comment": "Great service!",
  "images": ["url1", "url2"]
}
```

### 7.5 Reorder

```javascript
POST /v1/orders/reorder/:orderId
Authorization: Bearer {token}

// Response: Items added to cart
```

### 7.6 Download Invoice

```javascript
GET /v1/invoices/:orderId/download
Authorization: Bearer {token}

// Response: PDF file download
```

---

## 8. Returns & Refunds

### 8.1 Get Refunds List

```javascript
GET /v1/returns
Authorization: Bearer {token}

// Response
{
  "success": true,
  "data": [
    {
      "id": "...",
      "orderNumber": "#123654789",
      "status": "completed",
      "requestedAt": "2024-06-21T08:50:00Z",
      "items": [...],
      "refundAmount": 126
    }
  ]
}
```

### 8.2 Request Return

```javascript
POST /v1/returns
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": "...",
  "items": [
    {
      "productId": "...",
      "quantity": 1,
      "reason": "damaged",
      "comments": "Product was damaged on delivery"
    }
  ],
  "refundMethod": "source" // or "wallet"
}
```

---

## 9. User Profile

### 9.1 Get Profile

```javascript
GET /v1/users/profile
Authorization: Bearer {token}

// Response
{
  "success": true,
  "data": {
    "id": "...",
    "name": "John Doe",
    "mobileNumber": "9876543210",
    "email": "john@example.com",
    "avatar": "...",
    "isVerified": true
  }
}
```

### 9.2 Update Profile

```javascript
POST /v1/users/update-profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

### 9.3 Get Profile Completeness

```javascript
GET /v1/users/profile/completeness
Authorization: Bearer {token}

// Response
{
  "success": true,
  "data": {
    "percentage": 75,
    "missingFields": ["email"]
  }
}
```

### 9.4 Upload Avatar

```javascript
POST /v1/users/profile/avatar
Authorization: Bearer {token}
Content-Type: application/json

{
  "avatarUrl": "https://..."
}
```

---

## 10. Notifications

### 10.1 Get Notification Preferences

```javascript
GET /v1/users/notification-preferences
Authorization: Bearer {token}

// Response
{
  "success": true,
  "data": {
    "push": true,
    "sms": true,
    "email": true,
    "whatsapp": false,
    "orderUpdates": true,
    "marketing": false,
    "promotions": false
  }
}
```

### 10.2 Toggle Notification Channel

```javascript
POST /v1/users/notification-preferences/toggle
Authorization: Bearer {token}
Content-Type: application/json

{
  "channel": "whatsapp",
  "enabled": true
}

// Response
{
  "success": true,
  "message": "whatsapp notifications enabled successfully",
  "data": {...updated preferences}
}
```

### 10.3 Get Notifications

```javascript
GET /v1/notifications?page=1&limit=20
Authorization: Bearer {token}

// Response
{
  "success": true,
  "data": [
    {
      "id": "...",
      "type": "order_update",
      "title": "Order Delivered",
      "message": "Your order #123 has been delivered",
      "isRead": false,
      "createdAt": "2024-12-03T14:21:00Z"
    }
  ]
}
```

### 10.4 Mark as Read

```javascript
// Single notification
PATCH /v1/notifications/:id/read
Authorization: Bearer {token}

// All notifications
POST /v1/notifications/mark-all-read
Authorization: Bearer {token}
```

---

## 11. Support & Help

### 11.1 Get FAQs

```javascript
GET /v1/content/faqs/all?category=general

// Response
{
  "success": true,
  "data": {
    "General": [
      {
        "question": "What is Selorg?",
        "answer": "Selorg is..."
      }
    ],
    "Orders": [...]
  }
}
```

### 11.2 Start Support Chat

```javascript
POST /v1/support/conversations
Authorization: Bearer {token}
Content-Type: application/json

{
  "subject": "Order issue",
  "category": "order",
  "orderId": "..." // Optional
}

// Response
{
  "success": true,
  "data": {
    "id": "conv_123",
    "subject": "Order issue",
    "status": "open",
    "createdAt": "..."
  }
}
```

### 11.3 Get Chat Messages

```javascript
GET /v1/support/conversations/:id/messages?limit=50
Authorization: Bearer {token}

// Response
{
  "success": true,
  "data": [
    {
      "id": "...",
      "message": "Hello, how can I help?",
      "sentBy": "agent",
      "senderName": "Support Agent",
      "createdAt": "..."
    }
  ]
}
```

### 11.4 Send Chat Message

```javascript
POST /v1/support/conversations/:id/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "I have an issue with my order",
  "attachments": [] // Optional
}
```

---

## 12. WebSocket Integration

### 12.1 Order Tracking WebSocket

```javascript
// Connect
const trackingWs = new WebSocket(`ws://localhost:5001/tracking?orderId=${orderId}`);

// Handle events
trackingWs.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Tracking event:', data.type, data.data);
};

// Disconnect when leaving screen
trackingWs.close();
```

### 12.2 Chat WebSocket

```javascript
// Connect to chat
const chatWs = new WebSocket(`ws://localhost:5001/chat?conversationId=${convId}`);

chatWs.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'chat_message':
      // New message received
      appendMessageToChat(data.data);
      break;
    
    case 'typing_indicator':
      // Show "Agent is typing..."
      showTypingIndicator(data.data.isTyping);
      break;
    
    case 'agent_joined':
      // Show "Agent John has joined"
      showAgentJoined(data.data.agentName);
      break;
  }
};
```

---

## Error Handling

All endpoints follow the same error response format:

```javascript
{
  "success": false,
  "message": "Error message here",
  "errors": [] // Validation errors if applicable
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## Rate Limiting

Different endpoints have different rate limits:

- **OTP**: 5 requests per 15 minutes
- **Payment**: 10 requests per 15 minutes
- **Search**: 60 requests per minute
- **General**: 100 requests per 15 minutes

When rate limited, you'll receive:
```javascript
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

---

## Pagination

All list endpoints support pagination via query parameters:

```javascript
?page=1&limit=20

// Response includes meta
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

---

## Complete Example: Add to Cart Flow

```javascript
// 1. User views product
const product = await fetch(`/v1/products/${productId}`);

// 2. User selects variant (500g, 1kg, etc.)
const variantId = product.data.variants[0].id; // "500 g" option

// 3. User clicks "Add to Cart"
const addResult = await fetch('/v1/carts/add', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    productId,
    variantId,
    quantity: 1
  })
});

// 4. Show cart badge update
const cart = addResult.data;
updateCartBadge(cart.items.length);
```

---

## Complete Example: Checkout Flow

```javascript
// 1. User reviews cart
const cart = await fetch(`/v1/carts/${userId}`);

// 2. User applies coupon
await fetch('/v1/carts/apply-coupon', {
  method: 'POST',
  body: JSON.stringify({ couponCode: 'NAGATAR' })
});

// 3. User sets delivery instructions
await fetch('/v1/carts/delivery-instructions', {
  method: 'PUT',
  body: JSON.stringify({
    noContactDelivery: true,
    additionalNotes: 'Call upon arrival'
  })
});

// 4. User adds delivery tip
await fetch('/v1/carts/delivery-tip', {
  method: 'PUT',
  body: JSON.stringify({ tipAmount: 30 })
});

// 5. User clicks "Continue to Payment"
const order = await fetch('/v1/orders/create', {
  method: 'POST',
  body: JSON.stringify({
    addressId: selectedAddressId,
    paymentMethod: 'card',
    paymentMethodId: savedCardId
  })
});

// 6. Redirect to payment gateway
window.location.href = order.data.paymentUrl;
```

---

## Testing Tips

1. **Use Development Mode**: Set `NODE_ENV=development` for console OTP logging
2. **Check Network Tab**: Inspect request/response in browser DevTools
3. **Handle Loading States**: Show loaders while API calls are in progress
4. **Handle Errors Gracefully**: Display user-friendly error messages
5. **Implement Retry Logic**: For network failures
6. **Cache Responses**: Use local storage for banners, categories (with TTL)
7. **Optimize Images**: Lazy load product images
8. **WebSocket Reconnection**: Handle disconnections and reconnect automatically

---

## Environment Variables for Frontend

```javascript
// .env.local
REACT_APP_API_BASE_URL=http://localhost:5001/v1
REACT_APP_WS_BASE_URL=ws://localhost:5001
REACT_APP_RAZORPAY_KEY=rzp_test_...
```

---

## Need Help?

- **API Documentation**: Visit `/api-docs` when server is running
- **Backend Issues**: Check `UI_TO_API_MAPPING.md`
- **Testing**: See `POSTMAN_COLLECTION.json` for examples
- **Questions**: Contact backend team

---

**Last Updated**: December 2024  
**API Version**: v1  
**Backend**: Node.js + Express + MongoDB



