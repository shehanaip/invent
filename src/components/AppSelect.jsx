import { Children, isValidElement, useEffect, useMemo, useRef, useState } from "react";

export default function AppSelect({
  id,
  name,
  value,
  onChange,
  ariaLabel,
  disabled = false,
  className = "",
  children,
}) {
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const options = useMemo(
    () =>
      Children.toArray(children)
        .filter((child) => isValidElement(child) && child.type === "option")
        .map((option) => ({
          value: String(option.props.value ?? option.props.children ?? ""),
          label: option.props.children,
          disabled: option.props.disabled,
        })),
    [children]
  );
  const selectedValue = String(value ?? "");
  const selectedIndex = options.findIndex((option) => option.value === selectedValue);
  const selectedOption = options[selectedIndex];

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  const openAt = (index = selectedIndex < 0 ? 0 : selectedIndex) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const selectOption = (option) => {
    if (option.disabled) return;
    onChange?.({ target: { name, value: option.value } });
    setOpen(false);
    triggerRef.current?.focus();
  };

  const moveActive = (index, direction = 1) => {
    if (!options.length) return;
    let next = (index + options.length) % options.length;
    for (let count = 0; count < options.length; count += 1) {
      if (!options[next]?.disabled) {
        setActiveIndex(next);
        return;
      }
      next = (next + direction + options.length) % options.length;
    }
  };

  return (
    <div className={`app-select ${className}`.trim()} ref={rootRef}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`app-select-trigger${open ? " is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openAt())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) {
              openAt(selectedIndex < 0 ? 0 : selectedIndex);
            } else {
              const direction = event.key === "ArrowDown" ? 1 : -1;
              moveActive(activeIndex + direction, direction);
            }
          } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!open) openAt();
          }
        }}
      >
        <span>{selectedOption?.label}</span>
        <i className={`fas fa-chevron-down${open ? " is-open" : ""}`} aria-hidden="true"></i>
      </button>
      {open && (
        <div className="app-select-menu" role="listbox" aria-label={ariaLabel} aria-labelledby={id}>
          {options.map((option, index) => (
            <button
              key={`${option.value}-${index}`}
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              type="button"
              role="option"
              aria-selected={selectedIndex === index}
              aria-disabled={option.disabled || undefined}
              tabIndex={-1}
              className={`app-select-option${selectedIndex === index ? " is-selected" : ""}${activeIndex === index ? " is-active" : ""}`}
              disabled={option.disabled}
              onFocus={() => setActiveIndex(index)}
              onClick={() => selectOption(option)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  const direction = event.key === "ArrowDown" ? 1 : -1;
                  moveActive(activeIndex + direction, direction);
                } else if (event.key === "Home" || event.key === "End") {
                  event.preventDefault();
                  moveActive(event.key === "Home" ? 0 : options.length - 1, event.key === "Home" ? 1 : -1);
                } else if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  selectOption(option);
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  setOpen(false);
                  triggerRef.current?.focus();
                }
              }}
            >
              <span>{option.label}</span>
              {selectedIndex === index && <i className="fas fa-check" aria-hidden="true"></i>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
