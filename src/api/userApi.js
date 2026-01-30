

// // src/api/userApi.js
// import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// const baseQuery = fetchBaseQuery({
//   baseUrl: import.meta.env.VITE_API_URL + "/api",
//   prepareHeaders: (headers, { getState }) => {
//     const token = getState().auth.token;
//     if (token) headers.set("authorization", `Bearer ${token}`);
//     return headers;
//   },
// });

// export const userApi = createApi({
//   reducerPath: "userApi",
//   baseQuery,
//   tagTypes: ["User", "Audit", "OnlineUsers"],
//   endpoints: (builder) => ({
//     // User Management Endpoints
//     getUsers: builder.query({
//       query: () => "/users",
//       providesTags: ["User"],
//     }),

//     createUser: builder.mutation({
//       query: (data) => ({
//         url: "/users",
//         method: "POST",
//         body: data,
//       }),
//       invalidatesTags: ["User"],
//     }),

//     toggleActive: builder.mutation({
//       query: (id) => ({
//         url: `/users/${id}/active`,
//         method: "PUT",
//       }),
//       invalidatesTags: ["User"],
//     }),

//     getApprovers: builder.query({
//       query: () => `/users/?role=approver`,
//       providesTags: ["User"],
//     }),

//     getCustomers: builder.query({
//       query: () => "/users",
//       transformResponse: (res) => res.filter((u) => u.role === "customer"),
//       providesTags: ["User"],
//     }),

//     changeRole: builder.mutation({
//       query: ({ id, role }) => ({
//         url: `/users/${id}/role`,
//         method: "PUT",
//         body: { role },
//       }),
//       invalidatesTags: ["User"],
//     }),

//     // Get users with status endpoint
//     getUsersStatus: builder.query({
//       query: () => "/users/status",
//       providesTags: ["User"],
//       transformResponse: (response) => {
//         console.log("🔍 Raw API response from /status:", response);

//         // Handle different response structures
//         if (!response) {
//           console.warn("⚠️ API returned empty response");
//           return { users: [], onlineCount: 0 };
//         }

//         // If response has success property
//         if (response.success) {
//           const users = response.users || response.data || [];
//           // Check multiple possible online indicators
//           const onlineUsers = users.filter(
//             (u) =>
//               u.isOnline === true ||
//               u.status === "online" ||
//               u.online === true ||
//               u.is_online === true,
//           );
//           return {
//             users: users,
//             onlineCount: response.onlineCount || onlineUsers.length,
//           };
//         }

//         // If response is already an array
//         if (Array.isArray(response)) {
//           const onlineUsers = response.filter(
//             (u) =>
//               u.isOnline === true ||
//               u.status === "online" ||
//               u.online === true ||
//               u.is_online === true,
//           );
//           return {
//             users: response,
//             onlineCount: onlineUsers.length,
//           };
//         }

//         // If response is an object with users property
//         if (response.users && Array.isArray(response.users)) {
//           const onlineUsers = response.users.filter(
//             (u) =>
//               u.isOnline === true ||
//               u.status === "online" ||
//               u.online === true ||
//               u.is_online === true,
//           );
//           return {
//             users: response.users,
//             onlineCount: response.onlineCount || onlineUsers.length,
//           };
//         }

//         // Default case
//         console.warn("⚠️ Unexpected API response structure:", response);
//         return {
//           users: [],
//           onlineCount: 0,
//         };
//       },
//     }),

//     // ============================================
//     // AUDIT TRAIL ENDPOINTS
//     // ============================================

//     // Get user-specific audit logs
//     getUserAuditLogs: builder.query({
//       query: ({ userId, startDate, endDate }) => {
//         let url = `/audit/user/${userId}`;
//         const params = new URLSearchParams();
//         if (startDate) params.append("startDate", startDate);
//         if (endDate) params.append("endDate", endDate);
//         const queryString = params.toString();
//         return queryString ? `${url}?${queryString}` : url;
//       },
//       providesTags: ["Audit"],
//     }),

//     // Get audit statistics
//     getAuditLogStats: builder.query({
//       query: () => "/audit/stats",
//       providesTags: ["Audit"],
//     }),

//     // Get all audit logs (with filters)
//     // getAuditLogs: builder.query({
//     //   query: (params = {}) => {
//     //     const {
//     //       userId,
//     //       startDate,
//     //       endDate,
//     //       action,
//     //       resource,
//     //       status,
//     //       search,
//     //       page = 1,
//     //       limit = 20,
//     //     } = params;

