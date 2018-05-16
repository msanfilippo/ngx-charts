# Normalized Vertical Bar Chart

## Normalized Vertical Bar Chart

## Inputs

| Property | Type | Default Value | Description |
| --- | --- | --- | --- |
| view | number\[\] |  | the dimensions of the chart \[width, height\]. If left undefined, the chart will fit to the parent container size |
| results | object\[\] |  | the chart data |
| scheme | object |  | the color scheme of the chart |
| schemeType | string | 'ordinal' | the color scale type. Can be either 'ordinal' or 'linear' |
| customColors | function or object |  | custom colors for the chart. Used to override a color for a specific value |
| animations | boolean | true | enable animations |
| legend | boolean | false | show or hide the legend |
| legendTitle | string | 'Legend' | the legend title |
| xAxis | boolean | false | show or hide the x axis |
| yAxis | boolean | false | show or hide the y axis |
| showGridLines | boolean | true | show or hide the grid lines |
| roundDomains | boolean | false | round domains for aligned gridlines |
| showXAxisLabel | boolean | false | show or hide the x axis label |
| showYAxisLabel | boolean | false | show or hide the y axis label |
| xAxisLabel | string |  | the x axis label text |
| yAxisLabel | string |  | the y axis label text |
| xAxisTickFormatting | function |  | the x axis tick formatting |
| yAxisTickFormatting | function |  | the y axis tick formatting |
| xAxisTicks | any\[\] |  | predefined list of x axis tick values |
| yAxisTicks | any\[\] |  | predefined list of y axis tick values |
| gradient | boolean | false | fill elements with a gradient instead of a solid color |
| activeEntries | object\[\] | \[\] | elements to highlight |
| barPadding | number | 8 | padding between bars in px |
| tooltipDisabled | boolean | false | show or hide the tooltip |
| tooltipTemplate | TemplateRef |  | a custom ng-template to be displayed inside the tooltip |

## Outputs

| Property | Description |
| --- | --- |
| select | click event |
| activate | element activation event \(mouse enter\) |
| deactivate | element deactivation event \(mouse leave\) |

## Data Format

The data format is multi series:

```text
[
  {
    "name": "Germany",
    "series": [
      {
        "name": "2010",
        "value": 7300000
      },
      {
        "name": "2011",
        "value": 8940000
      }
    ]
  },

  {
    "name": "USA",
    "series": [
      {
        "name": "2010",
        "value": 7870000
      },
      {
        "name": "2011",
        "value": 8270000
      }
    ]
  }
]
```
