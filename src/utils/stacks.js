import { 
  AppConfig, 
  UserSession, 
  showConnect 
} from '@stacks/connect';
import {
  callReadOnlyFunction,
  cvToValue,
  standardPrincipalCV,
  stringUtf8CV,
  uintCV,
  makeContractCall,
  broadcastTransaction,
  AnchorMode
} from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { getCurrentNetwork, APP_CONFIG } from '@/config';

// Get network configuration
const networkConfig = getCurrentNetwork();

// Constants
export const CONTRACT_ADDRESS = networkConfig.contractAddress;
export const CONTRACT_NAME = networkConfig.contractName;
export const NETWORK = APP_CONFIG.network === 'mainnet' 
  ? new StacksMainnet({ url: networkConfig.apiUrl }) 
  : new StacksTestnet({ url: networkConfig.apiUrl });

// Initialize Stacks Auth
export const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

/**
 * Connect to Stacks wallet
 * @param {Function} onFinish - Callback function to execute after successful connection
 * @returns {Promise<void>}
 */
export const connectWallet = (onFinish) => {
  return showConnect({
    appDetails: {
      name: 'Stacks Guestbook',
      icon: window.location.origin + '/favicon.ico',
    },
    redirectTo: '/',
    onFinish,
    userSession,
  });
};

/**
 * Get user data from session
 * @returns {Object|null} User data or null if not authenticated
 */
export const getUserData = () => {
  if (userSession.isUserSignedIn()) {
    return userSession.loadUserData();
  }
  return null;
};

/**
 * Sign out user
 */
export const signUserOut = () => {
  userSession.signUserOut();
};

/**
 * Get all messages from the contract
 * @returns {Promise<Array>} Array of messages
 */
export const getMessages = async () => {
  try {
    const lastIdResponse = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-last-message-id',
      functionArgs: [],
      network: NETWORK,
      senderAddress: CONTRACT_ADDRESS,
    });

    const lastId = cvToValue(lastIdResponse);
    
    if (lastId === 0) {
      return [];
    }

    const messages = [];
    
    // Fetch all messages by ID
    for (let i = 1; i <= lastId; i++) {
      const messageResponse = await callReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'get-message',
        functionArgs: [uintCV(i)],
        network: NETWORK,
        senderAddress: CONTRACT_ADDRESS,
      });
      
      const messageData = cvToValue(messageResponse);
      
      if (messageData) {
        messages.push({
          id: i,
          author: messageData.author,
          content: messageData.content,
          timestamp: messageData.timestamp,
          likes: messageData.likes
        });
      }
    }
    
    // Sort messages by timestamp (newest first)
    return messages.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

/**
 * Check if a user has liked a message
 * @param {string} userAddress - User's Stacks address
 * @param {number} messageId - Message ID
 * @returns {Promise<boolean>} Whether the user has liked the message
 */
export const hasUserLikedMessage = async (userAddress, messageId) => {
  try {
    const response = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'has-user-liked',
      functionArgs: [
        standardPrincipalCV(userAddress),
        uintCV(messageId)
      ],
      network: NETWORK,
      senderAddress: userAddress,
    });
    
    const result = cvToValue(response);
    return result.liked;
  } catch (error) {
    console.error('Error checking if user liked message:', error);
    return false;
  }
};

/**
 * Post a new message to the contract
 * @param {string} content - Message content
 * @returns {Promise<Object>} Transaction result
 */
export const postMessage = async (content) => {
  if (!userSession.isUserSignedIn()) {
    throw new Error('User not authenticated');
  }
  
  const userData = userSession.loadUserData();
  
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'post-message',
    functionArgs: [stringUtf8CV(content)],
    senderKey: userData.appPrivateKey,
    validateWithAbi: true,
    network: NETWORK,
    anchorMode: AnchorMode.Any,
  };
  
  try {
    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, NETWORK);
    return broadcastResponse;
  } catch (error) {
    console.error('Error posting message:', error);
    throw error;
  }
};

/**
 * Like a message
 * @param {number} messageId - Message ID to like
 * @returns {Promise<Object>} Transaction result
 */
export const likeMessage = async (messageId) => {
  if (!userSession.isUserSignedIn()) {
    throw new Error('User not authenticated');
  }
  
  const userData = userSession.loadUserData();
  
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'like-message',
    functionArgs: [uintCV(messageId)],
    senderKey: userData.appPrivateKey,
    validateWithAbi: true,
    network: NETWORK,
    anchorMode: AnchorMode.Any,
  };
  
  try {
    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, NETWORK);
    return broadcastResponse;
  } catch (error) {
    console.error('Error liking message:', error);
    throw error;
  }
};

/**
 * Send a tip to a message author
 * @param {string} recipient - Recipient's Stacks address
 * @param {number} amount - Tip amount in micro-STX
 * @param {number} messageId - Message ID being tipped
 * @returns {Promise<Object>} Transaction result
 */
export const sendTip = async (recipient, amount, messageId) => {
  if (!userSession.isUserSignedIn()) {
    throw new Error('User not authenticated');
  }
  
  const userData = userSession.loadUserData();
  
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'tipping',
    functionName: 'send-tip',
    functionArgs: [
      standardPrincipalCV(recipient),
      uintCV(amount),
      uintCV(messageId)
    ],
    senderKey: userData.appPrivateKey,
    validateWithAbi: true,
    network: NETWORK,
    anchorMode: AnchorMode.Any,
  };
  
  try {
    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, NETWORK);
    return broadcastResponse;
  } catch (error) {
    console.error('Error sending tip:', error);
    throw error;
  }
};

/**
 * Get tips for a specific message
 * @param {number} messageId - Message ID
 * @returns {Promise<Array>} Array of tips
 */
export const getMessageTips = async (messageId) => {
  try {
    const response = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: 'tipping',
      functionName: 'get-message-tips',
      functionArgs: [uintCV(messageId)],
      network: NETWORK,
      senderAddress: CONTRACT_ADDRESS,
    });
    
    const tips = cvToValue(response);
    return tips || [];
  } catch (error) {
    console.error('Error fetching message tips:', error);
    return [];
  }
};

/**
 * Get total tips received by a user
 * @param {string} userAddress - User's Stacks address
 * @returns {Promise<number>} Total tips received
 */
export const getUserTipsReceived = async (userAddress) => {
  try {
    const response = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: 'tipping',
      functionName: 'get-user-tips-received',
      functionArgs: [standardPrincipalCV(userAddress)],
      network: NETWORK,
      senderAddress: userAddress,
    });
    
    const result = cvToValue(response);
    return result.totalAmount || 0;
  } catch (error) {
    console.error('Error fetching user tips received:', error);
    return 0;
  }
};

/**
 * Get total tips sent by a user
 * @param {string} userAddress - User's Stacks address
 * @returns {Promise<number>} Total tips sent
 */
export const getUserTipsSent = async (userAddress) => {
  try {
    const response = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: 'tipping',
      functionName: 'get-user-tips-sent',
      functionArgs: [standardPrincipalCV(userAddress)],
      network: NETWORK,
      senderAddress: userAddress,
    });
    
    const result = cvToValue(response);
    return result.totalAmount || 0;
  } catch (error) {
    console.error('Error fetching user tips sent:', error);
    return 0;
  }
};