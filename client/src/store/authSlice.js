import { createSlice } from '@reduxjs/toolkit';

const savedUser = localStorage.getItem('imovies_user')
  ? JSON.parse(localStorage.getItem('imovies_user'))
  : null;

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: savedUser
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload;
      localStorage.setItem('imovies_user', JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      localStorage.removeItem('imovies_user');
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
