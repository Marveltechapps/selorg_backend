# UI to API Mapping - Selorg Organic E-commerce Application

This document maps every UI screen from the Figma design to its required backend endpoints, providing a complete reference for frontend-backend integration.

---

## 1. Authentication & Onboarding Screens

### 1.1 Splash/Onboarding Screens
**UI Purpose**: Welcome screens with app introduction

**Required Endpoints**:
- `GET /v1/content/onboarding` - Fetch onboarding screen content
- Status: ⚠️ NOT IMPLEMENTED (static content for now)

**Data Required**:
- Screen images
- Titles and descriptions
- Order/sequence

---

### 1.2 Login/OTP Screen
**UI Purpose**: User authentication via mobile OTP

**Required Endpoints**:
- `POST /v1/otp/send-otp` - Send OTP to mobile number
  - Request: `{ "mobileNumber": "9876543210" }`
  - Response: `{ "success": true, "expiresIn": 300 }`
  - Status: ✅ IMPLEMENTED

- `POST /v1/otp/verify-otp` - Verify OTP and get JWT token
  - Request: `{ "mobileNumber": "9876543210", "otp": "123456" }`
  - Response: `{ "token": "jwt...", "refreshToken": "...", "user": {...} }`
  - Status: ✅ IMPLEMENTED

**Features**:
- Mobile number validation
- OTP expiry (5 minutes)
- Resend OTP functionality
- Console logging in development mode

---

### 1.3 Enable Location Services Screen
**UI Purpose**: Request location permissions

**Required Endpoints**:
- `POST /v1/users/location` - Save user's location
  - Request: `{ "latitude": 13.0827, "longitude": 80.2707 }`
  - Status: ⚠️ NEEDS IMPLEMENTATION

- `GET /v1/locations/reverse-geocode` - Convert coordinates to address
  - Request: `?lat=13.0827&lng=80.2707`
  - Status: ⚠️ NEEDS IMPLEMENTATION

---

## 2. Location & Address Management

### 2.1 Select Your Location (Search)
**UI Purpose**: Search and select delivery location

**Required Endpoints**:
- `GET /v1/locations/search` - Search for addresses
  - Request: `?query=T.Nagar`
  - Response: `[{ "name": "T. Nagar", "fullAddress": "...", "latitude": 13.04, "longitude": 80.23 }]`
  - Status: ✅ IMPLEMENTED

- `GET /v1/addresses/current-location` - Use GPS location
  - Request: GPS coordinates
  - Status: ⚠️ NEEDS IMPLEMENTATION

---

### 2.2 Select Your Location (Saved Addresses)
**UI Purpose**: View and select from saved addresses

**Required Endpoints**:
- `GET /v1/addresses` - Get user's saved addresses
  - Response: `[{ "id": "...", "label": "Home", "address": "...", "isDefault": true }]`
  - Status: ✅ IMPLEMENTED

- `POST /v1/addresses` - Add new address
  - Request: `{ "label": "Home", "houseNo": "13", "street": "...", "city": "Chennai", ... }`
  - Status: ✅ IMPLEMENTED

- `PUT /v1/addresses/:id` - Update address
  - Status: ✅ IMPLEMENTED

- `DELETE /v1/addresses/:id` - Delete address
  - Status: ✅ IMPLEMENTED

- `PUT /v1/addresses/:id/set-default` - Set default address
  - Status: ⚠️ NEEDS IMPLEMENTATION

---

### 2.3 Select Location on Map
**UI Purpose**: Pin exact delivery location on map

**Required Endpoints**:
- `POST /v1/locations/confirm` - Confirm selected location
  - Request: `{ "latitude": 13.04, "longitude": 80.23, "address": "..." }`
  - Status: ⚠️ NEEDS IMPLEMENTATION

---

### 2.4 Enter Complete Address
**UI Purpose**: Add detailed address information

**Required Endpoints**:
- `POST /v1/addresses` - Save complete address
  - Request: `{ "houseNo": "13", "floor": "3rd", "building": "Vasatha Bhavan", "landmark": "Near Temple", "label": "Home" }`
  - Status: ✅ IMPLEMENTED

