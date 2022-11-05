<script lang="ts" setup>
import { onMounted, onUpdated, ref } from 'vue';
import BarChart from './components/graph/BarChart.vue';
import LineChart from './components/graph/LineChart.vue';
import PieChart from './components/graph/PieChart.vue';
import DoughnutChart from './components/graph/DoughnutChart.vue';
import CurveChart from './components/graph/CurveChart.vue';
import { defaultColorScheme } from './components/graph/types';
import { isNum } from './utils'

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
let chartName = '';
let chartWidth = ref(0);
let chartHeight = ref(0);

function parseChartOptions(text: String) {
  text = text.replace(/".+?(?<!\\)"/g, match => match.replace(/,/g, '{__}'));

  const list = text.split(',')
      .filter(ele => ele !== '')
      .map((ele) => ele.replace('{_}', ','));

  // type, width, height, (color schema), ...labels
  const chartType = list[0];
  const width = isNum(list[1]) ? Number(list[1]) : 0;
  const height = isNum(list[2]) ? Number(list[2]) : 0;
  let colorScheme = '';
  let chartLabels: string[];
  const regRes = list[1].match(/color:\s*"(.*)"/);
  if (regRes) {
    colorScheme = regRes[3];
    chartLabels = list.slice(4);
  } else {
    chartLabels = list.slice(3);
  }
  return { chartType, width, height, colorScheme, chartLabels };
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
    let { chartId, optionText, data } = event.data;
    let { chartType, width, height, colorScheme, chartLabels } = parseChartOptions(optionText);

    chartColor.value = colorScheme;
    chartComponent.value = typeMap[chartType];
    chartData.value = generateChartData(data, chartLabels);
    chartWidth.value = width;
    chartHeight.value = height;
    chartName = chartId;
  })
})

onUpdated(() => {
  let iframe = parent.document.querySelector(`.query-chart-iframe[data-name=${chartName}]`) as HTMLIFrameElement;

  iframe.style.height = `${chartHeight.value}px`;
  iframe.style.width = `${chartWidth.value}px`;
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
