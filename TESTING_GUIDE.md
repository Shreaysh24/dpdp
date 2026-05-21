# Blockchain Data Storage - Testing Guide

## Unit Testing Setup

### Install Test Dependencies
```bash
npm install --save-dev jest supertest
```

### Test Example: Store Endpoint

Create `api/__tests__/store.test.js`:

```javascript
const request = require('supertest');
const mongoose = require('mongoose');
const { connectDB } = require('../../lib/mongodb');

describe('POST /dpdp/store', () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    test('should store data successfully', async () => {
        const testData = {
            permissionId: '507f1f77bcf86cd799439011',
            userUID: 'test-user-123',
            companyId: '507f1f77bcf86cd799439012',
            dataHash: '0x123abc'
        };

        const response = await request(app)
            .post('/dpdp/store')
            .send(testData)
            .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.blockchainTransaction).toBeDefined();
        expect(response.body.blockchainTransaction.transactionHash).toBeDefined();
    });

    test('should reject missing required fields', async () => {
        const response = await request(app)
            .post('/dpdp/store')
            .send({ permissionId: 'test' })
            .expect(400);

        expect(response.body.error).toBeDefined();
    });
});
```

## Manual Testing with cURL

### Test 1: Store Data
```bash
curl -X POST http://localhost:3000/dpdp/store \
  -H "Content-Type: application/json" \
  -d '{
    "permissionId": "507f1f77bcf86cd799439011",
    "userUID": "550e8400-e29b-41d4-a716-446655440000",
    "companyId": "507f1f77bcf86cd799439012",
    "dataHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  }' | jq .
```

### Test 2: Check Blockchain Status
```bash
# Replace with actual transaction hash from test 1
curl "http://localhost:3000/dpdp/blockchain-status?transactionHash=0xabcd1234..." | jq .
```

### Test 3: Query by Permission ID
```bash
curl "http://localhost:3000/dpdp/blockchain-status?permissionId=507f1f77bcf86cd799439011" | jq .
```

## Testing with Postman

### 1. Create New Request
- Method: **POST**
- URL: `http://localhost:3000/dpdp/store`

### 2. Set Headers
```
Content-Type: application/json
```

### 3. Set Body (JSON)
```json
{
  "permissionId": "507f1f77bcf86cd799439011",
  "userUID": "550e8400-e29b-41d4-a716-446655440000",
  "companyId": "507f1f77bcf86cd799439012",
  "dataHash": "0x123abc"
}
```

### 4. Send Request
Click Send and verify response contains `transactionHash`

## Testing Blockchain Transactions

### Verify on Block Explorer

1. Get transaction hash from response
2. Visit blockchain explorer based on network:
   - **Ethereum Sepolia**: https://sepolia.etherscan.io/tx/{transactionHash}
   - **Ethereum Mainnet**: https://etherscan.io/tx/{transactionHash}
   - **Polygon Mumbai**: https://mumbai.polygonscan.com/tx/{transactionHash}
   - **Polygon Mainnet**: https://polygonscan.com/tx/{transactionHash}

3. Verify:
   - Transaction status (Success/Failed)
   - Gas used
   - Block number
   - From address matches your wallet

## Testing MongoDB Records

### Connect to MongoDB

Using MongoDB Compass or shell:

```javascript
// View all blockchain transactions
db.blockchaintransactions.find()

// View specific transaction
db.blockchaintransactions.findOne({ 
  transactionHash: "0xabcd1234..." 
})

// View all transactions for a permission
db.blockchaintransactions.find({ 
  permissionId: "507f1f77bcf86cd799439011" 
})

// Check confirmations
db.blockchaintransactions.find(
  { transactionHash: "0xabcd1234..." },
  { confirmations: 1, status: 1 }
)

// Count transactions by status
db.blockchaintransactions.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])
```

## Performance Testing

### Load Testing with Apache Bench
```bash
# Simulate 100 requests with concurrency of 10
ab -n 100 -c 10 -p data.json -T application/json http://localhost:3000/dpdp/store
```

### Load Testing with wrk
```bash
# Install wrk first
# 4 threads, 10 connections, 30 second test
wrk -t4 -c10 -d30s -s script.lua http://localhost:3000/dpdp/store
```

## Debugging

### Enable Debug Logging

Add to blockchain.js:
```javascript
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  console.log('Blockchain operation:', {
    dataHash,
    permissionId,
    userUID,
    contractAddress: CONTRACT_ADDRESS
  });
}
```

### Check Network Connectivity
```bash
# Test RPC connection
curl -X POST https://eth-sepolia.g.alchemy.com/v2/demo \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Verify Private Key
```javascript
const { ethers } = require('ethers');
const wallet = new ethers.Wallet('your_private_key');
console.log('Wallet address:', wallet.address);
```

## Test Scenarios

### Scenario 1: Happy Path
1. Send valid store request
2. Verify transaction hash returned
3. Check MongoDB for record
4. Verify on blockchain explorer
5. Check status endpoint shows CONFIRMED

### Scenario 2: Invalid Input
1. Send request with missing fields
2. Verify 400 error returned
3. Check error message is descriptive

### Scenario 3: Non-existent User
1. Send request with invalid userUID
2. Verify 404 error returned

### Scenario 4: Non-existent Permission
1. Send request with invalid permissionId
2. Verify 404 error returned

### Scenario 5: Status Check
1. Store data (get transaction hash)
2. Immediately check status (should be PENDING)
3. Wait 12 confirmations
4. Check status again (should be CONFIRMED)

## Troubleshooting Failed Tests

| Issue | Solution |
|-------|----------|
| 404 Not Found | Verify MongoDB URI and database exist |
| 500 Internal Error | Check console logs for error details |
| RPC Connection Failed | Verify RPC_URL and network status |
| Invalid Private Key | Validate private key format in .env |
| Insufficient Balance | Ensure wallet has ETH for gas fees |

## Continuous Integration Testing

### GitHub Actions Example (.github/workflows/test.yml)
```yaml
name: Test Blockchain Integration

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo
        options: >-
          --health-cmd mongo
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm test
        env:
          MONGODB_URI: mongodb://localhost:27017/dpdp-test
          PrivateKey: ${{ secrets.PRIVATE_KEY }}
          contractAddress: ${{ secrets.CONTRACT_ADDRESS }}
          RPC_URL: ${{ secrets.RPC_URL }}
```

## Monitoring in Production

### Setup Alerts

```javascript
// Send alert if transaction fails
if (blockchainResult.status === 'FAILED') {
  await sendAlert({
    severity: 'HIGH',
    message: 'Blockchain transaction failed',
    transactionHash: blockchainResult.transactionHash,
    timestamp: new Date()
  });
}

// Alert if too many pending transactions
const pendingCount = await BlockchainTransaction.countDocuments({ 
  status: 'PENDING' 
});
if (pendingCount > 100) {
  await sendAlert({
    severity: 'MEDIUM',
    message: `${pendingCount} pending blockchain transactions`,
    timestamp: new Date()
  });
}
```

