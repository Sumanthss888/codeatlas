import React, { forwardRef, useState } from "react";
import ClearButton from "./ClearButton";
const SearchField = forwardRef((props: any, ref: any) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <div>
      <input
        type="text"
        ref={ref}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") props.onChange("");
        }}
      />
      {props.value && <ClearButton onClick={() => {}} />}
    </div>
  );
});
SearchField.displayName = "SearchField";
export default SearchField;
