import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";

let userIdFromLocalStorage = localStorage.getItem("userId");
if (!userIdFromLocalStorage || userIdFromLocalStorage === "null") {
  localStorage.setItem("userId", uuidv4());
}
const userNaemFromLocalStorage = localStorage.getItem("userName");

const userSlice = createSlice({
  name: "user",
  initialState: {
    userId: userIdFromLocalStorage,
    name: userNaemFromLocalStorage || "",
  },

  reducers: {
    setUserId(state, action) {
      state.userId = action.payload;
    },
    setUserName(state, action) {
      state.name = action.payload;
      localStorage.setItem("userName", action.payload);
    },
  },
});

export const { setUserId, setUserName } = userSlice.actions;

export const selectUserId = (state) => state.user.userId;
export const selectUserName = (state) => state.user.name;

export default userSlice.reducer;
