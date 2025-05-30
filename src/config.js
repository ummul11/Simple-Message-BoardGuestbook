/**
 * Application configuration
 */

// Network configuration
export const NETWORK_CONFIG = {
  // Use testnet for development
  testnet: {
    // Contract details
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Replace with your actual contract address
    contractName: 'guestbook',
    
    // Explorer URLs
    explorerUrl: 'https://explorer.stacks.co/sandbox/txid/',
    addressUrl: 'https://explorer.stacks.co/sandbox/address/',
    
    // API endpoints
    apiUrl: 'https://stacks-node-api.testnet.stacks.co',
  },
  
  // Mainnet configuration (for future use)
  mainnet: {
    // Contract details
    contractAddress: '', // To be filled when deploying to mainnet
    contractName: 'guestbook',
    
    // Explorer URLs
    explorerUrl: 'https://explorer.stacks.co/txid/',
    addressUrl: 'https://explorer.stacks.co/address/',
    
    // API endpoints
    apiUrl: 'https://stacks-node-api.stacks.co',
  }
};

// App configuration
export const APP_CONFIG = {
  name: 'Stacks Guestbook',
  description: 'A decentralized message board built on Stacks blockchain',
  
  // Default network
  network: 'testnet',
  
  // Message configuration
  messageMaxLength: 280,
  
  // UI configuration
  refreshInterval: 60000, // Auto-refresh messages every 60 seconds
};

// Get current network configuration
export const getCurrentNetwork = () => {
  return NETWORK_CONFIG[APP_CONFIG.network];
};