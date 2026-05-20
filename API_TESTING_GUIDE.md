# DPDP Backend API Testing Guide

Complete guide to test all 9 API endpoints locally and after deployment.

---

## Prerequisites ✅

Before testing, setup:

### 1. Environment Setup
```bash
# Install dependencies
npm install

# Create .env file with MongoDB connection
# Local MongoDB:
MONGO_URI=mongodb://localhost:27017/dpdp

# OR MongoDB Atlas:
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dpdp?retryWrites=true&w=majority

NODE_ENV=development
```

### 2. Start MongoDB
```bash
# Local MongoDB
mongod

# OR ensure MongoDB Atlas is running
```

### 3. Create Test Company in MongoDB

Open MongoDB Compass or shell and run:

```javascript
db.companies.insertOne({
  apiKey: "test-api-key-123",
  name: "Test Company",
  email: "admin@company.com",
  domain: "company.com"
})
```

**Note the apiKey:** `test-api-key-123` - Use this in all requests.

### 4. Start Server
```bash
# Local testing
node server.js

# Or with Vercel CLI
vercel dev
```

Expected output:
```
🚀 Server running on http://localhost:3000
```

---

## Common Headers (All Requests)

```
x-api-key: test-api-key-123
Content-Type: application/json
```

---

## API Endpoints Testing

### 1️⃣ CREATE USER
**Endpoint:** `POST /dpdp/users`

**Purpose:** Create a new user for the company

**Request Body:**
```json
{
  "email": "john@company.com"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "userUID": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@company.com"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/dpdp/users \
  -H "x-api-key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{"email": "john@company.com"}'
```

**Postman:**
- Method: POST
- URL: `http://localhost:3000/dpdp/users`
- Headers: `x-api-key: test-api-key-123`
- Body (raw, JSON): `{"email": "john@company.com"}`

**Test Cases:**
| Test Case | Input | Expected | Status |
|-----------|-------|----------|--------|
| Valid email | `{"email": "john@company.com"}` | Success, userUID generated | 201 |
| Duplicate email | Same email twice | Email exists error | 409 |
| Missing email | `{}` | Email required error | 400 |
| Invalid email | `{"email": "invalid"}` | Invalid format error | 400 |
| Invalid API key | Wrong x-api-key | Invalid API key error | 403 |

**Save userUID for next tests:** `550e8400-e29b-41d4-a716-446655440000`

---

### 2️⃣ LIST ALL DATA (GET ALL DATA FOR USER)
**Endpoint:** `GET /dpdp/data/:userUID`

**Purpose:** Get all data records for a specific user

**URL Parameters:**
- `userUID`: User's unique ID

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "data-record-id-1",
      "userUID": "550e8400-e29b-41d4-a716-446655440000",
      "type": "email",
      "value": "user@personal.com",
      "revoked": false,
      "createdAt": "2026-05-20T10:30:00.000Z",
      "updatedAt": "2026-05-20T10:30:00.000Z"
    },
    {
      "_id": "data-record-id-2",
      "userUID": "550e8400-e29b-41d4-a716-446655440000",
      "type": "phone",
      "value": "+1234567890",
      "revoked": false,
      "createdAt": "2026-05-20T10:31:00.000Z",
      "updatedAt": "2026-05-20T10:31:00.000Z"
    }
  ],
  "count": 2
}
```

**cURL:**
```bash
curl -X GET "http://localhost:3000/dpdp/data/550e8400-e29b-41d4-a716-446655440000" \
  -H "x-api-key: test-api-key-123"
```

**Postman:**
- Method: GET
- URL: `http://localhost:3000/dpdp/data/{{userUID}}`
- Headers: `x-api-key: test-api-key-123`

**Test Cases:**
| Test Case | Input | Expected | Status |
|-----------|-------|----------|--------|
| Valid userUID | Existing user | Returns array of data | 200 |
| User with no data | Valid userUID, no records | Returns empty array | 200 |
| Invalid userUID | Wrong userUID | Returns empty array | 200 |

---

### 3️⃣ STORE DATA
**Endpoint:** `POST /dpdp/data`

**Purpose:** Store data record for a user

**Request Body:**
```json
{
  "userUID": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "type": "email",
    "value": "user@personal.com"
  }
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "dataId": "uuid-of-data-record",
  "userUID": "550e8400-e29b-41d4-a716-446655440000"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/dpdp/data \
  -H "x-api-key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "userUID": "550e8400-e29b-41d4-a716-446655440000",
    "data": {
      "type": "email",
      "value": "user@personal.com"
    }
  }'
```

**Test Cases:**
| Test Case | Input | Expected | Status |
|-----------|-------|----------|--------|
| Valid data | Correct format | Success, dataId generated | 201 |
| Missing userUID | No userUID | Error: Missing userUID | 400 |
| Invalid data value | `"value": ""` | Error: non-empty string | 400 |
| Invalid data type | `"value": 123` (number) | Error: must be string | 400 |
| User not found | Wrong userUID | Error: User not found | 404 |

