require('dotenv').config();
const { initializeBlockchain, validatePrivateKey, verifyContractDeployment } = require('./blockchain');
const { ethers } = require('ethers');

const runDiagnostics = async () => {
    console.log('\n========== BLOCKCHAIN DIAGNOSTICS ==========\n');

    // 1. Check environment variables
    console.log('1. Environment Variables:');
    console.log(`   - PrivateKey: ${process.env.PrivateKey ? '✓ Set' : '✗ NOT SET'}`);
    console.log(`   - contractAddress: ${process.env.contractAddress || '✗ NOT SET'}`);
    console.log(`   - RPC_URL: ${process.env.RPC_URL || '✗ NOT SET (using default)'}`);
    console.log(`   - MONGODB_URI: ${process.env.MONGODB_URI ? '✓ Set' : '✗ NOT SET'}`);

    // 2. Validate private key
    console.log('\n2. Private Key Validation:');
    const isValidKey = validatePrivateKey();
    if (!isValidKey) {
        console.error('   ✗ FAILED: Invalid private key');
        return false;
    }
    console.log('   ✓ Private key is valid');

    // 3. Verify contract deployment
    console.log('\n3. Contract Deployment Verification:');
    try {
        const isDeployed = await verifyContractDeployment();
        if (!isDeployed) {
            console.error('   ✗ FAILED: Contract not found or not deployed');
            console.log('\n   ACTION REQUIRED:');
            console.log('   - Ensure contract is deployed at:', process.env.contractAddress);
            console.log('   - Verify you are using the correct network (Polygon Amoy)');
            console.log('   - Check RPC_URL is correct:', process.env.RPC_URL);
            return false;
        }
        console.log('   ✓ Contract is deployed and accessible');
    } catch (error) {
        console.error('   ✗ Contract verification failed:', error.message);
        return false;
    }

    // 4. Test RPC connection
    console.log('\n4. RPC Connection Test:');
    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://rpc-amoy.polygon.technology/');
        const blockNumber = await provider.getBlockNumber();
        console.log(`   ✓ RPC connection successful. Current block: ${blockNumber}`);
    } catch (error) {
        console.error('   ✗ RPC connection failed:', error.message);
        return false;
    }

    console.log('\n========== DIAGNOSTICS COMPLETE ==========\n');
    console.log('✓ All checks passed! Blockchain is ready.\n');
    return true;
};

// Run diagnostics if called directly
if (require.main === module) {
    runDiagnostics().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { runDiagnostics };
