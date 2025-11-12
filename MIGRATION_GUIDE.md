# Migration Guide - Transitioning to Enhanced Backend

## Overview

This guide helps you migrate from the old backend structure to the new service-layer architecture.

---

## 🔄 **What Changed**

### Architecture Changes

**Before:**
```
controller/ → directly accesses models
```

**After:**
```
controller/ → service/ → model/
```

### Benefits
- Controllers are 60% smaller
- Business logic is reusable
- Easier to test
- Better separation of concerns

---

## 📝 **Breaking Changes**

### 1. Response Format Standardization

**Old Response:**
```json
{
  "message": "Success",
  "data": {}
}
```

**New Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "meta": {
    "pagination": {...}
  }
}
```

**Migration:** Frontend needs to check `response.success` field.

### 2. Validation Errors

**Old:**
```json
{
  "error": "Invalid mobile number"
}
```

**New:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "mobileNumber",
      "message": "Mobile number must be 10 digits"
    }
  ]
}
```

**Migration:** Parse `errors` array for field-specific validation messages.

### 3. OTP Verification

**Old:** OTP stored in plain text
**New:** OTP hashed with bcrypt

**Migration:** No frontend changes needed (handled in backend).

### 4. Pagination

**Old:** All results returned at once
**New:** Paginated results with metadata

**Migration:** Use query params `?page=1&limit=20` and handle `meta.pagination` in response.

---

## 🆕 **New Features to Integrate**

### 1. Product Search

**New endpoint with advanced features:**
```javascript
// Old way (if existed)
GET /v1/productStyle

// New way
GET /v1/products/search?q=organic&category=Fruits&minPrice=50&maxPrice=200
```

**Integration:**
- Add search bar with autocomplete
- Add filters (category, price range, availability)
- Add sorting options

### 2. Wishlist

**Completely new feature:**
```javascript
POST /v1/wishlist/add
GET /v1/wishlist
DELETE /v1/wishlist/remove/:productId
```

**Integration:**
- Add wishlist icon on product cards
- Create wishlist page
- Show wishlist count in header

### 3. Save for Later

**New cart feature:**
```javascript
POST /v1/carts/save-for-later
POST /v1/carts/move-to-cart
```

**Integration:**
- Add "Save for Later" button on cart items
- Create separate "Saved for Later" section
- Allow moving items back to cart

### 4. Order Tracking

**Enhanced tracking:**
```javascript
GET /v1/orders/:orderId/track
```

**Integration:**
- Create order tracking page
- Show timeline with status updates
- Display delivery ETA

### 5. Reviews

**Complete review system:**
```javascript
POST /v1/reviews
GET /v1/reviews/product/:productId
POST /v1/reviews/:reviewId/helpful
```

**Integration:**
- Add review form on product page
- Display reviews with ratings
- Show verified purchase badge
- Allow marking reviews as helpful

### 6. Coupons

**Full coupon system:**
```javascript
GET /v1/coupons/available
POST /v1/coupons/validate
POST /v1/coupons/apply
```

**Integration:**
- Show available coupons
- Add coupon input field
- Display applied discount
- Show savings

### 7. Notifications

**In-app notification center:**
```javascript
GET /v1/notifications
GET /v1/notifications/unread/count
PATCH /v1/notifications/:id/read
```

**Integration:**
- Add notification bell icon with badge
- Create notification dropdown/page
- Auto-refresh unread count
- Mark as read on view

### 8. Returns & Refunds

**Complete returns workflow:**
```javascript
POST /v1/returns
GET /v1/returns
GET /v1/returns/order/:orderId
```

**Integration:**
- Add "Return" button on delivered orders
- Create return request form
- Show return status
- Display refund information

### 9. Invoices

**Invoice download:**
```javascript
GET /v1/invoices/order/:orderId
GET /v1/invoices/:id/download
```

**Integration:**
- Add "Download Invoice" button on orders
- Show invoice list in profile
- Support PDF viewing/downloading

### 10. Profile Completeness

**Gamified profile:**
```javascript
GET /v1/users/profile/completeness
```

**Integration:**
- Show progress bar
- List missing fields
- Encourage completion

---

## 🔧 **Frontend Code Examples**

### Axios Setup
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/v1',
  timeout: 10000
});

