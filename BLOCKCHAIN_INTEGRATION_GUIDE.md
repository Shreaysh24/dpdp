# Blockchain Data Storage Integration Guide

## Overview
This guide explains how to use the blockchain integration for storing data with immutable blockchain transaction records in your MongoDB database.

## Architecture

```
Frontend Form (HTML)
    ↓
POST /api/store
    ↓
Backend (Node.js/Express)
    ├─ Validates input data
    ├─ Creates blockchain transaction (via ethers.js)
    ├─ Stores transaction in MongoDB
    └─ Returns transaction hash & database ID
    ↓
Smart Contract (Ethereum/Polygon/etc)
    ├─ Stores data hash
    ├─ Records permission ID
    └─ Emits event
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

This installs ethers.js v6 for blockchain interactions.

### 2. Environment Variables (.env)

Required variables:
```
MONGODB_URI=your_mongodb_connection_string
contractAddress=0x78471F2935388c3A246CCbEE723bda1350EfD158
PrivateKey=20d9b826fc3140aec57473a338e7a361ffe832798ab6246ab6bdd0942b4e2ad6
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/demo
NODE_ENV=development
```

**⚠️ Security Notes:**
- Never commit .env file to git
- Use different networks for dev/prod (Sepolia for testnet, Mainnet for production)
- Consider using environment variable services like AWS Secrets Manager for production
- Rotate private keys regularly
- Use hardware wallets for production deployments

### 3. Supported Networks

Replace RPC_URL based on your network:
- **Ethereum Sepolia (Testnet)**: `https://eth-sepolia.g.alchemy.com/v2/your-api-key`
- **Ethereum Mainnet**: `https://eth-mainnet.g.alchemy.com/v2/your-api-key`
- **Polygon Mumbai (Testnet)**: `https://rpc-mumbai.maticvigil.com`
- **Polygon Mainnet**: `https://polygon-rpc.com`

## API Endpoints

### 1. Store Data on Blockchain

**Endpoint:** `POST /dpdp/store`

**Request:**
```json
{
  "permissionId": "507f1f77bcf86cd799439011",
  "userUID": "550e8400-e29b-41d4-a716-446655440000",
  "companyId": "507f1f77bcf86cd799439012",
  "dataHash": "0x1234567890abcdef..." // optional, auto-generated if not provided
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Data stored successfully on blockchain and database",
  "blockchainTransaction": {
    "transactionHash": "0xabcd1234...",
    "blockNumber": 5123456,
    "status": "CONFIRMED",
    "confirmations": 12,
    "contractAddress": "0x78471F2935388c3A246CCbEE723bda1350EfD158"
  },
  "databaseRecord": {
    "id": "507f1f77bcf86cd799439013",
    "permissionId": "507f1f77bcf86cd799439011",
    "userUID": "550e8400-e29b-41d4-a716-446655440000",
    "companyId": "507f1f77bcf86cd799439012",
    "dataHash": "0x1234567890abcdef..."
  },
  "timestamp": "2024-05-21T10:30:00Z"
}
```

**Response (Error - 400/500):**
```json
{
  "error": "Failed to store data",
  "message": "Error description here",
  "details": "Stack trace (only in development)"
}
```

### 2. Check Blockchain Transaction Status

**Endpoint:** `GET /dpdp/blockchain-status`

**Query Parameters:**
- `transactionHash` (string): Transaction hash to check
- OR `permissionId` (string): Permission ID to check

**Request Example:**
```
GET /dpdp/blockchain-status?transactionHash=0xabcd1234...
```

**Response (Success - 200):**
```json
{
  "success": true,
  "transaction": {
    "transactionHash": "0xabcd1234...",
    "permissionId": "507f1f77bcf86cd799439011",
    "userUID": "550e8400-e29b-41d4-a716-446655440000",
    "status": "CONFIRMED",
    "blockNumber": 5123456,
    "confirmations": 12,
    "gasUsed": "125000",
    "from": "0x1234567890abcdef...",
    "contractAddress": "0x78471F2935388c3A246CCbEE723bda1350EfD158",
    "createdAt": "2024-05-21T10:30:00Z",
    "updatedAt": "2024-05-21T10:35:00Z"
  }
}
```

## Database Models

