"use client";

import React, { forwardRef, useRef, useImperativeHandle, useState } from "react";
import { SearchFieldProps } from "./SearchField.types";
import SearchIcon from "./SearchIcon";
import ClearButton from "./ClearButton";

const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  (
    {
      value,
      onChange,
      placeholder = "Search...",
      size = "default",
      font = "body",
      clearable = true,
      autoFocus = false,
      className = "",
      onKeyDown,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Expose inner input ref to parent
    useImperativeHandle(ref, () => inputRef.current!);

    const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      onChange("");
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape" && value) {
        e.preventDefault();
        onChange("");
        inputRef.current?.focus();
      }
      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
    };

    return (
      <div
        className={`search-field-container ${size} ${isFocused ? "focused" : ""} ${className}`}
      >
        <span className="search-field-icon">
          <SearchIcon size={size === "compact" ? 12 : 14} />
        </span>
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`search-field-input ${font}`}
          {...props}
        />
        {clearable && value && (
          <ClearButton
            onClick={handleClear}
            size={size === "compact" ? 11 : 13}
            className="search-field-clear"
          />
        )}
      </div>
    );
  }
);

SearchField.displayName = "SearchField";

export default SearchField;
