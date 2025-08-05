const Points = require('../models/points');
const { success, created, badRequest, notFound, serverError } = require('../utils/response');
const { getCustomerId } = require('./auth');

// GET /prod/points
const getPoints = async (event) => {
  try {
    const customerId = await getCustomerId(event);
    const balance = await Points.getBalance(customerId);
    return success(balance);
  } catch (error) {
    return serverError(error);
  }
};

// POST /prod/points/tx
const createTransaction = async (event) => {
  try {
    const customerId = await getCustomerId(event);
    const { txType, points, description } = JSON.parse(event.body || '{}');
    
    if (!txType || !points) {
      return badRequest('Transaction type and points are required');
    }
    
    const transaction = await Points.createTransaction(
      customerId,
      txType,
      points,
      description || 'Points transaction'
    );
    
    return created(transaction);
  } catch (error) {
    return serverError(error);
  }
};

// GET /prod/points/tx/{tx_id}
const getTransaction = async (event) => {
  try {
    const { tx_id } = event.pathParameters || {};
    
    if (!tx_id) {
      return notFound('Transaction ID is required');
    }
    
    const transaction = await Points.getTransactionById(tx_id);
    
    if (!transaction) {
      return notFound('Transaction with ID ' + tx_id + ' not found');
    }
    
    return success(transaction);
  } catch (error) {
    return serverError(error);
  }
};

// GET /prod/points/tx (no path parameter - get all transactions)
const getTransactions = async (event) => {
  try {
    const customerId = await getCustomerId(event);
    const transactions = await Points.getTransactions(customerId);
    return success(transactions);
  } catch (error) {
    return serverError(error);
  }
};

module.exports = {
  getPoints,
  createTransaction,
  getTransaction,
  getTransactions
};