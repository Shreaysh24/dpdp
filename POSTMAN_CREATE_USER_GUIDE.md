# Postman Guide - Create User with DPDP Backend

## 📌 Prerequisites

1. **Postman installed** - [Download here](https://www.postman.com/downloads/)
2. **Valid companyId** - Verify company exists first
3. **MongoDB connection** - Backend must be connected to MongoDB
4. **API Key** - Available in environment variables

---

## ✅ Step 1: Verify Your Company Exists

Before creating a user, verify your company ID is valid.

### Using Postman:

1. **Create a new request**
   - Click **+ New** → **Request**
   - Name: `Verify Company`

2. **Set Method to GET**
   - Click dropdown showing "GET"

3. **Enter URL:**
   ```
   http://localhost:3000/api/verify-company?companyId=6a0d5d1f86d3f6c11f287c86
   ```
   Or for Vercel deployment:
   ```
   https://dpdp-ten.vercel.app/api/verify-company?companyId=6a0d5d1f86d3f6c11f287c86
   ```

4. **Click Send**

5. **Expected Response (200 OK):**
   ```json
   {
     "success": true,
     "exists": true,
     "company": {
       "companyId": "6a0d5d1f86d3f6c11f287c86",
       "name": "POLO",
       "email": "polo@gmail.com",
       "domain": "polo@gmail.com",
       "createdAt": "2026-05-20T07:05:03.067+00:00"
     }
   }
   ```

✅ **If you see this, your company is valid!**

---

## 🚀 Step 2: Create Create User Request

### 1. **Create New Request**

- Click **+ New** → **Request**
- Name: `Create User`
- Click **Create**

### 2. **Set HTTP Method**

- Click dropdown at top left
- Select **POST**

### 3. **Enter Endpoint URL**

**For Local Development:**
```
http://localhost:3000/api/users
```

**For Vercel Production:**
```
https://dpdp-ten.vercel.app/api/users
```

---

## 📝 Step 3: Add Headers

Click on the **Headers** tab below the URL bar.

Add these 3 headers:

| Key | Value | Description |
|-----|-------|-------------|
| `x-api-key` | `test123` | API key for authentication |
| `x-company-id` | `6a0d5d1f86d3f6c11f287c86` | Company ID (replace with your actual ID) |
| `Content-Type` | `application/json` | Request body format |

**Visual Steps:**
1. Click **Headers** tab
2. First row:
   - KEY: `x-api-key`
   - VALUE: `test123`
3. Second row:
   - KEY: `x-company-id`
   - VALUE: `6a0d5d1f86d3f6c11f287c86` (your company ID)
4. Third row:
   - KEY: `Content-Type`
   - VALUE: `application/json`

---

## 📦 Step 4: Add Request Body

1. Click on the **Body** tab
2. Select **raw** (radio button)
3. Select **JSON** from dropdown (right side)
4. Paste this JSON:

```json
{
  "email": "user@polo.com"
}
```

**Example Bodies:**
```json
{
  "email": "alice@polo.com"
}
```

```json
{
  "email": "bob@polo.com"
}
```

```json
{
  "email": "contact@company.com"
}
```

---

## ✨ Step 5: Send Request

1. Click **Send** button (blue button on right)
2. Wait for response

---

## ✅ Success Response (201 Created)

```json
{
  "success": true,
  "userUID": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "companyId": "6a0d5d1f86d3f6c11f287c86",
  "email": "user@polo.com"
}
```

**Status Code:** `201 Created`

### Response Details:
- **success**: `true` - User created successfully
- **userUID**: Unique identifier for the user (UUID v4)
- **companyId**: Company the user belongs to
- **email**: Email address of the user

---

## ❌ Error Responses

### 1. Missing Email

**Request Body:**
```json
{}
```

**Response (400 Bad Request):**
```json
{
  "error": "Email is required"
}
```

---

### 2. Missing x-company-id Header

**Headers:** (without x-company-id)
```
x-api-key: test123
Content-Type: application/json
```

**Response (400 Bad Request):**
```json
{
  "error": "Missing companyId - x-company-id header required"
}
```

---

### 3. Invalid Company ID

**Headers:**
```
x-api-key: test123
x-company-id: invalid-id-123
Content-Type: application/json
```

**Response (403 Forbidden):**
```json
{
  "error": "Company not found or invalid companyId",
  "companyId": "invalid-id-123"
}
```

✅ **Solution:** Use `/api/verify-company` to get valid companyId

---

### 4. Duplicate Email

**First Request:**
```json
{
  "email": "duplicate@polo.com"
}
```
✅ Response: `201 Created`

**Second Request (same email):**
```json
{
  "email": "duplicate@polo.com"
}
```

**Response (409 Conflict):**
```json
{
  "error": "Email already exists for this company"
}
```

✅ **Solution:** Use a different email address

---

### 5. Missing x-api-key Header

**Headers:** (without x-api-key)
```
x-company-id: 6a0d5d1f86d3f6c11f287c86
Content-Type: application/json
```

**Response (401 Unauthorized):**
```json
{
  "error": "Missing API key"
}
```

---

### 6. Invalid x-api-key

**Headers:**
```
x-api-key: wrong-key-123
x-company-id: 6a0d5d1f86d3f6c11f287c86
Content-Type: application/json
```

**Response (403 Forbidden):**
```json
{
  "error": "Invalid API key"
}
```

---

## 📋 Complete Request Summary

```
METHOD: POST
URL: http://localhost:3000/api/users

HEADERS:
  x-api-key: test123
  x-company-id: 6a0d5d1f86d3f6c11f287c86
  Content-Type: application/json

BODY (raw JSON):
{
  "email": "user@polo.com"
}

EXPECTED RESPONSE: 201 Created
{
  "success": true,
  "userUID": "uuid-here",
  "companyId": "6a0d5d1f86d3f6c11f287c86",
  "email": "user@polo.com"
}
```

---

## 💾 Save Request in Postman

1. Click **Save** button (top right)
2. Enter **Request Name**: `Create User - POLO`
3. Select **Collection**: Create new or choose existing
4. Click **Save**

**Now you can reuse this request anytime!**

---

## 🔄 Create Multiple Users

1. Change the email in **Body** tab
2. Click **Send** again
3. Repeat for each user

**Example Sequence:**
```json
// Request 1
{"email": "alice@polo.com"}

// Request 2
{"email": "bob@polo.com"}

// Request 3
{"email": "charlie@polo.com"}

// Request 4
{"email": "diana@polo.com"}
```

Each will return different `userUID` but same `companyId`.

---

## 🎯 Quick Checklist

Before sending request, verify:

- ✅ Method is **POST**
- ✅ URL is correct (`/api/users`)
- ✅ **Body** tab has JSON with `email`
- ✅ **Headers** tab has:
  - `x-api-key: test123`
  - `x-company-id: 6a0d5d1f86d3f6c11f287c86` (valid ID)
  - `Content-Type: application/json`
- ✅ Email is valid format (`user@domain.com`)
- ✅ Email is unique per company
- ✅ Company ID verified with `/api/verify-company`

---

## 📱 Mobile/Postman Web

The same steps work in:
- **Postman Desktop App** (recommended)
- **Postman Web** (https://web.postman.co/)
- **Postman Mobile** (iOS/Android)

---

## 🚀 Environment Variables (Optional)

For easier testing, setup **Environment Variables** in Postman:

1. Click **Environments** (left sidebar)
2. Click **Create** (or edit existing)
3. Add variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `baseUrl` | `http://localhost:3000` | `http://localhost:3000` |
| `apiKey` | `test123` | `test123` |
| `companyId` | `6a0d5d1f86d3f6c11f287c86` | `6a0d5d1f86d3f6c11f287c86` |

4. Use in requests:
   ```
   {{baseUrl}}/api/users
   x-api-key: {{apiKey}}
   x-company-id: {{companyId}}
   ```

This makes switching between environments (local/production) easier!

---

## 📞 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Connection refused" | Verify backend is running on correct port |
| "Invalid API key" | Check `x-api-key` value |
| "Company not found" | Verify `x-company-id` exists with `/api/verify-company` |
| "Email already exists" | Use different email address |
| "Missing header" | Ensure all 3 headers are present |
| "No response" | Check internet connection |

---

## 🎓 Next Steps

After creating users:

1. **Create Data** - Store data for users
2. **Create Permissions** - Set permissions for users
3. **View Data** - Retrieve user data
4. **Revoke Data** - Mark data as revoked

See [MULTI_TENANT_GUIDE.md](./MULTI_TENANT_GUIDE.md) for other endpoints.

---

## ✨ Full Workflow Example

```
1. Verify Company
   GET /api/verify-company?companyId=6a0d5d1f86d3f6c11f287c86
   ↓ (confirm it exists)

2. Create User 1
   POST /api/users
   {"email": "alice@polo.com"}
   ↓ (get userUID-1)

3. Create User 2
   POST /api/users
   {"email": "bob@polo.com"}
   ↓ (get userUID-2)

4. Store Data for User 1
   POST /api/data
   {
     "userUID": "userUID-1",
     "data": {"type": "email", "value": "alice@example.com"}
   }
   ↓ (get dataId)

5. Store Permission for User 1
   POST /api/permissions
   {
     "userUID": "userUID-1",
     "data": {"subject": "can_view_profile"}
   }
   ↓ (get permissionId)

6. View Data
   GET /api/data/userUID-1/dataId
   ↓ (see stored data)
```

---

## 💡 Pro Tips

1. **Save Requests** - Save frequently used requests to collections
2. **Use Variables** - Replace hardcoded values with `{{variable}}`
3. **Test Collections** - Run multiple requests in sequence
4. **Pre-request Scripts** - Automate setup before requests
5. **Response Assertions** - Add tests to validate responses

---

## 📖 Related Guides

- [MULTI_TENANT_GUIDE.md](./MULTI_TENANT_GUIDE.md) - Complete API documentation
- [Store Data with Postman](#) - Create data records
- [Store Permissions with Postman](#) - Create permissions
- [View Records with Postman](#) - Retrieve data/permissions
- [Revoke/Delete with Postman](#) - Revoke or delete records

