const Cart = require('../models/cart');
const { success, created, noContent, badRequest, serverError } = require('../utils/response');
const { getCustomerId } = require('./auth');

// GET /prod/cart
const getCart = async (event) => {
  try {
    const customerId = await getCustomerId(event);
    const cartItems = await Cart.getCart(customerId);
    return success(cartItems);
  } catch (error) {
    return serverError(error);
  }
};

// POST /prod/cart/item
const addItemToCart = async (event) => {
  try {
    const customerId = await getCustomerId(event);
    const { id, quantity = 1 } = JSON.parse(event.body || '{}');
    
    if (!id) {
      return badRequest('Item ID is required');
    }
    
    const result = await Cart.addItem(customerId, id, quantity);
    return created(result);
  } catch (error) {
    return serverError(error);
  }
};

// DELETE /prod/cart/item/{item_id}
const removeItemFromCart = async (event) => {
  try {
    const customerId = await getCustomerId(event);
    const { item_id } = event.pathParameters || {};
    
    if (!item_id) {
      return badRequest('Item ID is required');
    }
    
    await Cart.removeItem(customerId, item_id);
    return noContent();
  } catch (error) {
    return serverError(error);
  }
};

// DELETE /prod/cart/item (remove all items)
const clearCart = async (event) => {
  try {
    const customerId = await getCustomerId(event);
    await Cart.clearCart(customerId);
    return noContent();
  } catch (error) {
    return serverError(error);
  }
};

// DELETE /prod/cart (alias for clearCart)
const deleteCart = async (event) => {
  return clearCart(event);
};

// POST /prod/cart/checkout
const checkout = async (event) => {
  try {
    const customerId = await getCustomerId(event);
    const result = await Cart.checkout(customerId);
    return success(result);
  } catch (error) {
    return serverError(error);
  }
};

module.exports = {
  getCart,
  addItemToCart,
  removeItemFromCart,
  clearCart,
  deleteCart,
  checkout
};