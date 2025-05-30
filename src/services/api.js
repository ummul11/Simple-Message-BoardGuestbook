import axios from 'axios';
import { getCurrentNetwork } from '@/config';

// Create axios instance with base URL from config
const apiClient = axios.create({
  baseURL: getCurrentNetwork().apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Get transaction status
 * @param {string} txId - Transaction ID
 * @returns {Promise<Object>} Transaction status
 */
export const getTransactionStatus = async (txId) => {
  try {
    const response = await apiClient.get(`/extended/v1/tx/${txId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction status:', error);
    throw error;
  }
};

/**
 * Get account info
 * @param {string} address - Stacks address
 * @returns {Promise<Object>} Account info
 */
export const getAccountInfo = async (address) => {
  try {
    const response = await apiClient.get(`/v2/accounts/${address}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching account info:', error);
    throw error;
  }
};

/**
 * Get account transactions
 * @param {string} address - Stacks address
 * @param {number} limit - Number of transactions to return
 * @returns {Promise<Array>} Transactions
 */
export const getAccountTransactions = async (address, limit = 20) => {
  try {
    const response = await apiClient.get(`/extended/v1/address/${address}/transactions`, {
      params: {
        limit,
        offset: 0
      }
    });
    return response.data.results;
  } catch (error) {
    console.error('Error fetching account transactions:', error);
    throw error;
  }
};

/**
 * Get contract events
 * @param {string} contractAddress - Contract address
 * @param {string} contractName - Contract name
 * @param {number} limit - Number of events to return
 * @returns {Promise<Array>} Contract events
 */
export const getContractEvents = async (contractAddress, contractName, limit = 50) => {
  try {
    const response = await apiClient.get(`/extended/v1/contract/${contractAddress}.${contractName}/events`, {
      params: {
        limit,
        offset: 0
      }
    });
    return response.data.results;
  } catch (error) {
    console.error('Error fetching contract events:', error);
    throw error;
  }
};

export default {
  getTransactionStatus,
  getAccountInfo,
  getAccountTransactions,
  getContractEvents
};