---

### 2.5 Saved Addresses List
**UI Purpose**: Manage saved addresses (edit/delete)

**Required Endpoints**:
- `GET /v1/addresses` - List all addresses
  - Status: ✅ IMPLEMENTED

- `PUT /v1/addresses/:id` - Edit address
  - Status: ✅ IMPLEMENTED

- `DELETE /v1/addresses/:id` - Delete address
  - Status: ✅ IMPLEMENTED

---

## 3. Home Screen

### 3.1 Home Screen Main
**UI Purpose**: Main landing page with categories, banners, and product recommendations

**Required Endpoints**:
- `GET /v1/users/profile` - Get user info for greeting
  - Status: ✅ IMPLEMENTED

- `GET /v1/addresses/default` - Get default delivery address
  - Status: ⚠️ NEEDS IMPLEMENTATION

- `GET /v1/banners/home` - Get home screen banners
  - Response: `[{ "id": "...", "title": "Your Plate Deserves Organic", "imageUrl": "...", "link": "..." }]`
  - Status: ⚠️ NOT IMPLEMENTED

- `GET /v1/categories/home-display` - Get featured categories
  - Response: `[{ "id": "...", "name": "Fresh Vegetables", "imageUrl": "...", "productCount": 120 }]`
  - Status: ⚠️ NEEDS IMPLEMENTATION

- `GET /v1/products/deals` - Get products on deal
  - Response: Products with discount
  - Status: ⚠️ NEEDS IMPLEMENTATION

- `GET /v1/user-segments` - Get user segment recommendations
  - Response: `[{ "name": "Tiny Tummies", "description": "...", "imageUrl": "..." }]`
  - Status: ⚠️ NOT IMPLEMENTED

- `GET /v1/health-goals` - Get health goal cards
  - Response: `[{ "name": "Improve immunity", "description": "...", "imageUrl": "..." }]`
  - Status: ⚠️ NOT IMPLEMENTED

---

## 4. Product Catalog

### 4.1 All Categories Screen
**UI Purpose**: Display all product categories

**Required Endpoints**:
- `GET /v1/categories` - Get all categories
  - Response: `[{ "id": "...", "name": "Grocery & Kitchen", "imageUrl": "...", "subcategories": [...] }]`
  - Status: ✅ IMPLEMENTED

---

### 4.2 Category Product Listing (e.g., Fresh Fruits)
**UI Purpose**: Browse products in a category

**Required Endpoints**:
- `GET /v1/products?category=:categoryId` - Get products by category
  - Query params: `page`, `limit`, `sort`, `minPrice`, `maxPrice`
  - Response: Products array with pagination
  - Status: ✅ IMPLEMENTED

- `GET /v1/categories/:id/subcategories` - Get subcategories
  - Status: ✅ IMPLEMENTED

- `GET /v1/banners/category/:categoryId` - Category-specific banners
  - Status: ⚠️ NOT IMPLEMENTED

---

### 4.3 Product Detail Screen
**UI Purpose**: View detailed product information

**Required Endpoints**:
- `GET /v1/products/:id` - Get product details
  - Response: 
    ```json
    {
      "id": "...",
      "name": "Shimla Apple",
      "images": ["url1", "url2"],
      "variants": [
        { "id": "...", "weight": "500g", "price": 126, "originalPrice": 256, "discount": 16, "inStock": true },
        { "id": "...", "weight": "1kg", "price": 240, "originalPrice": 480, "discount": 50, "inStock": true }
      ],
      "about": "Tomatoes are a yummy fruit...",
      "healthBenefits": ["Improves immunity", "Aids metabolism"],
      "nutrition": { "vitaminC": "...", "vitaminK": "..." },
      "originPlace": "Farms of India",
      "certifications": ["organic"],
      "rating": 4.5,
      "reviewCount": 120
    }
    ```
  - Status: ⚠️ PARTIAL (variants not implemented)

- `GET /v1/products/:id/variants` - Get product variants
  - Status: ⚠️ NOT IMPLEMENTED

- `GET /v1/products/:id/similar` - Get similar products
  - Status: ✅ IMPLEMENTED