//     //     const queryParams = new URLSearchParams();
//     //     if (userId) queryParams.append("userId", userId);
//     //     if (startDate) queryParams.append("startDate", startDate);
//     //     if (endDate) queryParams.append("endDate", endDate);
//     //     if (action) queryParams.append("action", action);
//     //     if (resource) queryParams.append("resource", resource);
//     //     if (status) queryParams.append("status", status);
//     //     if (search) queryParams.append("search", search);
//     //     queryParams.append("page", page);
//     //     queryParams.append("limit", limit);

//     //     return `/audit?${queryParams.toString()}`;
//     //   },
//     //   providesTags: ["Audit"],
//     // }),
//     getAuditLogs: builder.query({
//       query: ({
//         page = 1,
//         limit = 20,
//         action = null,
//         userId = null,
//         resource = null,
//         status = null,
//         startDate = null,
//         endDate = null,
//         search = null,
//       }) => ({
//         url: "/audit/logs", // ✅ MATCHES BACKEND
//         method: "GET",
//         params: {
//           page,
//           limit,
//           action,
//           userId,
//           resource,
//           status,
//           startDate,
//           endDate,
//           search,
//         },
//       }),
//       providesTags: ["AuditLogs"],
//     }),
//     // Export audit logs
//     exportAuditLogs: builder.mutation({
//       query: (params) => ({
//         url: "/audit/export",
//         method: "POST",
//         body: params,
//         responseHandler: (response) => response.blob(),
//       }),
//     }),

//     // getOnlineUsers: builder.query({
//     //   query: () => ({
//     //     url: "/socket/online-users",
//     //     method: "GET",
//     //   }),

//     // optional but useful
//     //   providesTags: ["OnlineUsers"],
//     // }),

//     // getonline users

//     getOnlineUsers: builder.query({
//       query: () => "/socket/online-users",

//       // 🔥 VERY IMPORTANT
//       transformResponse: (response) => {
//         console.log("🧪 Online users API raw response:", response);

//         return {
//           users: response?.users || [],
//           count: response?.count || 0,
//         };
//       },

//       providesTags: ["OnlineUsers"],
//     }),

//     // Create audit log (for manual logging if needed)
//     createAuditLog: builder.mutation({
//       query: (data) => ({
//         url: "/audit",
//         method: "POST",
//         body: data,
//       }),
//       invalidatesTags: ["Audit"],
//     }),
//   }),
// });

// export const {
//   // User endpoints
//   useGetUsersQuery,
//   useCreateUserMutation,
//   useToggleActiveMutation,
//   useChangeRoleMutation,
//   useGetCustomersQuery,
//   useGetApproversQuery,
//   useGetUsersStatusQuery,

//   // Audit endpoints
//   useGetUserAuditLogsQuery,
//   useGetAuditLogStatsQuery,
//   useGetAuditLogsQuery,
//   useExportAuditLogsMutation,
//   useCreateAuditLogMutation,
//   useGetOnlineUsersQuery,
// } = userApi;

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL + "/api/users",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery,
  tagTypes: ["User"],
  endpoints: (builder) => ({

    getUsers: builder.query({
      query: () => "/",
      providesTags: ["User"],
    }),

    createUser: builder.mutation({
      query: (data) => ({
        url: "/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    toggleActive: builder.mutation({
      query: (id) => ({
        url: `/${id}/active`,
        method: "PUT",
      }),
      invalidatesTags: ["User"],
    }),

    getCustomers: builder.query({
      query: () => "",
      transformResponse: (res) => res.filter((u) => u.role === "customer"),
      providesTags: ["User"],
    }),

    // Server-side customers endpoint with optional search query
    getCustomersServer: builder.query({
      query: (q = "") => `/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`,
      providesTags: ["User"],
    }),

    getApprovers: builder.query({
      query: () => `/?role=approver`,
      providesTags: ["User"],
    }),

    changeRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `/${id}/role`,
        method: "PUT",
        body: { role },
      }),
      invalidatesTags: ["User"],
    }),

    reassignTasks: builder.mutation({
      query: ({ fromUserId, toUserId }) => ({
        url: `/${fromUserId}/reassign`,
        method: "POST",
        body: { toUserId },
      }),
      invalidatesTags: ["User"],
    }),

    getOnlineUsers: builder.query({
      query: () => "/online",
      providesTags: ["User"],
    }),

    getUsersWithStatus: builder.query({
      query: () => "/status",
      providesTags: ["User"],
    }),

    getUserActivity: builder.query({
      query: (userId) => `/${userId}/activity`,
      providesTags: ["User"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useToggleActiveMutation,
  useChangeRoleMutation,
  useGetCustomersQuery,
  useGetCustomersServerQuery,
  useGetApproversQuery,
  useReassignTasksMutation,
  useGetOnlineUsersQuery,
  useGetUsersWithStatusQuery,
  useGetUserActivityQuery,
} = userApi;