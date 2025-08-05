import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoggedIn: localStorage.getItem('email') !== null && 
              localStorage.getItem('email') !== undefined && 
              localStorage.getItem('email') !== '',
  modalOpen: false,
  email: localStorage.getItem('email') || '',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    updateModal: (state, action) => {
      state.modalOpen = action.payload;
    },
    doLogin: (state, action) => {
      state.email = action.payload.email;
      state.isLoggedIn = true;
      state.modalOpen = false;
      localStorage.setItem('email', action.payload.email);
    },
    doLogout: (state) => {
      state.email = '';
      state.isLoggedIn = false;
      localStorage.removeItem('email');
    },
  },
});

export const { updateModal, doLogin, doLogout } = authSlice.actions;
export default authSlice.reducer;