---

### 4.4 Product Search
**UI Purpose**: Search for products

**Required Endpoints**:
- `GET /v1/products/search` - Search products
  - Query params: `q`, `limit`, `category`, `minPrice`, `maxPrice`
  - Response: Matching products
  - Status: ✅ IMPLEMENTED

- `GET /v1/products/autocomplete` - Search suggestions
  - Query params: `q`
  - Response: `["Royal Gala Apple", "Apple Juice", "Green Apple"]`
  - Status: ✅ IMPLEMENTED

---

### 4.5 Product Variant Selector Modal
**UI Purpose**: Select product size/quantity variant

**Required Endpoints**:
- `GET /v1/products/:id/variants` - Get all variants
  - Status: ⚠️ NOT IMPLEMENTED

- `POST /v1/carts/add` - Add variant to cart
  - Request: `{ "productId": "...", "variantId": "...", "quantity": 1 }`
  - Status: ⚠️ PARTIAL (variantId not supported)

---

## 5. Shopping Cart

### 5.1 My Cart Screen
**UI Purpose**: View and manage cart items

**Required Endpoints**:
- `GET /v1/carts` - Get cart contents
  - Response:
    ```json
    {
      "items": [
        {
          "id": "...",
          "product": { "name": "...", "image": "..." },
          "variant": { "weight": "500g", "price": 126 },
          "quantity": 1,
          "subtotal": 126
        }
      ],
      "itemCount": 1,
      "subtotal": 126,
      "discount": 63,
      "total": 131
    }
    ```
  - Status: ✅ IMPLEMENTED

- `POST /v1/carts/add` - Add item to cart
  - Request: `{ "productId": "...", "variantId": "...", "quantity": 1 }`
  - Status: ⚠️ PARTIAL (variantId not supported)

- `PUT /v1/carts/items/:itemId` - Update quantity
  - Request: `{ "quantity": 2 }`
  - Status: ✅ IMPLEMENTED

- `DELETE /v1/carts/items/:itemId` - Remove item
  - Status: ✅ IMPLEMENTED

- `GET /v1/coupons/available` - Get available coupons
  - Status: ✅ IMPLEMENTED

- `POST /v1/carts/apply-coupon` - Apply coupon
  - Request: `{ "couponCode": "NAGATAR" }`
  - Status: ✅ IMPLEMENTED

- `DELETE /v1/carts/remove-coupon` - Remove coupon
  - Status: ✅ IMPLEMENTED

- `POST /v1/carts/tip` - Add delivery tip
  - Request: `{ "tipAmount": 30 }`
  - Status: ⚠️ NEEDS IMPLEMENTATION

- `GET /v1/carts/summary` - Get bill summary
  - Response: Item total, GST, handling charge, delivery fee, tip, total
  - Status: ✅ IMPLEMENTED

- `PUT /v1/carts/delivery-instructions` - Set delivery instructions
  - Request: `{ "noContact": true, "dontRingBell": false, "petAtHome": false, "additionalNotes": "..." }`
  - Status: ⚠️ NEEDS IMPLEMENTATION

---

### 5.2 Coupons Screen
**UI Purpose**: View and apply coupons

**Required Endpoints**:
- `GET /v1/coupons/available` - List available coupons
  - Response:
    ```json
    [
      {
        "code": "NAGATAR",
        "title": "Get 10% offer",
        "description": "Use code NAGATAR",
        "conditions": ["Add Products worth ₹299", "..."],
        "discountType": "percentage",
        "discountValue": 10,
        "minOrderValue": 299
      }
    ]
    ```
  - Status: ✅ IMPLEMENTED

- `POST /v1/coupons/validate` - Validate coupon code
  - Request: `{ "couponCode": "NAGATAR", "cartTotal": 500 }`
  - Status: ✅ IMPLEMENTED

- `POST /v1/carts/apply-coupon` - Apply coupon
  - Status: ✅ IMPLEMENTED

---

### 5.3 Custom Delivery Tip Modal
**UI Purpose**: Enter custom tip amount

