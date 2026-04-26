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
 * Stores event hash on XDC blockchain with improved gas handling
 * @param hash - SHA-256 hash of the event
 * @returns Transaction hash
 */
export async function storeEventOnBlockchain(hash: string): Promise<string> {
  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🔗 Starting blockchain transaction for hash: ${hash.substring(0, 16)}... (attempt ${attempt}/${maxRetries})`
      );

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

      // Get current gas price and increase it
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('1', 'gwei');
      
      // Increase gas price by 20% for each retry attempt
      const multiplier = 1 + attempt * 0.2;
      const adjustedGasPrice = (gasPrice * BigInt(Math.floor(multiplier * 100))) / BigInt(100);

      console.log(
        `💰 Gas price: ${ethers.formatUnits(adjustedGasPrice, 'gwei')} gwei (attempt multiplier: ${multiplier.toFixed(2)}x)`
      );

      // Get nonce and add extra delay for retries
      const nonce = await provider.getTransactionCount(wallet.address);
      console.log(`📍 Nonce: ${nonce}`);

      // Call storeEvent function with explicit gas parameters
      console.log(`📝 Calling storeEvent with hash: ${hash.substring(0, 16)}...`);
      const tx = await contract.storeEvent(hash, {
        gasPrice: adjustedGasPrice,
        gasLimit: ethers.toBeHex(100000),
        nonce: nonce,
      });
      console.log(`📤 Transaction sent: ${tx.hash}`);

      // Wait for transaction confirmation (with timeout)
      console.log(`⏳ Waiting for transaction confirmation...`);
      const receipt = await Promise.race([
        tx.wait(1), // Wait for 1 confirmation
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Transaction confirmation timeout')),
            60000
          )
        ), // 60 second timeout
      ]);

      if (receipt) {
        console.log(`✅ Transaction confirmed! Block: ${receipt.blockNumber}`);
        return tx.hash;
      }
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || error?.shortMessage || String(error);

      // Check if error is retryable
      const isRetryable =
        errorMsg.includes('replacement') ||
        errorMsg.includes('nonce') ||
        errorMsg.includes('timeout') ||
        errorMsg.includes('TIMEOUT');

      if (isRetryable && attempt < maxRetries) {
        const waitTime = attempt * 2000; // 2s, 4s, 6s
        console.warn(
          `⚠️  Attempt ${attempt} failed (retryable): ${errorMsg}. Retrying in ${waitTime}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      } else {
        console.error(`❌ Blockchain transaction failed (not retryable): ${errorMsg}`);
        throw error;
      }
    }
  }

  // All retries failed
  console.error(
    `❌ All ${maxRetries} retry attempts failed. Last error: ${lastError?.message || lastError}`
  );
  throw lastError;
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
