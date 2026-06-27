import React, { forwardRef, useState } from "react";
const SearchField = forwardRef((props: any, ref: any) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <input
      type="text"
      ref={ref}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    />
  );
});
SearchField.displayName = "SearchField";
export default SearchField;