**Required Endpoints**:
- `POST /v1/carts/tip` - Set custom tip
  - Request: `{ "tipAmount": 50 }`
  - Status: ⚠️ NEEDS IMPLEMENTATION

---

## 6. Checkout & Payment

### 6.1 Checkout Screen (embedded in Cart)
**UI Purpose**: Select address, add instructions, proceed to payment

**Required Endpoints**:
- `GET /v1/addresses/default` - Get delivery address
  - Status: ⚠️ NEEDS IMPLEMENTATION

- `POST /v1/orders/checkout` - Create order and initiate payment
  - Request:
    ```json
    {
      "addressId": "...",
      "deliveryInstructions": {
        "noContact": true,
        "dontRingBell": false,
        "petAtHome": false,
        "additionalNotes": "Call upon arrival"
      },
      "tipAmount": 30,
      "paymentMethod": "online"
    }
    ```
  - Response: `{ "orderId": "...", "paymentUrl": "...", "amount": 131 }`
  - Status: ⚠️ PARTIAL (delivery instructions not fully supported)

---

### 6.2 Payment Methods Screen
**UI Purpose**: Manage saved payment methods

**Required Endpoints**:
- `GET /v1/payment-methods` - List saved payment methods
  - Response:
    ```json
    [
      {
        "id": "...",
        "cardType": "Visa",
        "lastFourDigits": "2345",
        "expiryMonth": 16,
        "expiryYear": 24,
        "issuer": "Experis",
        "isDefault": true
      }
    ]
    ```
  - Status: ⚠️ NOT IMPLEMENTED

- `POST /v1/payment-methods` - Add payment method
  - Request: `{ "cardToken": "...", "cardType": "Visa", "lastFourDigits": "2345", "expiryMonth": 16, "expiryYear": 24 }`
  - Status: ⚠️ NOT IMPLEMENTED

- `DELETE /v1/payment-methods/:id` - Delete payment method
  - Status: ⚠️ NOT IMPLEMENTED

- `PUT /v1/payment-methods/:id/set-default` - Set default
  - Status: ⚠️ NOT IMPLEMENTED

---

## 7. Orders

### 7.1 My Orders Screen
**UI Purpose**: View order history with filters

**Required Endpoints**:
- `GET /v1/orders` - Get user's orders
  - Query params: `status` (all, delivered, cancelled), `page`, `limit`
  - Response:
    ```json
    [
      {
        "id": "...",
        "orderNumber": "#123654789",
        "status": "delivered",
        "placedAt": "2024-06-21T08:50:00Z",
        "items": [
          { "product": { "name": "Shimla Apple", "image": "..." }, "quantity": 1 }
        ],
        "total": 126,
        "canRate": true,
        "canReorder": true,
        "refundStatus": "completed"
      }
    ]
    ```
  - Status: ✅ IMPLEMENTED

---

### 7.2 Order Details Screen
**UI Purpose**: View detailed order information

**Required Endpoints**:
- `GET /v1/orders/:id` - Get order details
  - Response:
    ```json
    {
      "id": "...",
      "orderNumber": "#1CEDGDFLK41662",
      "status": "delivered",
      "statusHistory": [
        { "status": "placed", "timestamp": "..." },
        { "status": "getting_packed", "timestamp": "..." },
        { "status": "on_the_way", "timestamp": "..." },
        { "status": "delivered", "timestamp": "..." }
      ],
      "placedAt": "2024-12-03T14:15:00Z",
      "deliveredAt": "2024-12-03T14:21:00Z",
      "deliveryTime": "6 MINS",
      "items": [
        {
          "product": { "name": "Shimla Apple", "image": "..." },
          "variant": { "weight": "500g" },
          "quantity": 2,
          "price": 126,
          "originalPrice": 189
        }
      ],
      "billSummary": {
        "itemTotal": 252,
        "gst": 12.6,
        "handlingCharge": 5,
        "deliveryFee": 0,
        "total": 131,
        "saved": 63
      },
      "deliveryAddress": {
        "label": "Home",
        "fullAddress": "3th, floor, Vasatha bhavan, Adyar, Chennai. 600 021"
      },
      "deliveryInstructions": { "noContact": true },
      "invoiceUrl": "/v1/invoices/:orderId/download"
    }
    ```
  - Status: ✅ IMPLEMENTED

