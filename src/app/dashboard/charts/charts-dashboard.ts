import { signal } from '@angular/core';
import type { ApexOptions, ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexFill, ApexGrid, ApexLegend, ApexPlotOptions, ApexStroke, ApexTooltip, ApexXAxis, ApexYAxis } from 'ng-apexcharts';

interface DashboardMetric {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: string;
  color: string;
  colorIcon?: string;
}

interface Transaction {
  id: string;
  type: string;
  company: string;
  amount: string;
  status: 'positive' | 'negative';
  icon: string;
  color: string;
}

interface OrderCategory {
  name: string;
  icon: string;
  percentage: number;
  count: number;
  color: string;
}

export const LINE_CHART = signal({
  series: [{ data: [30, 58, 35, 53, 50, 68] }],
  tooltip: { enabled: false },
  colors: ['#FFAC04', 'red'],
  chart: {
    parentHeightOffset: 0,
    toolbar: { show: false },
    foreColor: '#ffac04',
    dropShadow: {
      top: 12,
      blur: 4,
      left: 0,
      enabled: true,
      opacity: 0.12,

      color: '#FFAC04'
    }
  } as ApexChart,
  dataLabels: {
    enabled: false
  },
  stroke: {
    width: 4,
    curve: 'smooth',
    lineCap: 'round'
  } as ApexStroke,

  grid: {
    show: false,
    padding: {
      top: -21,
      left: -5,
      bottom: -8
    }
  },
  xaxis: {
    labels: { show: false },
    axisTicks: { show: false },
    axisBorder: { show: false }
  },
  yaxis: {
    labels: { show: false }
  }
});

export const METRICS = signal<DashboardMetric[]>([
  {
    title: 'Profit',
    value: '$12,628',
    change: '+72.8%',
    changeType: 'positive',
    icon: 'monitoring',
    color: 'profit',
    colorIcon: 'btn_green'
  },
  {
    title: 'Sales',
    value: '$4,679',
    change: '+28.42%',
    changeType: 'positive',
    icon: 'monitoring',
    color: 'sales',
    colorIcon: 'btn_lightblue'
  },
  {
    title: 'Payments',
    value: '$2,468',
    change: '-14.82%',
    changeType: 'negative',
    icon: 'monitoring',
    color: 'payments',
    colorIcon: 'btn_red'
  },
  {
    title: 'Transactions',
    value: '$14,857',
    change: '+28.14%',
    changeType: 'positive',
    icon: 'monitoring',
    color: 'transactions',
    colorIcon: 'btn_darkblue'
  }
]);

// ApexCharts data for Total Revenue
export const EWVENUE_CHART_DATA = signal({
  series: [
    { name: `${new Date().getFullYear() - 1}`, data: [18, 10, 15, 29, 18, 12, 9] },
    { name: `${new Date().getFullYear() - 2}`, data: [-13, -18, -9, -14, -8, -17, -15] }
  ] as ApexAxisChartSeries,

  chart: {
    type: 'bar',
    sparkline: { enabled: true }
    // height: 300,
    // stacked: true,
    // toolbar: { show: false },
    // fontFamily: 'Inter'
  } satisfies ApexChart,

  colors: ['#696cff', '#03c3ec'],

  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '18%',
      barHeight: '50%',
      borderRadius: 5,
      borderRadiusApplication: 'around',
      distributed: true,
      dataLabels: { position: 'top' }
    }
  } satisfies ApexPlotOptions,

  dataLabels: { enabled: false } as ApexDataLabels,

  grid: {
    show: true,
    borderColor: 'rgba(34,48,62,.12)',
    strokeDashArray: 3,
    padding: { left: 0, right: 0, top: 0, bottom: 0 }
  } as ApexGrid,

  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'left',
    offsetY: 6,
    markers: { width: 8, height: 8, radius: 8 }
  } as ApexLegend,

  tooltip: {
    shared: true,
    intersect: false,
    x: { show: false },
    y: { formatter: (v: number) => `${v > 0 ? '' : ''}${v}` }
  } as ApexTooltip,

  xaxis: {
    categories: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    axisTicks: { show: false },
    axisBorder: { show: false },
    tickPlacement: 'on',
    offsetY: -10,
    labels: {
      style: {
        fontSize: '11px',
        colors: '#696cff',
        fontFamily: 'Public Sans'
      }
    }
  } as ApexXAxis,

  yaxis: {
    // En el demo se perciben ticks simétricos (cuando hay negativos):
    tickAmount: 4,
    labels: { style: { fontSize: '12px' } }
  } as ApexYAxis
});