### BlockchainTransaction Schema
```javascript
{
  _id: ObjectId,
  companyId: ObjectId (ref: Company),
  userUID: String,
  permissionId: String,
  dataHash: String,
  operationType: String (STORE|REVOKE|UPDATE|TRANSFER),
  transactionHash: String (unique, indexed),
  blockNumber: Number,
  gasUsed: String,
  status: String (PENDING|CONFIRMED|FAILED),
  contractAddress: String,
  from: String (wallet address),
  confirmations: Number,
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

## Frontend Integration

### HTML Form Example

See [blockchain-storage-form.html](../blockchain-storage-form.html) for a complete example with:
- Form validation
- Loading states
- Error handling
- Success feedback
- Transaction details display

### Key Features:
- Auto-generates hash if not provided
- Shows real-time feedback
- Displays transaction hash for blockchain verification
- Shows database record ID for tracking
- Responsive design

## Smart Contract Integration

### Current Contract ABI
The contract must implement:
```solidity
function storeData(
    bytes32 dataHash,
    string memory permissionId,
    string memory userUID
) external
```

### To Use Different Contract:
1. Update `CONTRACT_ABI` in [lib/blockchain.js](lib/blockchain.js)
2. Update `contractAddress` in .env
3. Ensure contract functions match the ABI

## Usage Examples

### Example 1: Store Data from Frontend
```javascript
const response = await fetch("http://localhost:3000/dpdp/store", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    permissionId: "507f1f77bcf86cd799439011",
    userUID: "550e8400-e29b-41d4-a716-446655440000",
    companyId: "507f1f77bcf86cd799439012",
    dataHash: "0x123..." // optional
  })
});

const data = await response.json();
if (data.success) {
  console.log("Transaction Hash:", data.blockchainTransaction.transactionHash);
}
```

### Example 2: Check Transaction Status
```javascript
const response = await fetch(
  "http://localhost:3000/dpdp/blockchain-status?transactionHash=0xabcd1234..."
);
const data = await response.json();
console.log(`Status: ${data.transaction.status}, Confirmations: ${data.transaction.confirmations}`);
```

### Example 3: Query MongoDB for Blockchain Records
```javascript
// Using MongoDB shell
db.blockchaintransactions.find({ permissionId: "507f1f77bcf86cd799439011" });

// Using Mongoose in Node.js
const BlockchainTransaction = require('./models/BlockchainTransaction');
const txs = await BlockchainTransaction.find({ permissionId });
```

## Transaction Flow

1. **Submit Data** → Frontend sends form data to `/dpdp/store`
2. **Validate** → Backend validates companyId, userUID, permissionId exist
3. **Blockchain Write** → Create transaction on smart contract
4. **Record Transaction** → Save transaction details to MongoDB
5. **Return Details** → Send transaction hash and database ID to frontend
6. **Monitor Status** → Use `/dpdp/blockchain-status` to check confirmations

## Gas Estimation

Transaction gas usage varies based on:
- Network congestion
- Data size
- Contract complexity
- Current gas price

Current average gas: ~125,000 for `storeData` function

## Troubleshooting

### Issue: "PrivateKey environment variable is not set"
**Solution:** Add `PrivateKey=your_private_key` to .env file

### Issue: "Invalid contract ABI"
**Solution:** Ensure contract ABI in `lib/blockchain.js` matches deployed contract

### Issue: "RPC_URL connection failed"
**Solution:** 
- Verify RPC_URL is correct
- Check network is up and running
- Ensure API key (if required) is valid

### Issue: "Gas estimation failed"
**Solution:**
- Check wallet has sufficient funds for gas
- Verify contract address is correct
- Ensure contract function exists in ABI

### Issue: Transaction pending for too long
**Solution:**
- Increase gas price in blockchain.js
- Check network status
- Use `/dpdp/blockchain-status` to verify transaction

## Security Best Practices

1. **Private Keys**: Never commit to repository
2. **Environment Variables**: Use secure vaults in production
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Implement rate limiting on `/dpdp/store` endpoint
5. **Input Validation**: All inputs are validated server-side
6. **Authorization**: Add proper authorization checks
7. **Audit Logging**: Log all blockchain operations
8. **Network Security**: Use VPN/firewall for production

## Performance Considerations

- Blockchain transactions take 12-15 seconds on average
- Database operations complete within 100-300ms
- MongoDB indexes optimize lookups
- Consider batch operations for high-volume scenarios

## Future Enhancements

- [ ] Batch blockchain operations
- [ ] Webhook notifications for transaction confirmations
- [ ] Multi-signature wallet support
- [ ] Fallback chains (Polygon fallback if Ethereum fails)
- [ ] Offline transaction queuing
- [ ] Transaction retry mechanism

## Support & References

- [ethers.js Documentation](https://docs.ethers.org/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Ethereum JSON-RPC API](https://ethereum.org/en/developers/docs/apis/json-rpc/)
- [Alchemy API Docs](https://docs.alchemy.com/)
