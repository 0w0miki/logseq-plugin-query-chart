const chartType = ['bar', 'line', 'pie', 'doughnut', 'curve'] as const;
export type ChartType = (typeof chartType)[number];
export const isChartType = (x: any): x is ChartType => chartType.includes(x);

export interface ChartOption {
  chartType: ChartType,
  width: number,
  height: number,
  colorScheme?: string,
  chartLabels: string[],
}

export interface ChartInfo {
  chartOption: ChartOption,
  data: number[] | string[] | undefined
}
