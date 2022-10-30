<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import BarChart from './components/graph/BarChart.vue';
import LineChart from './components/graph/LineChart.vue';
import PieChart from './components/graph/PieChart.vue';
import DoughnutChart from './components/graph/DoughnutChart.vue';

const typeMap:  { [key: string]: any } = {
  bar: BarChart,
  line: LineChart,
  pie: PieChart,
  doughnut: DoughnutChart,
}

let chartComponent = ref('line');
let chartData = ref({});

function parseChartOptions(text: String) {
  console.log(`start parse ${text}`);
  text = text.replace(/".+?(?<!\\)"/g, match => match.replace(/,/g, '{__}'));

  const list = text.split(',')
      .filter(ele => ele !== '')
      .map((ele) => ele.replace('{_}', ','));

  // type, color schema, ...labels
  const chartType = list[0];
  let chartColor = '';
  let chartLabels: string[];
  const regRes = list[1].match(/color:\s*"(.*)"/);
  if (regRes) {
     chartColor = regRes[1];
    chartLabels = list.slice(2);
  } else {
    chartLabels = list.slice(1);
  }
  return {chartType, chartColor, chartLabels};
}

function generateChartData(rawData: any, chartLabels: string[]) {
  console.log(rawData);
  let datasets = rawData.map((data: any, index: number) => {
      return {
        label: chartLabels[index],
        data,
      }
  }).slice(1);
  console.log(datasets)
  debugger;
  return {
    datasetIdKey: chartLabels[0],
    labels: rawData[0],
    datasets
  }
}

onMounted(() => {
  console.log("App created.");
  window.addEventListener('message', (event: MessageEvent) => {
    let { optionText, data } = event.data;
    console.log(`receive message`, optionText, data);
    let {chartType, chartColor, chartLabels} = parseChartOptions(optionText);

    console.log('after parse option', chartType, chartColor, chartLabels);

    chartComponent.value = typeMap[chartType];
    chartData.value = generateChartData(data, chartLabels);

    console.log(chartData.value, chartComponent.value);
  })
})

</script>

<template>
  <component
    :is="chartComponent"
    :data="chartData"
    >
  </component>
</template>