export const CHART_RADIAL = signal({
  series: [67],
  chart: {
    height: 350,
    type: 'radialBar',
    offsetY: -10
  },

  plotOptions: {
    radialBar: {
      endAngle: 150,
      startAngle: -140,
      hollow: { size: '56%' },
      track: { background: 'transparent' },
      dataLabels: {
        name: {
          offsetY: 25,
          fontWeight: 500,
          fontSize: '15px',
          color: '#000',
          fontFamily: 'Inter'
        },
        value: {
          offsetY: -15,
          fontWeight: 500,
          fontSize: '24px',
          color: '#000',
          fontFamily: 'Inter'
        }
      }
    }
  },
  responsive: [
    {
      breakpoint: 900,
      options: {
        chart: { height: 200 }
      }
    },
    {
      breakpoint: 735,
      options: {
        chart: { height: 200 }
      }
    },
    {
      breakpoint: 660,
      options: {
        chart: { height: 200 }
      }
    },
    {
      breakpoint: 600,
      options: {
        chart: { height: 200 }
      }
    }
  ],
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'dark',
      opacityTo: 0.6,
      opacityFrom: 1,
      shadeIntensity: 0.5,
      stops: [30, 70, 100],
      inverseColors: false,
      gradientToColors: ['#696cff', '#03c3ec']
    }
  },
  states: {
    hover: {
      filter: { type: 'none' }
    },
    active: {
      filter: { type: 'none' }
    }
  },
  stroke: { dashArray: 5 },
  labels: ['Growth']
} satisfies ApexOptions);

// ApexCharts data for Profit trend (small chart in Order Statistics)
export const PROFIT_CHART_DATA = signal({
  series: [{ data: [24, 21, 30, 22, 42, 26, 35, 29] }] as ApexAxisChartSeries,

  chart: {
    type: 'area',
    height: 230,
    toolbar: { show: false }
  } satisfies ApexChart,

  colors: ['#696cff'],

  stroke: {
    width: 3,
    curve: 'smooth'
  } satisfies ApexStroke,

  avatar: 'statsVerticalWallet',
  title: 'Total Income',
  stats: '$459.1k',
  profitLoss: 65,
  profitLossAmount: '6.5',
  compareToLastWeek: '$39k',
  states: {
    hover: {
      filter: { type: 'none' }
    },
    active: {
      filter: { type: 'none' }
    }
  },

  dataLabels: { enabled: false } as ApexDataLabels,
  grid: {
    strokeDashArray: 4.5,
    borderColor: 'rgba(34,48,62,.3)',
    padding: {
      left: 0,
      top: -20,
      right: 11,
      bottom: 7
    }
  },
  fill: {
    type: 'gradient',
    gradient: {
      opacityTo: 0.25,
      opacityFrom: 0.5,
      stops: [0, 95, 100],
      shadeIntensity: 0.6,
      colorStops: [
        [
          {
            offset: 0,
            opacity: 0.4,
            color: '#696cff'
          },
          {
            offset: 100,
            opacity: 0.2,
            color: '#03c3ec'
          }
        ]
      ]
    }
  },
  xaxis: {
    axisTicks: { show: false },
    axisBorder: { show: false },
    categories: ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    offsetY: 20,
    offsetX: -24,
    labels: {
      style: {
        fontSize: '14px',
        colors: '#696cff',
        fontFamily: 'Public Sans'
      }
    }
  },
  yaxis: {
    min: 10,
    max: 50,
    show: false,
    tickAmount: 4
  },

  markers: {
    size: 8,
    strokeWidth: 6,
    strokeOpacity: 1,
    offsetX: -10,
    hover: { size: 8 },
    colors: ['transparent'],
    strokeColors: 'transparent',
    discrete: [
      {
        size: 8,
        seriesIndex: 0,
        fillColor: '#fff',
        strokeColor: '#696cff',
        dataPointIndex: 7
      }
    ]
  }
});