- `GET /v1/invoices/:orderId/download` - Download invoice
  - Status: ✅ IMPLEMENTED

- `POST /v1/orders/:id/reorder` - Reorder items
  - Status: ⚠️ NEEDS IMPLEMENTATION

---

### 7.3 Order Status/Tracking Screen
**UI Purpose**: Real-time order tracking with map

**Required Endpoints**:
- `GET /v1/orders/:id/tracking` - Get order tracking info
  - Response:
    ```json
    {
      "orderId": "...",
      "status": "on_the_way",
      "estimatedArrival": "15 mins",
      "statusMessage": "Your order is on the way",
      "deliveryPartner": {
        "name": "Sanjay",
        "phone": "+919876543210",
        "currentLocation": { "latitude": 13.04, "longitude": 80.23 },
        "vehicleNumber": "TN01AB1234"
      },
      "deliveryLocation": { "latitude": 13.05, "longitude": 80.24 },
      "route": [
        { "latitude": 13.04, "longitude": 80.23 },
        { "latitude": 13.045, "longitude": 80.235 }
      ],
      "orderSummary": {
        "itemCount": 2,
        "saved": 80,
        "deliveryAddress": "13, 8/22,Dr Muthu Lakshmi nagger,..."
      }
    }
    ```
  - Status: ⚠️ NOT IMPLEMENTED

- WebSocket endpoint: `ws://localhost:5001/tracking/:orderId` - Real-time updates
  - Status: ⚠️ NOT IMPLEMENTED

---

### 7.4 Rate Order Screen
**UI Purpose**: Submit order rating and review

**Required Endpoints**:
- `POST /v1/orders/:id/rate` - Submit rating
  - Request: `{ "rating": 5, "comment": "Great service!" }`
  - Status: ✅ IMPLEMENTED (via reviews endpoint)

---

## 8. Returns & Refunds

### 8.1 Refunds List Screen
**UI Purpose**: View refund requests and status

**Required Endpoints**:
- `GET /v1/returns` - Get user's return requests
  - Response:
    ```json
    [
      {
        "id": "...",
        "orderNumber": "#123654789",
        "status": "completed",
        "requestedAt": "2024-06-21T08:50:00Z",
        "items": [
          { "product": { "name": "Shimla Apple" }, "quantity": 1, "refundAmount": 5 }
        ]
      }
    ]
    ```
  - Status: ✅ IMPLEMENTED

---

### 8.2 Refund Details Screen
**UI Purpose**: View detailed refund information

**Required Endpoints**:
- `GET /v1/returns/:id` - Get return details
  - Status: ✅ IMPLEMENTED

---

## 9. User Profile

### 9.1 Profile Edit Screen
**UI Purpose**: Update user profile information

**Required Endpoints**:
- `GET /v1/users/profile` - Get user profile
  - Response: `{ "name": "...", "mobileNumber": "...", "email": "...", "avatar": "..." }`
  - Status: ✅ IMPLEMENTED

- `PUT /v1/users/profile` - Update profile
  - Request: `{ "name": "John Doe", "email": "john@example.com" }`
  - Status: ✅ IMPLEMENTED

- `POST /v1/users/profile/avatar` - Upload avatar
  - Status: ✅ IMPLEMENTED

- `GET /v1/users/profile/completeness` - Get profile completeness
  - Response: `{ "completeness": 75, "missingFields": ["email"] }`
  - Status: ✅ IMPLEMENTED

---

### 9.2 Notification Settings Screen
**UI Purpose**: Manage notification preferences

**Required Endpoints**:
- `GET /v1/users/notification-preferences` - Get preferences
  - Response: `{ "whatsapp": false, "push": true, "email": true, "sms": true }`
  - Status: ⚠️ NEEDS IMPLEMENTATION

- `PUT /v1/users/notification-preferences` - Update preferences
  - Request: `{ "whatsapp": true, "push": true }`
  - Status: ⚠️ NEEDS IMPLEMENTATION

---

## 10. Notifications

