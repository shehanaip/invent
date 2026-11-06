export default function ThemeToggle({ dark, setDark, t = (text) => text }) {
  return (
    <button
      type="button"
      className={`theme-toggle ${dark ? "is-dark" : "is-light"}`}
      role="switch"
      aria-checked={dark}
      aria-label={dark ? t("Switch to light mode") : t("Switch to dark mode")}
      onClick={() => setDark(!dark)}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-thumb">
          <i className={`fas ${dark ? "fa-moon" : "fa-sun"}`} />
        </span>
      </span>
      <span>{dark ? t("Dark Mode") : t("Light Mode")}</span>
    </button>
  );
}
