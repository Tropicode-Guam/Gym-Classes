import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const API_BASE = process.env.REACT_APP_API;

export const classesApi = createApi({
    reducerPath: 'classesApi',
    baseQuery: fetchBaseQuery({ baseUrl: API_BASE }),
    endpoints: (builder) => ({
        getClasses: builder.query({
            query: (onlyOngiong) => `/classes${onlyOngiong ? '' : '?all'}`,
        })
    }),
})

export const { useGetClassesQuery } = classesApi