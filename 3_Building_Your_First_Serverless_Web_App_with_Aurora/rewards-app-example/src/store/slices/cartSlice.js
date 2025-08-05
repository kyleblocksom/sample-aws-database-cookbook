import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  cartOpen: false,
  cartItems: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { cartItems } = state;
      const existingItemIndex = cartItems.findIndex(item => item.id === action.payload.id);
      
      if (existingItemIndex === -1) {
        // Item doesn't exist in cart, add it
        const newItem = { ...action.payload, quantity: 1 };
        state.cartItems.push(newItem);
      } else {
        // Item exists, increase quantity
        state.cartItems = cartItems.map(item => 
          item.id === action.payload.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
    },
    removeFromCart: (state, action) => {
      state.cartItems = state.cartItems.filter(item => item.id !== action.payload);
    },
    reduceFromCart: (state, action) => {
      const { cartItems } = state;
      const existingItem = cartItems.find(item => item.id === action.payload);
      
      if (existingItem && existingItem.quantity > 1) {
        // Reduce quantity if more than 1
        state.cartItems = cartItems.map(item => 
          item.id === action.payload 
            ? { ...item, quantity: item.quantity - 1 } 
            : item
        );
      } else {
        // Remove item if quantity is 1
        state.cartItems = cartItems.filter(item => item.id !== action.payload);
      }
    },
    setCartState: (state, action) => {
      state.cartOpen = action.payload;
    },
    setCartItems: (state, action) => {
      state.cartItems = action.payload;
    },
    emptyCart: (state) => {
      state.cartItems = [];
    },
  },
});

export const { 
  addToCart, 
  removeFromCart, 
  reduceFromCart, 
  setCartState, 
  setCartItems, 
  emptyCart 
} = cartSlice.actions;

export default cartSlice.reducer;