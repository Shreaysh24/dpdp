const { ethers } = require('ethers');

const PRIVATE_KEY = process.env.PrivateKey;
const CONTRACT_ADDRESS = process.env.contractAddress;

// Minimal ABI for a basic data storage contract
// You'll need to replace this with your actual contract ABI
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

// Initialize provider - adjust RPC URL based on your network
// Common networks:
// Ethereum Mainnet: https://eth-mainnet.g.alchemy.com/v2/
// Ethereum Sepolia: https://eth-sepolia.g.alchemy.com/v2/
// Polygon: https://polygon-rpc.com
// Polygon Mumbai: https://rpc-mumbai.maticvigil.com
const RPC_URL = process.env.RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo';

let provider;
let wallet;
let contract;

const initializeBlockchain = () => {
    try {
        provider = new ethers.JsonRpcProvider(RPC_URL);
        wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
        console.log('Blockchain initialized successfully');
        return { provider, wallet, contract };
    } catch (error) {
        console.error('Error initializing blockchain:', error);
        throw new Error('Blockchain initialization failed');
    }
};

const storeDataOnBlockchain = async (dataHash, permissionId, userUID) => {
    try {
        if (!contract) {
            initializeBlockchain();
        }

        // Validate inputs
        if (!dataHash || !permissionId || !userUID) {
            throw new Error('Missing required parameters: dataHash, permissionId, userUID');
        }

        // Validate string parameters are not empty
        if (typeof permissionId !== 'string' || permissionId.trim() === '') {
            throw new Error('permissionId must be a non-empty string');
        }
        if (typeof userUID !== 'string' || userUID.trim() === '') {
            throw new Error('userUID must be a non-empty string');
        }

        // Convert dataHash to bytes32 format if it's a hex string
        let hashBytes32;
        if (dataHash.startsWith('0x')) {
            hashBytes32 = dataHash.length === 66 ? dataHash : '0x' + dataHash.padEnd(64, '0');
        } else {
            hashBytes32 = '0x' + dataHash.padEnd(64, '0');
        }

        console.log('Storing data on blockchain:', {
            dataHash: hashBytes32,
            permissionId: permissionId.trim(),
            userUID: userUID.trim(),
            contractAddress: CONTRACT_ADDRESS,
            walletAddress: wallet.address
        });

        // Estimate gas first to catch errors early
        let gasEstimate;
        try {
            gasEstimate = await contract.storeData.estimateGas(hashBytes32, permissionId.trim(), userUID.trim());
            console.log('Gas estimate:', gasEstimate.toString());
        } catch (estimateError) {
            console.error('Gas estimation failed:', estimateError.message);
            throw new Error(`Gas estimation failed: ${estimateError.message}. Contract may not be deployed at ${CONTRACT_ADDRESS} or function call is invalid.`);
        }

        // Send transaction
        const tx = await contract.storeData(hashBytes32, permissionId.trim(), userUID.trim());
        console.log('Transaction sent:', tx.hash);

        // Wait for transaction to be mined
        const receipt = await tx.wait();

        if (!receipt) {
            throw new Error('Transaction failed - no receipt returned');
        }

        console.log('Transaction confirmed:', {
            blockNumber: receipt.blockNumber,
            status: receipt.status
        });

        return {
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            from: wallet.address,
            contractAddress: CONTRACT_ADDRESS,
            confirmations: receipt.confirmations || 1,
            status: receipt.status === 1 ? 'CONFIRMED' : 'FAILED'
        };
    } catch (error) {
        console.error('Error storing data on blockchain:', error);
        throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
};

const getTransactionStatus = async (transactionHash) => {
    try {
        if (!provider) {
            initializeBlockchain();
        }

        const receipt = await provider.getTransactionReceipt(transactionHash);

        if (!receipt) {
            return {
                status: 'PENDING',
                transactionHash,
                confirmations: 0
            };
        }

        const currentBlock = await provider.getBlockNumber();
        const confirmations = currentBlock - receipt.blockNumber;

        return {
            status: receipt.status === 1 ? 'CONFIRMED' : 'FAILED',
            transactionHash,
            blockNumber: receipt.blockNumber,
            confirmations,
            gasUsed: receipt.gasUsed.toString(),
            from: receipt.from,
            to: receipt.to
        };
    } catch (error) {
        console.error('Error getting transaction status:', error);
        throw new Error(`Failed to get transaction status: ${error.message}`);
    }
};

const calculateDataHash = (permissionId, userUID, companyId) => {
    // Create a deterministic hash from the data
    const data = `${permissionId}:${userUID}:${companyId}`;
    return ethers.id(data); // This returns a keccak256 hash with 0x prefix
};

const validatePrivateKey = () => {
    try {
        if (!PRIVATE_KEY) {
            throw new Error('PrivateKey environment variable is not set');
        }
        const testWallet = new ethers.Wallet(PRIVATE_KEY);
        console.log('Wallet address:', testWallet.address);
        return true;
    } catch (error) {
        console.error('Invalid private key:', error.message);
        return false;
    }
};

const verifyContractDeployment = async () => {
    try {
        if (!provider) {
            initializeBlockchain();
        }

        console.log('Verifying contract deployment at:', CONTRACT_ADDRESS);

        // Check if contract exists
        const code = await provider.getCode(CONTRACT_ADDRESS);
        if (code === '0x') {
            console.error('ERROR: No contract found at address', CONTRACT_ADDRESS);
            console.error('Contract may not be deployed or address is incorrect');
            return false;
        }

        console.log('✓ Contract found at', CONTRACT_ADDRESS);

        // Check wallet balance
        const balance = await provider.getBalance(wallet.address);
        const balanceInEth = ethers.formatEther(balance);
        console.log(`✓ Wallet ${wallet.address} balance: ${balanceInEth} ETH`);

        if (balance === 0n) {
            console.warn('WARNING: Wallet has 0 balance - transactions will fail');
        }

        return true;
    } catch (error) {
        console.error('Contract verification error:', error);
        return false;
    }
};

module.exports = {
    initializeBlockchain,
    storeDataOnBlockchain,
    getTransactionStatus,
    calculateDataHash,
    validatePrivateKey,
    verifyContractDeployment,
    CONTRACT_ADDRESS,
    PRIVATE_KEY
};
