import { configureStore } from "@reduxjs/toolkit";
import ordersReducer from "../slices/ordersSlice";
import userReducer from "../slices/userSlice";
import themeReducer from "../slices/themeSlice";
import databaseReducer from "../slices/databaseSlice";
import statsReducer from "../slices/statsSlice";

const store = configureStore({
  reducer: {
    ordersStore: ordersReducer,
    user: userReducer,
    theme: themeReducer,
    database: databaseReducer,
    stats: statsReducer,
  },
});

export default store;
