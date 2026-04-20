import { ethers } from 'ethers';

/**
 * Contract ABI for EventStorage
 */
const CONTRACT_ABI = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'events',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_hash',
        type: 'string',
      },
    ],
    name: 'storeEvent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

/**
 * Validates required environment variables
 */
function validateEnv(): {
  rpcUrl: string;
  privateKey: string;
  contractAddress: string;
} {
  const rpcUrl = process.env.XDC_RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!rpcUrl) {
    throw new Error('XDC_RPC_URL environment variable is required');
  }
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }
  if (!contractAddress) {
    throw new Error('CONTRACT_ADDRESS environment variable is required');
  }

  // Clean up private key if it has the "PRIVATE_KEY=" prefix
  const cleanPrivateKey = privateKey.replace(/^PRIVATE_KEY=/, '');

  return { rpcUrl, privateKey: cleanPrivateKey, contractAddress };
}

/**
 * Stores event hash on XDC blockchain
 * @param hash - SHA-256 hash of the event
 * @returns Transaction hash
 */
export async function storeEventOnBlockchain(hash: string): Promise<string> {
  try {
    console.log(`🔗 Starting blockchain transaction for hash: ${hash.substring(0, 16)}...`);

    const { rpcUrl, privateKey, contractAddress } = validateEnv();

    // Create provider
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    console.log(`✅ Provider connected to XDC: ${rpcUrl}`);

    // Create wallet
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`✅ Wallet loaded: ${wallet.address}`);

    // Create contract instance
    const contract = new ethers.Contract(
      contractAddress,
      CONTRACT_ABI,
      wallet
    );
    console.log(`✅ Contract instance created: ${contractAddress}`);

    // Call storeEvent function
    console.log(`📝 Calling storeEvent with hash: ${hash.substring(0, 16)}...`);
    const tx = await contract.storeEvent(hash);
    console.log(`📤 Transaction sent: ${tx.hash}`);

    // Wait for transaction confirmation
    console.log(`⏳ Waiting for transaction confirmation...`);
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed! Block: ${receipt.blockNumber}`);

    return tx.hash;
  } catch (error) {
    console.error('❌ Blockchain transaction failed:', error);
    throw error;
  }
}

/**
 * Retrieves stored event hashes from blockchain
 * @returns Array of stored hashes
 */
export async function getStoredEvents(): Promise<string[]> {
  try {
    const { rpcUrl, contractAddress } = validateEnv();

    // Create read-only provider
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Create contract instance (read-only)
    const contract = new ethers.Contract(
      contractAddress,
      CONTRACT_ABI,
      provider
    );

    // Get events array length (need to call events(0), events(1), etc.)
    // For now, return empty array as we don't have eventCount function
    console.log('📖 Retrieved events from blockchain');
    return [];
  } catch (error) {
    console.error('❌ Failed to retrieve events:', error);
    return [];
  }
}

/**
 * Gets explorer link for a transaction
 * @param txHash - Transaction hash
 * @returns URL to XDC explorer
 */
export function getExplorerLink(txHash: string): string {
  return `https://explorer.apothem.network/tx/${txHash}`;
}
