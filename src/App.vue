<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import BarChart from './components/graph/BarChart.vue';
import LineChart from './components/graph/LineChart.vue';
import PieChart from './components/graph/PieChart.vue';
import DoughnutChart from './components/graph/DoughnutChart.vue';
import CurveChart from './components/graph/CurveChart.vue';
import { defaultColorScheme } from './components/graph/types';

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

function parseChartOptions(text: String) {
  text = text.replace(/".+?(?<!\\)"/g, match => match.replace(/,/g, '{__}'));

  const list = text.split(',')
      .filter(ele => ele !== '')
      .map((ele) => ele.replace('{_}', ','));

  // type, color schema, ...labels
  const chartType = list[0];
  let colorScheme = '';
  let chartLabels: string[];
  const regRes = list[1].match(/color:\s*"(.*)"/);
  if (regRes) {
     colorScheme = regRes[1];
    chartLabels = list.slice(2);
  } else {
    chartLabels = list.slice(1);
  }
  return {chartType, colorScheme, chartLabels};
}

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
    let { optionText, data } = event.data;
    let {chartType, colorScheme, chartLabels} = parseChartOptions(optionText);

    chartColor.value = colorScheme;
    chartComponent.value = typeMap[chartType];
    chartData.value = generateChartData(data, chartLabels);
  })
})

</script>

<template>
  <component
    :is="chartComponent"
    :data="chartData"
    :colorScheme="chartColor"
    >
  </component>
</template>