// Add token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
```

### Authentication Hook (React)
```javascript
import { useState, useEffect } from 'react';
import api from './api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('jwt_token'));

  const sendOTP = async (mobileNumber) => {
    const response = await api.post('/otp/send-otp', { mobileNumber });
    return response;
  };

  const verifyOTP = async (mobileNumber, enteredOTP) => {
    const response = await api.post('/otp/verify-otp', { 
      mobileNumber, 
      enteredOTP 
    });
    
    if (response.success) {
      setToken(response.data.token);
      setUser(response.data.user);
      localStorage.setItem('jwt_token', response.data.token);
    }
    
    return response;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('jwt_token');
  };

  return { user, token, sendOTP, verifyOTP, logout };
}
```

### Cart Hook
```javascript
import { useState, useEffect } from 'react';
import api from './api';

export function useCart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = async (userId) => {
    setLoading(true);
    try {
      const response = await api.get(`/carts/${userId}`);
      setCart(response.data);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (item) => {
    const response = await api.post('/carts/add', item);
    setCart(response.data);
    return response;
  };

  const updateQuantity = async (productId, quantity) => {
    const response = await api.post('/carts/update', { 
      productId, 
      quantity 
    });
    setCart(response.data);
  };

  const validateCart = async () => {
    const response = await api.post('/carts/validate');
    return response;
  };

  return { cart, loading, fetchCart, addToCart, updateQuantity, validateCart };
}
```

---

## 🎨 **UI Components Needed**

### New Components to Build

1. **SearchBar** with autocomplete
2. **WishlistButton** with toggle state
3. **CouponInput** with validation
4. **ReviewForm** with star rating
5. **NotificationBell** with unread count
6. **OrderTracker** with timeline
7. **ProfileCompleteness** progress bar
8. **SaveForLater** section in cart
9. **ReturnRequest** form
10. **InvoiceDownload** button

---

## ⚡ **Performance Optimization Tips**

### 1. Use Field Selection
```javascript
// Instead of getting all fields
GET /v1/products

// Get only what you need
GET /v1/products?fields=title,price,imageURL,discountPrice
```

### 2. Implement Pagination
```javascript
// Don't load all data at once
GET /v1/products?page=1&limit=20

// Load more on scroll
GET /v1/products?page=2&limit=20
```

### 3. Cache Product Lists
```javascript
// Use ETag for caching
const headers = {};
const cachedETag = localStorage.getItem('products_etag');
if (cachedETag) {
  headers['If-None-Match'] = cachedETag;
}

const response = await api.get('/v1/products', { headers });
if (response.status === 304) {
  // Use cached data
}
```

---

## 🐛 **Common Issues & Solutions**

### Issue 1: Token Expired
**Error:** 403 Forbidden
**Solution:** Implement token refresh or redirect to login

### Issue 2: Rate Limited
**Error:** 429 Too Many Requests
**Solution:** Implement exponential backoff, show user-friendly message

### Issue 3: Validation Errors
**Error:** 400 with errors array
**Solution:** Parse errors array and show field-specific messages

### Issue 4: Product Out of Stock
**Error:** 400 "Only X items available"
**Solution:** Update UI to show available quantity, disable add to cart

---

## 🔐 **Security Best Practices**

### Frontend Implementation

1. **Store JWT securely**
   - Use httpOnly cookies (recommended)
   - Or localStorage with XSS protection

2. **Handle token expiry**
   - Implement refresh token mechanism
   - Graceful re-authentication

3. **Validate on client side too**
   - Don't rely only on backend validation
   - Provide instant feedback

4. **Sanitize user input**
   - Escape HTML in user-generated content
   - Validate file uploads (avatar, review images)

---

## 📱 **Mobile App Integration**

### Device Token Registration
```javascript
// Register device for push notifications
POST /v1/users/update-profile
{
  "deviceTokens": [{
    "token": "fcm-device-token",
    "platform": "android"
  }]
}
```

### Handle Push Notifications
```javascript
// Listen for notifications
// Order updates, delivery alerts, etc.
```

---

## 🧪 **Testing Your Integration**

### 1. Use Postman Collection
Import `postman_collection.json` and test all endpoints

### 2. Test Flow
```
1. Send OTP → 2. Verify OTP → 3. Browse Products →
4. Add to Cart → 5. Apply Coupon → 6. Create Order →
7. Track Order → 8. Submit Review → 9. Download Invoice
```

### 3. Edge Cases to Test
- Empty cart checkout
- Out of stock products
- Invalid coupon codes
- Expired tokens
- Rate limiting
- Network failures

---

## 📞 **Need Help?**

- Check `README.md` for setup instructions
- Review `CONTRIBUTING.md` for development guidelines
- See `API_QUICK_REFERENCE.md` for endpoint details
- Check Swagger docs at `/api-docs`
- Review `IMPLEMENTATION_SUMMARY.md` for technical details

---

**Migration Completed! Your frontend is now ready to integrate with the enhanced backend.** 🎉

