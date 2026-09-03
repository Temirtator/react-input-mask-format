export interface TimeFormatOptions {
  separator?: string;
}

export interface TimeFormatValues {
  value: string;
  formattedValue: string;
  hours: number | undefined;
  minutes: number | undefined;
}
