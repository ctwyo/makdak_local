import { configureStore } from "@reduxjs/toolkit";
import ordersReducer from "../slices/ordersSlice";
import userReducer from "../slices/userSlice";
import themeReducer from "../slices/themeSlice";
import databaseReducer from "../slices/databaseSlice";

const store = configureStore({
  reducer: {
    ordersStore: ordersReducer,
    user: userReducer,
    theme: themeReducer,
    database: databaseReducer,
  },
});

export default store;
