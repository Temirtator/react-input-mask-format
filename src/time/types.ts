export interface TimeFormatOptions {
  separator?: string;
}

export interface TimeFormatValues {
  value: string;
  formattedValue: string;
  complete: boolean;
  hours: number | undefined;
  minutes: number | undefined;
}
