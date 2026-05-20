# Multi-Tenant Company Isolation Implementation

## Overview

Your DPDP backend now supports **company-level multi-tenant isolation** using `companyId` from an external API key service. All data is automatically filtered and isolated by company.

---

## 📋 Architecture

```
External API Key Service
        ↓
   validates API key
        ↓
   sends companyId in header
        ↓
   DPDP Backend receives request
        ↓
   stores companyId in all collections
        ↓
   filters access by companyId
        ↓
   full company isolation ✅
```

---

## 🔑 Request Header Requirements

Every API request **MUST** include:

```
x-api-key: [api-key-from-external-service]
x-company-id: [company-id-from-external-service]
```

**Example:**
```bash
curl -X POST https://dpdp-ten.vercel.app/api/users \
  -H "x-api-key: test123" \
  -H "x-company-id: company-A-123" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@company-a.com"}'
```

---

## 📦 Updated Data Models

### 1. User Collection

**Fields:**
```json
{
  "companyId": "string (required)",
  "userUID": "string (UUID)",
  "email": "string (required, unique per company)",
  "createdAt": "Date"
}
```

**Uniqueness:** `(companyId, userUID)` and `(companyId, email)` are unique
- Company A cannot have duplicate emails
- Company B can have the same email as Company A

---

### 2. Data Collection

**Fields:**
```json
{
  "companyId": "string (required)",
  "dataId": "string (UUID)",
  "userUID": "string (must belong to company)",
  "type": "string (email|phone|address)",
  "value": "string",
  "revoked": "boolean",
  "createdAt": "Date",
  "revokedAt": "Date"
}
```

**Uniqueness:** `(companyId, dataId)` is unique

---

### 3. Permission Collection

**Fields:**
```json
{
  "companyId": "string (required)",
  "permissionId": "string (UUID)",
  "userUID": "string (must belong to company)",
  "subject": "string",
  "description": "string",
  "revoked": "boolean",
  "createdAt": "Date",
  "revokedAt": "Date"
}
```

**Uniqueness:** `(companyId, permissionId)` is unique

---

## � Verify Company Exists

**GET** `/api/verify-company`

Use this endpoint to verify a company exists in the database before using it.

**Query Parameters:**
```
GET /api/verify-company?companyId=6a0d5d1f86d3f6c11f287c86
```

**Response (Success):**
```json
{
  "success": true,
  "exists": true,
  "company": {
    "companyId": "6a0d5d1f86d3f6c11f287c86",
    "name": "POLO",
    "email": "polo@gmail.com",
    "domain": "polo@gmail.com",
    "apiKey": "dpdp_88b3b70c3c7df9b92cf898ecad1d534425ee1cdc9e2597e0470cd06702d5a829",
    "createdAt": "2026-05-20T07:05:03.067+00:00",
    "updatedAt": "2026-05-20T07:05:03.067+00:00"
  }
}
```

**Response (Not Found):**
```json
{
  "error": "Company not found",
  "companyId": "6a0d5d1f86d3f6c11f287c86",
  "exists": false
}
```

---

## �🚀 API Endpoints

### Create User

**POST** `/api/users`

**Headers:**
```
x-api-key: [key]
x-company-id: [company-id]
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@company.com"
}
```

**Response:**
```json
{
  "success": true,
  "userUID": "uuid-here",
  "companyId": "company-A-123",
  "email": "user@company.com"
}
```

**Error Cases:**
- Missing email → 400 Bad Request
- Missing x-company-id → 400 Bad Request
- Duplicate email in company → 409 Conflict

---

### Store Data

**POST** `/api/data`

**Headers:**
```
x-api-key: [key]
x-company-id: [company-id]
Content-Type: application/json
```

**Request Body:**
```json
{
  "userUID": "uuid-here",
  "data": {
    "type": "email",
    "value": "user@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "dataId": "uuid-here",
  "companyId": "company-A-123",
  "userUID": "uuid-here"
}
```

**Security Checks:**
- ✅ Verifies user belongs to company
- ✅ Filters by companyId
- ✅ Prevents cross-company data storage

---

### View Data

**GET** `/api/data/:userUID/:id`

**Query Parameters:**
```
GET /api/data/user-uuid/data-id
```

