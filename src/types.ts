const chartType = ['bar', 'line', 'pie', 'doughnut', 'curve'] as const;
export type ChartType = (typeof chartType)[number];
export const isChartType = (x: any): x is ChartType => chartType.includes(x);