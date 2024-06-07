import { configureStore } from "@reduxjs/toolkit";

import { setupListeners } from "@reduxjs/toolkit/query/react";
import { classesApi } from "./slices/classesSlice";

export const store = configureStore({
    reducer: {
        [classesApi.reducerPath]: classesApi.reducer
    },

    middleware: (getDefaultMiddleware) => {
        return getDefaultMiddleware().concat(classesApi.middleware);
    }
})

setupListeners(store.dispatch)