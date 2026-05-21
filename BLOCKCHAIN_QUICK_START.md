# Quick Start - Blockchain Data Storage

## ⚡ 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Check Your .env File
Ensure these variables are set:
```
MONGODB_URI=your_mongodb_connection
contractAddress=0x78471F2935388c3A246CCbEE723bda1350EfD158
PrivateKey=your_private_key_here
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/demo
```

### 3. Start Your Backend
```bash
npm start
```

### 4. Open the Form
Open [blockchain-storage-form.html](../../blockchain-storage-form.html) in your browser

### 5. Submit Data
Fill in the form and click "Store Data on Blockchain"

## 📡 API Quick Reference

### Store Data
```bash
curl -X POST http://localhost:3000/dpdp/store \
  -H "Content-Type: application/json" \
  -d '{
    "permissionId": "507f1f77bcf86cd799439011",
    "userUID": "550e8400-e29b-41d4-a716-446655440000",
    "companyId": "507f1f77bcf86cd799439012",
    "dataHash": "0x1234567890abcdef"
  }'
```

### Check Status
```bash
curl "http://localhost:3000/dpdp/blockchain-status?transactionHash=0xabcd1234..."
```

## ✅ What Gets Stored

1. **Blockchain**: Immutable record on smart contract
2. **MongoDB**:
   - BlockchainTransaction: Full transaction details
   - Data: Reference to transaction hash

## 🔐 Security Notes

⚠️ **IMPORTANT**: 
- Keep your PrivateKey secret
- Never commit .env to git
- Use test networks for development
- Rotate keys regularly

## 📚 Full Documentation

See [BLOCKCHAIN_INTEGRATION_GUIDE.md](BLOCKCHAIN_INTEGRATION_GUIDE.md) for complete details.

## Common Issues

| Issue | Solution |
|-------|----------|
| "PrivateKey not set" | Add PrivateKey to .env |
| "Contract not found" | Verify contractAddress in .env |
| "RPC connection failed" | Check RPC_URL and network status |
| "Transaction pending" | Wait for blockchain confirmation |

## Files Modified/Created

```
backend/
├── .env (updated)
├── package.json (updated - added ethers.js)
├── vercel.json (updated - added routes)
├── BLOCKCHAIN_INTEGRATION_GUIDE.md (new)
├── BLOCKCHAIN_QUICK_START.md (this file)
├── models/
│   └── BlockchainTransaction.js (new)
├── lib/
│   └── blockchain.js (new)
├── api/
│   ├── store.js (new)
│   └── blockchain-status.js (new)
└── blockchain-storage-form.html (new - in root)
```

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Verify .env file
3. ✅ Test with the HTML form
4. ✅ Check MongoDB for BlockchainTransaction records
5. ✅ Deploy to production when ready

## Need Help?

- Check blockchain transaction: Copy transaction hash and search on blockchain explorer
- Check database: Query MongoDB for BlockchainTransaction collection
- View logs: Check console output for error messages