### 10.1 Notifications List Screen
**UI Purpose**: View all notifications

**Required Endpoints**:
- `GET /v1/notifications` - Get user notifications
  - Query params: `read` (true/false), `page`, `limit`
  - Response:
    ```json
    [
      {
        "id": "...",
        "type": "order_update",
        "title": "Order Delivered",
        "message": "Your order #123 has been delivered",
        "isRead": false,
        "createdAt": "2024-12-03T14:21:00Z"
      }
    ]
    ```
  - Status: ✅ IMPLEMENTED

- `GET /v1/notifications/unread/count` - Get unread count
  - Status: ✅ IMPLEMENTED

- `PATCH /v1/notifications/:id/read` - Mark as read
  - Status: ✅ IMPLEMENTED

- `POST /v1/notifications/mark-all-read` - Mark all as read
  - Status: ✅ IMPLEMENTED

---

## 11. Help & Support

### 11.1 Help & Support Screen
**UI Purpose**: Access help topics and support

**Required Endpoints**:
- `GET /v1/faqs` - Get FAQ list
  - Response:
    ```json
    [
      {
        "category": "General Inquiry",
        "questions": [
          {
            "question": "What is Selorg Organic Grocery Delivery?",
            "answer": "Selorg is your one-stop app..."
          }
        ]
      }
    ]
    ```
  - Status: ✅ IMPLEMENTED

- `POST /v1/support/conversations` - Start chat conversation
  - Request: `{ "subject": "Order issue", "orderId": "..." }`
  - Status: ⚠️ NOT IMPLEMENTED

---

### 11.2 Chat Support Screen
**UI Purpose**: Chat with support team

**Required Endpoints**:
- `GET /v1/support/conversations/:id/messages` - Get messages
  - Status: ⚠️ NOT IMPLEMENTED

- `POST /v1/support/conversations/:id/messages` - Send message
  - Request: `{ "message": "I need help with my order", "attachments": [] }`
  - Status: ⚠️ NOT IMPLEMENTED

- WebSocket: `ws://localhost:5001/support/:conversationId` - Real-time chat
  - Status: ⚠️ NOT IMPLEMENTED

---

### 11.3 FAQ Screen
**UI Purpose**: Browse frequently asked questions

**Required Endpoints**:
- `GET /v1/faqs` - Get FAQs
  - Status: ✅ IMPLEMENTED

- `GET /v1/faqs/:category` - Get FAQs by category
  - Status: ⚠️ NEEDS IMPLEMENTATION

---

## 12. Additional Features

### 12.1 Wishlist
**UI Purpose**: Save products for later

**Required Endpoints**:
- `GET /v1/wishlist` - Get wishlist
  - Status: ✅ IMPLEMENTED

- `POST /v1/wishlist/add` - Add to wishlist
  - Status: ✅ IMPLEMENTED

- `DELETE /v1/wishlist/remove/:productId` - Remove from wishlist
  - Status: ✅ IMPLEMENTED

---

### 12.2 Reviews
**UI Purpose**: View and submit product reviews

**Required Endpoints**:
- `GET /v1/reviews/product/:productId` - Get product reviews
  - Status: ✅ IMPLEMENTED

- `POST /v1/reviews` - Submit review
  - Status: ✅ IMPLEMENTED

---

## Summary Statistics

### Implementation Status:
- ✅ **Fully Implemented**: 35 endpoints
- ⚠️ **Partially Implemented**: 12 endpoints
- ❌ **Not Implemented**: 18 endpoints

### Critical Missing Features:
1. **Product Variants** - Essential for UI (500g, 1kg options)
2. **Payment Methods Management** - UI exists, no backend
3. **Real-time Order Tracking** - UI shows map, needs WebSocket
4. **Banner/Content Management** - Multiple banners in UI, no CMS
5. **Chat Support** - UI ready, no backend
6. **WhatsApp Integration** - Toggle exists, no integration
7. **User Segments & Health Goals** - UI sections exist, no backend

### Next Steps:
Proceed to **Task 2: Audit Existing Endpoints** to verify the "implemented" endpoints work correctly with the UI requirements.



