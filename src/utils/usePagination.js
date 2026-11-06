import { useState } from "react";

export default function usePagination(items, pageSize = 10) {
  const [requestedPage, setRequestedPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(requestedPage, pageCount);
  const startIndex = (page - 1) * pageSize;

  return {
    page,
    pageCount,
    pageSize,
    pageItems: items.slice(startIndex, startIndex + pageSize),
    setPage: setRequestedPage,
  };
}
