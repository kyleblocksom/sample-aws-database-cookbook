import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  allProducts: [],
  categories: [],
  featuredProducts: [],
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts: (state, action) => {
      // Ensure products is always an array
      state.allProducts = Array.isArray(action.payload) ? action.payload : [];
    },
    setCategories: (state, action) => {
      // Ensure categories is always an array
      state.categories = Array.isArray(action.payload) ? action.payload : [];
    },
    setFeaturedProducts: (state, action) => {
      // Ensure featured products is always an array
      state.featuredProducts = Array.isArray(action.payload) ? action.payload : [];
    },
  },
});

export const { setProducts, setCategories, setFeaturedProducts } = productSlice.actions;
export default productSlice.reducer;