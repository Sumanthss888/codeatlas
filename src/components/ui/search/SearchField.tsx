import React, { forwardRef } from "react";
const SearchField = forwardRef((props, ref) => {
  return <input type="text" ref={ref} />;
});
SearchField.displayName = "SearchField";
export default SearchField;
