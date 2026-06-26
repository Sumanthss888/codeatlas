import { InputHTMLAttributes } from "react";
export type SearchFieldSize = 'compact' | 'default';
export type SearchFieldFont = 'mono' | 'body';
export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
}
