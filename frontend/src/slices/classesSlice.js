import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const API_BASE = process.env.REACT_APP_API;

export const classesApi = createApi({
    reducerPath: 'classesApi',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE }),
    endpoints: (builder) => ({
        getClasses: builder.query({
            query: (onlyOngoing) => `/classes${onlyOngoing ? '' : '?all'}`,
        }),
        updateClassOrder: builder.mutation({
            query: (data) => ({
                url: '/classorder',
                method: 'PUT',
                body: data
            }),
        }),
    }),
})

export const { useGetClassesQuery, useUpdateClassOrderMutation } = classesApi