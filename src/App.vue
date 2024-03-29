<script lang="ts" setup>
import { onMounted, onUpdated, ref } from 'vue';
import BarChart from './components/graph/BarChart.vue';
import LineChart from './components/graph/LineChart.vue';
import PieChart from './components/graph/PieChart.vue';
import DoughnutChart from './components/graph/DoughnutChart.vue';
import CurveChart from './components/graph/CurveChart.vue';
import { defaultColorScheme } from './meta';

const typeMap:  { [key: string]: any } = {
  bar: BarChart,
  line: LineChart,
  pie: PieChart,
  doughnut: DoughnutChart,
  curve: CurveChart
}

let chartComponent = ref('line');
let chartData = ref({});
let chartColor = ref(defaultColorScheme);
let chartWidth = ref(0);
let chartHeight = ref(0);

function generateChartData(rawData: any, chartLabels: string[]) {
  let datasets = rawData.map((data: any, index: number) => {
      return {
        label: chartLabels[index],
        data,
      }
  }).slice(1);
  return {
    datasetIdKey: chartLabels[0],
    labels: rawData[0],
    datasets
  }
}

onMounted(() => {
  window.addEventListener('message', (event: MessageEvent) => {
    let { chartOption, data } = event.data;

    chartColor.value = chartOption.colorScheme;
    chartComponent.value = typeMap[chartOption.chartType];
    chartData.value = generateChartData(data, chartOption.chartLabels);
    chartWidth.value = chartOption.width;
    chartHeight.value = chartOption.height;
  })
})
</script>

<template>
  <component
    :is="chartComponent"
    :data="chartData"
    :colorScheme="chartColor"
    :width="chartWidth"
    :height="chartHeight"
    >
  </component>
</template>
