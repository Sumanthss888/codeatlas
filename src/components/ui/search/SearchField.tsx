import React, { forwardRef, useState } from "react";
const SearchField = forwardRef((props, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  return <input type="text" ref={ref} />;
});
SearchField.displayName = "SearchField";
export default SearchField;