**Save dataId for next tests:** (from response)

---

### 4️⃣ DELETE DATA (Hard Delete)
**Endpoint:** `POST /dpdp/data/delete`

**Purpose:** Permanently delete a data record

**Request Body:**
```json
{
  "userUID": "550e8400-e29b-41d4-a716-446655440000",
  "dataId": "data-record-id"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Data deleted successfully"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/dpdp/data/delete \
  -H "x-api-key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "userUID": "550e8400-e29b-41d4-a716-446655440000",
    "dataId": "data-record-id"
  }'
```

**Test Cases:**
| Test Case | Input | Expected | Status |
|-----------|-------|----------|--------|
| Valid ID | Correct IDs | Success, record deleted | 200 |
| Invalid ID | Wrong dataId | Error: Not found | 404 |
| Missing ID | No dataId | Error: Missing field | 400 |

---

### 5️⃣ REVOKE DATA (Soft Delete)
**Endpoint:** `POST /dpdp/data/revoke`

**Purpose:** Mark data as revoked (soft delete, not permanent)

**Request Body:**
```json
{
  "userUID": "550e8400-e29b-41d4-a716-446655440000",
  "dataId": "data-record-id"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Data revoked successfully"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/dpdp/data/revoke \
  -H "x-api-key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "userUID": "550e8400-e29b-41d4-a716-446655440000",
    "dataId": "data-record-id"
  }'
```

**Verification:**
- After revoke, GET the data record
- Check `"revoked": true` in response
- Field exists but marked as revoked

**Test Cases:**
| Test Case | Input | Expected | Status |
|-----------|-------|----------|--------|
| Valid revoke | Correct IDs | Success, revoked=true | 200 |
| Already revoked | Same ID twice | Second should still succeed | 200 |
| Invalid ID | Wrong dataId | Error: Not found | 404 |

---

### 6️⃣ CREATE PERMISSION
**Endpoint:** `POST /dpdp/permissions`

**Purpose:** Create a permission record for user

**Request Body:**
```json
{
  "userUID": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "subject": "view_documents",
    "description": "User can view all company documents"
  }
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "permissionId": "uuid-of-permission",
  "userUID": "550e8400-e29b-41d4-a716-446655440000"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/dpdp/permissions \
  -H "x-api-key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "userUID": "550e8400-e29b-41d4-a716-446655440000",
    "data": {
      "subject": "view_documents",
      "description": "User can view all company documents"
    }
  }'
```

**Test Cases:**
| Test Case | Input | Expected | Status |
|-----------|-------|----------|--------|
| Valid permission | Correct format | Success, permissionId | 201 |
| Missing subject | No subject field | Error: Missing field | 400 |
| Empty subject | `"subject": ""` | Error: non-empty string | 400 |
| User not found | Invalid userUID | Error: User not found | 404 |

**Save permissionId:** (from response)

---

### 7️⃣ DELETE PERMISSION (Hard Delete)
**Endpoint:** `POST /dpdp/permissions/delete`

**Purpose:** Permanently delete a permission record

**Request Body:**
```json
{
  "userUID": "550e8400-e29b-41d4-a716-446655440000",
  "permissionId": "permission-id"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Permission deleted successfully"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/dpdp/permissions/delete \
  -H "x-api-key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "userUID": "550e8400-e29b-41d4-a716-446655440000",
    "permissionId": "permission-id"
  }'
```

**Test Cases:**
| Test Case | Input | Expected | Status |
|-----------|-------|----------|--------|
| Valid delete | Correct IDs | Success, record deleted | 200 |
| Invalid ID | Wrong permissionId | Error: Not found | 404 |

---

### 8️⃣ REVOKE PERMISSION (Soft Delete)
**Endpoint:** `POST /dpdp/permissions/revoke`

**Purpose:** Mark permission as revoked (soft delete)

**Request Body:**
```json
{
  "userUID": "550e8400-e29b-41d4-a716-446655440000",
  "permissionId": "permission-id"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Permission revoked successfully"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/dpdp/permissions/revoke \
  -H "x-api-key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "userUID": "550e8400-e29b-41d4-a716-446655440000",
    "permissionId": "permission-id"
  }'
```

**Test Cases:**
| Test Case | Input | Expected | Status |
|-----------|-------|----------|--------|
| Valid revoke | Correct IDs | Success, revoked=true | 200 |
| Already revoked | Same ID twice | Second succeeds | 200 |

---

## Complete Test Workflow ✅

Run these in order to test complete flow:

### Step 1: Create User
```bash
curl -X POST http://localhost:3000/dpdp/users \
  -H "x-api-key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@company.com"}'
```
**Save:** `userUID`

