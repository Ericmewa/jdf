// import { useState } from "react";

// export default function useReportsFilters(initialFilters = {}) {
//   const [filters, setFilters] = useState({
//     searchText: "",
//     dateRange: null,
//     status: "All",
//     ...initialFilters,
//   });

//   const clearFilters = () =>
//     setFilters({ searchText: "", dateRange: null, status: "All" });

//   return { filters, setFilters, clearFilters };
// }
// src/hooks/useReportsFilters.js
import { useState } from "react";

export default function useReportsFilters(initialFilters = {}) {
  const [filters, setFilters] = useState({
    searchText: "",
    dateRange: null,
    status: "All",
    ...initialFilters,
  });

  const clearFilters = () =>
    setFilters({ searchText: "", dateRange: null, status: "All" });

  return { filters, setFilters, clearFilters };
}
