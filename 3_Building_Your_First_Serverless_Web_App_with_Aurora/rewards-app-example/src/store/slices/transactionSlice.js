import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  transactions: [],
  currentTransaction: null,
  loading: false,
  error: null,
};

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setTransactions: (state, action) => {
      state.transactions = action.payload;
    },
    setCurrentTransaction: (state, action) => {
      state.currentTransaction = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { 
  setTransactions, 
  setCurrentTransaction, 
  setLoading, 
  setError 
} = transactionSlice.actions;

export default transactionSlice.reducer;