**Headers:**
```
x-api-key: [key]
x-company-id: [company-id]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "companyId": "company-A-123",
    "dataId": "data-uuid",
    "userUID": "user-uuid",
    "type": "email",
    "value": "user@example.com",
    "revoked": false,
    "createdAt": "2026-05-20T..."
  },
  "companyId": "company-A-123"
}
```

**Security:**
- ❌ Returns 404 if companyId doesn't match
- ❌ Prevents accessing other company's data

---

### Delete Data

**DELETE** `/api/data/delete`

**Headers:**
```
x-api-key: [key]
x-company-id: [company-id]
Content-Type: application/json
```

**Request Body:**
```json
{
  "userUID": "uuid-here",
  "dataId": "uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data deleted successfully",
  "companyId": "company-A-123"
}
```

---

### Revoke Data

**POST** `/api/data/revoke`

**Headers:**
```
x-api-key: [key]
x-company-id: [company-id]
Content-Type: application/json
```

**Request Body:**
```json
{
  "userUID": "uuid-here",
  "dataId": "uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data revoked successfully",
  "companyId": "company-A-123"
}
```

---

### Store Permission

**POST** `/api/permissions`

**Headers:**
```
x-api-key: [key]
x-company-id: [company-id]
Content-Type: application/json
```

**Request Body:**
```json
{
  "userUID": "uuid-here",
  "data": {
    "subject": "can_view_profile",
    "description": "User can view their profile"
  }
}
```

**Response:**
```json
{
  "success": true,
  "permissionId": "uuid-here",
  "companyId": "company-A-123",
  "userUID": "uuid-here"
}
```

---

### View Permission

**GET** `/api/permissions/:userUID/:id`

**Headers:**
```
x-api-key: [key]
x-company-id: [company-id]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "companyId": "company-A-123",
    "permissionId": "perm-uuid",
    "userUID": "user-uuid",
    "subject": "can_view_profile",
    "description": "User can view their profile",
    "revoked": false,
    "createdAt": "2026-05-20T..."
  },
  "companyId": "company-A-123"
}
```

---

### Delete Permission

**DELETE** `/api/permissions/delete`

**Headers:**
```
x-api-key: [key]
x-company-id: [company-id]
Content-Type: application/json
```

**Request Body:**
```json
{
  "userUID": "uuid-here",
  "permissionId": "uuid-here"
}
```

---

### Revoke Permission

**POST** `/api/permissions/revoke`

**Headers:**
```
x-api-key: [key]
x-company-id: [company-id]
Content-Type: application/json
```

**Request Body:**
```json
{
  "userUID": "uuid-here",
  "permissionId": "uuid-here"
}
```

---

## 🔐 Security Features

### ✅ Company Existence Verification

**NEW:** Every API request now verifies that the company exists in the database before processing.

**Flow:**
```
1. Client sends request with x-company-id header
2. Backend extracts companyId
3. Backend queries Company collection
4. If NOT found → 403 Forbidden
5. If found → proceed with operation
```

**Response when company not found:**
```json
{
  "error": "Company not found or invalid companyId",
  "companyId": "invalid-id-123"
}
Status: 403 Forbidden
```

This prevents:
- ❌ Invalid companyId usage
- ❌ Accidental data operations with wrong company ID
- ❌ Unauthorized company access

### ✅ Multi-Tenant Isolation

**Company A:**
```
- Only sees Company A users/data/permissions
- Cannot access Company B data
- 404 error if attempting cross-company access
```

**Company B:**
```
- Only sees Company B users/data/permissions
- Cannot access Company A data
- 404 error if attempting cross-company access
```

### ✅ Query Patterns

All queries use `companyId` filter:

```javascript
// ✅ CORRECT (Multi-tenant safe)
User.findOne({ companyId, userUID })
Data.findOne({ companyId, dataId, userUID })
Permission.findOne({ companyId, permissionId })

// ❌ NEVER use (Cross-company vulnerability)
User.findById(id)
Data.findOne({ dataId })
```

### ✅ Ownership Verification

When creating data/permissions, backend verifies:

```javascript
// Verify user belongs to company
const user = await User.findOne({ companyId, userUID })
if (!user) {
  return 404 // User not in company
}
```

### ✅ Compound Unique Indexes

Prevents duplicate records across companies:

```
User: (companyId, userUID) unique
User: (companyId, email) unique
Data: (companyId, dataId) unique
Permission: (companyId, permissionId) unique
```

