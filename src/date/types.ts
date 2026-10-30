export type DateOrder = "dmy" | "mdy" | "ymd";

export interface DateFormatOptions {
  order?: DateOrder;
  separator?: string;
}

export interface DateFormatValues {
  value: string;
  formattedValue: string;
  day: number | undefined;
  month: number | undefined;
  year: number | undefined;
}
