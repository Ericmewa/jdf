// import { createSlice } from "@reduxjs/toolkit";

// const storedUser = JSON.parse(localStorage.getItem("user")) || null;

// const authSlice = createSlice({
//   name: "auth",
//   initialState: {
//     user: storedUser?.user,
//     token: storedUser?.token || null,
//   },
//   reducers: {
//     setCredentials: (state, { payload }) => {
//       state.user = payload.user;
//       state.token = payload.token;
//       localStorage.setItem("user", JSON.stringify(payload));
//     },
//     logout: (state) => {
//       state.user = null;
//       state.token = null;
//       localStorage.removeItem("user");
//     },
//   },
// });

// export const { setCredentials, logout } = authSlice.actions;
// export default authSlice.reducer;
import { createSlice } from "@reduxjs/toolkit";

const storedAuth = localStorage.getItem("user")
  ? JSON.parse(localStorage.getItem("user"))
  : null;

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: storedAuth?.user || null,
    token: storedAuth?.token || null,
  },
  reducers: {
    setCredentials: (state, { payload }) => {
      state.user = payload.user;
      state.token = payload.token;

      localStorage.setItem(
        "user",
        JSON.stringify({
          user: payload.user,
          token: payload.token,
        })
      );
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("user");
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