---

## 📝 Testing Examples

### Company A User

```bash
# Create user for Company A
curl -X POST http://localhost:3000/api/users \
  -H "x-api-key: test123" \
  -H "x-company-id: company-A-123" \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@company-a.com"}'

# Response:
# {
#   "success": true,
#   "userUID": "abc-123",
#   "companyId": "company-A-123",
#   "email": "alice@company-a.com"
# }
```

### Company B User

```bash
# Create user for Company B
curl -X POST http://localhost:3000/api/users \
  -H "x-api-key: test123" \
  -H "x-company-id: company-B-456" \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@company-b.com"}'

# Note: Same email allowed (different company)
# Response:
# {
#   "success": true,
#   "userUID": "def-456",
#   "companyId": "company-B-456",
#   "email": "alice@company-b.com"
# }
```

### Cross-Company Access Prevention

```bash
# Company B tries to access Company A's user
curl -X GET http://localhost:3000/api/users/abc-123 \
  -H "x-api-key: test123" \
  -H "x-company-id: company-B-456"

# Result: 404 Not Found
# {
#   "error": "User not found in company"
# }
```

---

## 🛠️ Implementation Details

### Middleware Pattern

Each route uses a `withCompanyId` wrapper:

```javascript
const withCompanyId = (handler) => {
    return async (req, res) => {
        const companyId = req.headers['x-company-id'];
        if (!companyId) {
            return res.status(400).json({ error: 'Missing x-company-id header' });
        }
        req.companyId = companyId;
        return handler(req, res);
    };
};

module.exports = withCompanyId(handler);
```

### Database Queries

All queries include `companyId`:

```javascript
// Create
await User.create({ companyId, userUID, email, createdAt })

// Find
const user = await User.findOne({ companyId, userUID })

// Update
await Data.updateOne({ companyId, dataId }, { revoked: true })

// Delete
await Permission.deleteOne({ companyId, permissionId, userUID })
```

---

## 📊 Database Indexes

For optimal performance, these indexes are automatically created:

```
User: index on companyId
User: compound unique index (companyId, userUID)
User: compound unique index (companyId, email)

Data: index on companyId
Data: index on userUID
Data: compound unique index (companyId, dataId)

Permission: index on companyId
Permission: index on userUID
Permission: compound unique index (companyId, permissionId)
```

---

## ✨ Response Format

All successful responses include:
- `success: true`
- `companyId: [company-id]`
- Relevant data fields

All error responses include:
- `error: [error-message]`
- Appropriate HTTP status code (400, 404, 409, 500)

---

## 🚀 Deployment

1. **Set Environment Variables:**
   ```
   MONGO_URI=your_mongodb_connection_string
   API_KEY=your_api_key
   ```

2. **Deploy:**
   ```bash
   git add .
   git commit -m "feat: Implement company-level multi-tenant isolation"
   git push origin main
   ```

3. **Verify MongoDB Atlas:**
   - Network Access: Allow `0.0.0.0/0` (for testing)
   - Indexes are auto-created by Mongoose

---

## 📌 Key Takeaways

✅ **Every request requires `x-company-id` header**
✅ **All data is filtered by companyId**
✅ **Cross-company access returns 404**
✅ **Duplicate prevention via compound indexes**
✅ **Ownership verified before operations**
✅ **Vercel serverless compatible**

---

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| 403 Company not found | Verify companyId exists: `/api/verify-company?companyId=6a0d...` |
| Missing x-company-id header | Add header to all requests |
| 404 on valid user/data | Check companyId matches the resource owner |
| Duplicate email error | Email exists for this company |
| User not found in company | User belongs to different company |
| Failed to create data | Verify user exists in company |
| Invalid companyId format | Must be valid MongoDB ObjectId |

---

## 🔧 Verify Your Company

Before using any API endpoint, verify your company exists:

**Example:**
```bash
curl -X GET "https://dpdp-ten.vercel.app/api/verify-company?companyId=6a0d5d1f86d3f6c11f287c86"

# Response:
{
  "success": true,
  "exists": true,
  "company": {
    "companyId": "6a0d5d1f86d3f6c11f287c86",
    "name": "POLO",
    "email": "polo@gmail.com"
  }
}
```

✅ If you get this response, your companyId is valid and ready to use!

---

