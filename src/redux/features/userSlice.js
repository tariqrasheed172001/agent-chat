import { createSlice } from '@reduxjs/toolkit';
import { current } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    userData: null,
    token: null,
  },
  reducers: {
    setUser: (state, action) => {
      console.log("payload: ", action.payload);
      state.userData = action.payload.userData;
      state.token = action.payload.token;
      console.log("Updated state: ", current(state));
    },
    clearUser: (state) => {
      state.userData = null;
      state.token = null;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