export const ORDER_CATEGORIES = signal<OrderCategory[]>([
  {
    name: 'Electronic',
    icon: 'devices',
    percentage: 82.5,
    count: 849,
    color: 'btn_darkblue'
  },
  {
    name: 'Fashion',
    icon: 'checkroom',
    percentage: 23.8,
    count: 237,
    color: 'btn_green'
  },
  {
    name: 'Decor',
    icon: 'palette',
    percentage: 84.9,
    count: 849,
    color: 'btn_lightblue'
  },
  {
    name: 'Sports',
    icon: 'sports_soccer',
    percentage: 9.9,
    count: 99,
    color: 'btn_gray'
  }
]);

export const TRANSACTIONS = signal<Transaction[]>([
  {
    id: '1',
    type: 'Send money',
    company: 'PayPal',
    amount: '+$82.6',
    status: 'positive',
    icon: 'account_balance',
    color: 'btn_red'
  },
  {
    id: '2',
    type: 'MacD',
    company: 'Wallet',
    amount: '+$270.69',
    status: 'positive',
    icon: 'account_balance_wallet',
    color: 'btn_darkblue'
  },
  {
    id: '3',
    type: 'Refund',
    company: 'Transfer',
    amount: '+$637.91',
    status: 'positive',
    icon: 'swap_horiz',
    color: 'btn_lightblue'
  },
  {
    id: '4',
    type: 'Ordered Food',
    company: 'Credit Card',
    amount: '-$838.71',
    status: 'negative',
    icon: 'credit_card',
    color: 'btn_green'
  },
  {
    id: '5',
    type: 'Starbucks',
    company: 'Wallet',
    amount: '+$203.33',
    status: 'positive',
    icon: 'local_cafe',
    color: 'btn_darkblue'
  },
  {
    id: '6',
    type: 'Ordered Food',
    company: 'Mastercard',
    amount: '-$92.45',
    status: 'negative',
    icon: 'restaurant',
    color: 'btn_gray'
  }
]);

export const CIRCLE_CHART = signal({
  series: [45, 80, 20, 40],
  chart: {
    sparkline: { enabled: true },
    animations: { enabled: false },
    width: 140,
    height: 120,
    type: 'donut'
  } satisfies ApexChart,
  states: {
    hover: {
      filter: { type: 'none' }
    },
    active: {
      filter: { type: 'none' }
    }
  },
  stroke: {
    width: 6,
    colors: ['rgb(105, 108, 255)']
  },
  legend: { show: false },
  tooltip: { enabled: false },
  dataLabels: { enabled: false },
  labels: ['Fashion', 'Electronic', 'Sports', 'Decor'],
  grid: {
    padding: {
      top: -7,
      bottom: 5
    }
  },
  plotOptions: {
    pie: {
      expandOnClick: false,
      donut: {
        size: '85%',
        labels: {
          show: true,
          name: {
            offsetY: 17,
            fontSize: '22px',
            color: 'rgb(3, 195, 236)',
            fontFamily: 'Public Sans'
          },
          value: {
            offsetY: -17,
            fontSize: '18px',
            color: 'rgb(105, 108, 255)',
            fontFamily: 'Public Sans',
            fontWeight: 500
          },
          total: {
            show: true,
            label: 'Weekly',
            fontSize: '13px',
            lineHeight: '18px',
            formatter: () => '38%',
            color: 'rgb(3, 195, 236)',
            fontFamily: 'Public Sans'
          }
        }
      }
    }
  }
});
