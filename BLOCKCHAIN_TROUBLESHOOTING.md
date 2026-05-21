# 🔧 Blockchain Error Troubleshooting Guide

## Issue
```
Error: execution reverted (no data present; likely require(false) occurred)
```

## Root Cause Analysis

This error occurs when the smart contract rejects the transaction. The "require(false)" error indicates the contract has a validation check that's failing.

## Diagnosis Steps

### Step 1: Run Diagnostics
```bash
cd backend
node lib/blockchain-diagnostics.js
```

This will check:
- ✓ Environment variables are set
- ✓ Private key is valid
- ✓ Contract is deployed at the specified address
- ✓ RPC connection works
- ✓ Wallet has sufficient balance

### Step 2: Common Issues & Solutions

#### Issue A: Contract Not Deployed
**Symptom**: Error says "No contract found at address"

**Solution**:
1. Verify contract address in `.env`:
   ```bash
   contractAddress=0x78471F2935388c3A246CCbEE723bda1350EfD158
   ```
2. Deploy the contract to Polygon Amoy testnet
3. Update `.env` with correct contract address

#### Issue B: Insufficient Wallet Balance
**Symptom**: Gas estimation fails with "execution reverted"

**Solution**:
1. Check wallet balance:
   ```bash
   # The wallet address is shown in diagnostics output
   # Get MATIC from Polygon Amoy testnet faucet:
   # https://faucet.polygon.technology/
   ```
2. Ensure wallet has at least 0.1 MATIC for gas

#### Issue C: Smart Contract Validation
**Symptom**: Gas estimation passes but transaction reverts

**Solution**:
The smart contract may have access control or validation:

1. **Check contract ABI** - Ensure it matches actual contract:
   ```javascript
   // Current ABI expects:
   function storeData(bytes32 dataHash, string permissionId, string userUID)
   ```

2. **Check access control** - Contract might require:
   - Wallet to be whitelisted
   - Specific role permission
   - Contract owner verification

3. **Verify contract source** - Get the actual contract from Polygon Amoy explorer:
   - Go to: https://amoy.polygonscan.com/
   - Search for your contract address
   - Verify the function signature matches

#### Issue D: Wrong Network
**Symptom**: Contract address looks valid but not found

**Solution**:
Ensure `.env` specifies Polygon Amoy:
```env
RPC_URL=https://rpc-amoy.polygon.technology/
```

## Quick Checklist

- [ ] Run `node lib/blockchain-diagnostics.js` successfully
- [ ] Contract address is correct (verify on Amoy Polygonscan)
- [ ] Wallet has MATIC balance > 0.1
- [ ] Private key matches wallet address that has funds
- [ ] RPC_URL points to Polygon Amoy
- [ ] Contract ABI matches actual contract functions

## Next Steps

1. Run diagnostics to identify the specific issue
2. Check blockchain-diagnostics.js output
3. Address the specific issue based on the output
4. Re-run diagnostics to verify the fix
5. Try the API call again

## Testing After Fix

```bash
# Run example
cd dpdp-sdk
npm run build
node example.js
```

## Contact Smart Contract Developer

If contract access/validation is the issue, contact the contract developer with:
- Wallet address (from diagnostics output)
- Error message: `execution reverted`
- Current contract address
- RPC_URL being used

