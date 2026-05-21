const { ethers } = require('ethers');
require('dotenv').config();

/**
 * Utility script to test blockchain integration
 * Usage: node blockchain-test-utils.js
 */

// Configuration
const PRIVATE_KEY = process.env.PrivateKey;
const CONTRACT_ADDRESS = process.env.contractAddress;
const RPC_URL = process.env.RPC_URL;

// Minimal contract ABI for testing
const CONTRACT_ABI = [
    {
        "inputs": [
            { "internalType": "bytes32", "name": "dataHash", "type": "bytes32" },
            { "internalType": "string", "name": "permissionId", "type": "string" },
            { "internalType": "string", "name": "userUID", "type": "string" }
        ],
        "name": "storeData",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

class BlockchainTestUtils {
    constructor() {
        this.provider = null;
        this.wallet = null;
        this.contract = null;
    }

    /**
     * Initialize blockchain connection
     */
    async init() {
        try {
            console.log('🔧 Initializing blockchain connection...');

            this.provider = new ethers.JsonRpcProvider(RPC_URL);
            this.wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
            this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.wallet);

            console.log('✅ Blockchain initialized');
            console.log('   Wallet address:', this.wallet.address);
            console.log('   Contract address:', CONTRACT_ADDRESS);

            return true;
        } catch (error) {
            console.error('❌ Failed to initialize blockchain:', error.message);
            return false;
        }
    }

    /**
     * Check wallet balance
     */
    async checkBalance() {
        try {
            console.log('\n💰 Checking wallet balance...');

            const balance = await this.provider.getBalance(this.wallet.address);
            const balanceEth = ethers.formatEther(balance);

            console.log(`✅ Balance: ${balanceEth} ETH`);

            if (parseFloat(balanceEth) < 0.01) {
                console.warn('⚠️  Warning: Low balance for gas fees');
            }

            return balanceEth;
        } catch (error) {
            console.error('❌ Failed to check balance:', error.message);
        }
    }

    /**
     * Get network information
     */
    async getNetworkInfo() {
        try {
            console.log('\n🌐 Getting network information...');

            const network = await this.provider.getNetwork();
            const blockNumber = await this.provider.getBlockNumber();
            const gasPrice = await this.provider.getGasPrice();

            console.log('✅ Network Info:');
            console.log('   Name:', network.name);
            console.log('   Chain ID:', network.chainId);
            console.log('   Current Block:', blockNumber);
            console.log('   Gas Price:', ethers.formatUnits(gasPrice, 'gwei'), 'Gwei');

            return { network, blockNumber, gasPrice };
        } catch (error) {
            console.error('❌ Failed to get network info:', error.message);
        }
    }

    /**
     * Estimate gas for storeData transaction
     */
    async estimateGas(dataHash, permissionId, userUID) {
        try {
            console.log('\n⛽ Estimating gas...');

            let hashBytes32 = dataHash;
            if (!dataHash.startsWith('0x')) {
                hashBytes32 = '0x' + dataHash.padEnd(64, '0');
            } else if (dataHash.length !== 66) {
                hashBytes32 = '0x' + dataHash.slice(2).padEnd(64, '0');
            }

            const gasEstimate = await this.contract.storeData.estimateGas(
                hashBytes32,
                permissionId,
                userUID
            );

            console.log('✅ Estimated gas:', gasEstimate.toString());

            return gasEstimate;
        } catch (error) {
            console.error('❌ Failed to estimate gas:', error.message);
        }
    }

    /**
     * Send test transaction
     */
    async sendTestTransaction(dataHash, permissionId, userUID) {
        try {
            console.log('\n📤 Sending test transaction...');

            let hashBytes32 = dataHash;
            if (!dataHash.startsWith('0x')) {
                hashBytes32 = '0x' + dataHash.padEnd(64, '0');
            } else if (dataHash.length !== 66) {
                hashBytes32 = '0x' + dataHash.slice(2).padEnd(64, '0');
            }

            console.log('   Data Hash:', hashBytes32);
            console.log('   Permission ID:', permissionId);
            console.log('   User UID:', userUID);

            const tx = await this.contract.storeData(
                hashBytes32,
                permissionId,
                userUID
            );

            console.log('✅ Transaction sent:', tx.hash);
            console.log('   Waiting for confirmation...');

            const receipt = await tx.wait();

            console.log('✅ Transaction confirmed!');
            console.log('   Block Number:', receipt.blockNumber);
            console.log('   Gas Used:', receipt.gasUsed.toString());
            console.log('   Status:', receipt.status === 1 ? 'Success' : 'Failed');

            return {
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                status: receipt.status === 1 ? 'CONFIRMED' : 'FAILED'
            };
        } catch (error) {
            console.error('❌ Failed to send transaction:', error.message);
        }
    }

    /**
     * Check transaction status
     */
    async checkTransactionStatus(transactionHash) {
        try {
            console.log('\n🔍 Checking transaction status...');
            console.log('   Hash:', transactionHash);

            const receipt = await this.provider.getTransactionReceipt(transactionHash);

            if (!receipt) {
                console.log('⏳ Transaction still pending');
                return { status: 'PENDING' };
            }

            const currentBlock = await this.provider.getBlockNumber();
            const confirmations = currentBlock - receipt.blockNumber;

            console.log('✅ Transaction Details:');
            console.log('   Block Number:', receipt.blockNumber);
            console.log('   Confirmations:', confirmations);
            console.log('   Gas Used:', receipt.gasUsed.toString());
            console.log('   Status:', receipt.status === 1 ? 'Success' : 'Failed');

            return {
                status: receipt.status === 1 ? 'CONFIRMED' : 'FAILED',
                blockNumber: receipt.blockNumber,
                confirmations,
                gasUsed: receipt.gasUsed.toString()
            };
        } catch (error) {
            console.error('❌ Failed to check transaction:', error.message);
        }
    }

    /**
     * Run full diagnostic
     */
    async runDiagnostic() {
        console.log('🚀 Running blockchain diagnostic...\n');

        if (!await this.init()) {
            return;
        }

        await this.checkBalance();
        await this.getNetworkInfo();

        console.log('\n✅ Diagnostic complete!');
    }

    /**
     * Generate test data
     */
    static generateTestData() {
        return {
            dataHash: ethers.id('test-data-' + Date.now()),
            permissionId: 'perm-' + Date.now(),
            userUID: 'user-' + Math.random().toString(36).substr(2, 9)
        };
    }
}

/**
 * Main test function
 */
async function main() {
    const utils = new BlockchainTestUtils();

    // Run diagnostic
    await utils.runDiagnostic();

    // Optional: Send test transaction (uncomment to test)
    // const testData = BlockchainTestUtils.generateTestData();
    // await utils.sendTestTransaction(testData.dataHash, testData.permissionId, testData.userUID);
}

// Export for use as module
module.exports = {
    BlockchainTestUtils,
    generateTestData: BlockchainTestUtils.generateTestData
};

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
