export default function Pagination({
  totalItems,
  page,
  pageCount,
  pageSize,
  onPageChange,
  t = (text) => text,
}) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <nav className="pagination" aria-label={t("Table pagination")}>
      <span className="pagination-summary">
        {t("Showing")} {start}–{end} {t("of")} {totalItems}
      </span>
      <div className="pagination-controls">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label={t("Previous page")}
        >
          {t("Previous")}
        </button>
        <span aria-live="polite">
          {t("Page")} {page} {t("of")} {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label={t("Next page")}
        >
          {t("Next")}
        </button>
      </div>
    </nav>
  );
}