### Step 2: Store Data
```bash
curl -X POST http://localhost:3000/dpdp/data \
  -H "x-api-key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "userUID": "USER_UID_FROM_STEP1",
    "data": {
      "type": "email",
      "value": "user@email.com"
    }
  }'
```
**Save:** `dataId`

### Step 3: List All Data
```bash
curl -X GET "http://localhost:3000/dpdp/data/USER_UID_FROM_STEP1" \
  -H "x-api-key: test-api-key-123"
```
**Expected:** Array with data records

### Step 4: Create Permission
```bash
curl -X POST http://localhost:3000/dpdp/permissions \
  -H "x-api-key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "userUID": "USER_UID_FROM_STEP1",
    "data": {
      "subject": "read_data",
      "description": "Can read user data"
    }
  }'
```
**Save:** `permissionId`

### Step 5: List All Permissions
```bash
curl -X GET "http://localhost:3000/dpdp/permissions/USER_UID_FROM_STEP1" \
  -H "x-api-key: test-api-key-123"
```
**Expected:** Array with permission records

### Step 6: Revoke Data
```bash
curl -X POST http://localhost:3000/dpdp/data/revoke \
  -H "x-api-key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "userUID": "USER_UID_FROM_STEP1",
    "dataId": "DATA_ID_FROM_STEP2"
  }'
```

### Step 7: Verify Revoked (List Data again to verify)
```bash
curl -X GET "http://localhost:3000/dpdp/data/USER_UID_FROM_STEP1" \
  -H "x-api-key: test-api-key-123"
```
**Expected:** Data records array with `"revoked": true` for the revoked record

### Step 8: Revoke Permission
```bash
curl -X POST http://localhost:3000/dpdp/permissions/revoke \
  -H "x-api-key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "userUID": "USER_UID_FROM_STEP1",
    "permissionId": "PERMISSION_ID_FROM_STEP4"
  }'
```

### Step 9: Delete Data (Hard Delete)
```bash
curl -X POST http://localhost:3000/dpdp/data/delete \
  -H "x-api-key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "userUID": "USER_UID_FROM_STEP1",
    "dataId": "DATA_ID_FROM_STEP2"
  }'
```

---

## Multi-Tenant Isolation Test 🔐

Verify that companies are isolated:

### Create Second Company
```javascript
db.companies.insertOne({
  apiKey: "company-2-api-key",
  name: "Company 2",
  email: "admin@company2.com",
  domain: "company2.com"
})
```

### Create User in Company 2
```bash
curl -X POST http://localhost:3000/dpdp/users \
  -H "x-api-key: company-2-api-key" \
  -H "Content-Type: application/json" \
  -d '{"email": "user2@company2.com"}'
```

### Try to Access Company 1 Data (Should Fail)
```bash
# Using Company 2's API key to access Company 1's userUID
curl -X GET "http://localhost:3000/dpdp/data/USER_FROM_COMPANY1/DATA_FROM_COMPANY1" \
  -H "x-api-key: company-2-api-key"
```
**Expected:** 404 (Not found - Company 2 cannot see Company 1 data)

---

## Error Cases to Test ❌

| Error Case | Request | Expected Response |
|-----------|---------|-------------------|
| Missing API key | No x-api-key header | `{"error": "Missing x-api-key header"}` |
| Invalid API key | Wrong x-api-key value | `{"error": "Invalid API key"}` |
| Invalid email | `{"email": "invalid"}` | `{"error": "Invalid email format"}` |
| Duplicate email | Same email twice | `{"error": "Email already exists for this company"}` |
| User not found | Wrong userUID | `{"error": "User not found in company"}` |
| Data not found | Wrong dataId | `{"error": "Data record not found"}` |
| Empty value | `{"data": {"type": "email", "value": ""}}` | `{"error": "data.value must be a non-empty string"}` |
| Wrong method | GET instead of POST | `{"error": "Method not allowed"}` |

---

## Deployment Testing Checklist ✅

After deploying to Vercel:

- [ ] Update all `http://localhost:3000` to `https://your-vercel-domain.com` in tests
- [ ] Test create user endpoint
- [ ] Test list all data endpoint
- [ ] Test store data endpoint
- [ ] Test revoke data endpoint
- [ ] Test delete data endpoint
- [ ] Test list all permissions endpoint
- [ ] Test create permission endpoint
- [ ] Test revoke permission endpoint
- [ ] Test delete permission endpoint
- [ ] Test multi-tenant isolation (two companies)
- [ ] Test error cases (invalid API key, missing fields)
- [ ] Verify no companyId exposed in responses
- [ ] Check database records in MongoDB Atlas
- [ ] Monitor Vercel logs for errors

---

## Notes

✅ **No companyId in responses** - Internal field not exposed in API
✅ **Automatic timestamps** - createdAt, updatedAt added by MongoDB
✅ **Soft delete** - Revoke marks as revoked, doesn't delete
✅ **Hard delete** - Delete removes record completely
✅ **Multi-tenant** - Each company sees only their data

---

**Happy Testing! 🚀**
