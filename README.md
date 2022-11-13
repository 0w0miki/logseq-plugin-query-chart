# Logseq Plugin Query Chart

## Introduction
This plugin can create a chart according to the result of advanced query, so that you can visualize any data in your logseq as you want.

## Usage

1. Use slash command `/Insert Query Chart` to insert a chart.
2. Write down the options of chart in the child block. Options including:
    * chart type
    * width
    * height
    * color scheme (optional)
    * labels of data
3. Write advanced query in grand child block.

![](./screenshots/query%20chart%20demo.gif)

### Supported chart type
* bar
<img src="./screenshots/bar.png" width="600">
* pie
<img src="./screenshots/pie.png" width="600">
* doughnut
<img src="./screenshots/doughnut.png" width="600">
* line
<img src="./screenshots/line.png" width="600">
* curve
<img src="./screenshots/curve.png" width="600">

### Color Scheme
Check this [link](https://nagix.github.io/chartjs-plugin-colorschemes/colorchart.html) for all supported color schemes. Default color scheme is `brewer.Paired12`.

### Advanced query
You need to write a query whose result is a list of array. Take the following query as an example.
```clojure
  :query [:find ?x ?y
          :in $ ?start ?today
          :where
          [?b :block/content ?x]
          [?b :block/page ?journal]
          [?journal :block/journal-day ?d]
          [(>= ?d ?start)]
          [(<= ?d ?today)]
          [?b :block/priority ?y]
  ]
  :inputs [:7d-before :today]
```
The result would be like `[task1, A], [task2, B], [task3, C], ...`
For x-y plot, the first elements in each array formats the data on x-axis.

## Example
I have page like the following one. I log the sleep time as `sleep-time [[改善睡眠质量，平均7小时]]`
```markdown
## [[OKR Tracker]]
  - 6 [[改善睡眠质量，平均7小时]]
```
The query I used to generate a chart for the last 7 days is
```clojure
{
  :query [:find ?date ?result
          :in $ ?start ?today ?kr
          :where
          [?b :block/parent ?p]
          [?p :block/refs ?pr]
          [?b :block/refs ?ref]
          [?ref :block/name ?kr]
          [?b :block/page ?journal]
          [?journal :block/name ?date]
          [?journal :block/journal-day ?d]
          [(>= ?d ?start)]
          [(<= ?d ?today)]
          [?b :block/content ?content]
          [?pr :block/name "okr tracker"]
          [(re-pattern "([\\d\\.]+)\\s\\[\\[.*\\]\\]") ?reg]
          [(re-find ?reg ?content) ?c]
          [(get ?c 1) ?result]
  ]
  :inputs [:5d-before :today "改善睡眠质量，平均7小时"]
}
```
The chart is

![](./screenshots/demo.png)

## TODOs
- [ ] Custom colorscheme

## Credit
* [Logseq Plugin Starter Vite](https://github.com/vipzhicheng-starter/logseq-plugin-starter-vite)
* [chart.js](https://www.chartjs.org/)
* [vue-chartjs](https://vue-chartjs.org/)
* Inspired by [logseq-chartrender-plugin](https://github.com/hkgnp/logseq-chartrender-plugin)

## Licence
MIT
