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
  series: [
    {
      name: 'Desktops',
      data: [10, 41, 35, 51, 49, 62, 69, 91, 148]
    }
  ],
  tooltip: { enabled: false },
  colors: ['rgba(255, 171, 0,1)'],
  chart: {
    parentHeightOffset: 0,
    toolbar: { show: false },

    dropShadow: {
      top: 12,
      blur: 4,
      left: 0,
      enabled: true,
      opacity: 0.12,
      color: 'rgba(255, 171, 0,1)'
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
    colorIcon: '#72DD38'
  },
  {
    title: 'Sales',
    value: '$4,679',
    change: '+28.42%',
    changeType: 'positive',
    icon: 'monitoring',
    color: 'sales',
    colorIcon: '#67DBF4'
  },
  {
    title: 'Payments',
    value: '$2,468',
    change: '-14.82%',
    changeType: 'negative',
    icon: 'monitoring',
    color: 'payments',
    colorIcon: '#FF3E1D'
  },
  {
    title: 'Transactions',
    value: '$14,857',
    change: '+28.14%',
    changeType: 'positive',
    icon: 'monitoring',
    color: 'transactions',
    colorIcon: '#A5A7FF'
  }
]);

// ApexCharts data for Total Revenue
export const EWVENUE_CHART_DATA = signal({
  series: [
    { name: '2024', data: [18, 7, 15, 29, 18, 12, 9] },
    { name: '2023', data: [-13, -18, -9, -14, -5, -17, -15] }
  ] as ApexAxisChartSeries,

  chart: {
    type: 'bar',
    height: 300,
    stacked: true,
    toolbar: { show: false },
    fontFamily: 'Inter'
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
          fontSize: '50px',
          color: '#03c3ec',
          fontFamily: 'Inter'
        },
        value: {
          offsetY: -15,
          fontWeight: 500,
          fontSize: '50px',
          color: '#696cff',
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
  series: [
    {
      name: 'Profit',
      data: [3350, 3350, 4800, 4800, 2950, 2950, 1800, 1800, 3750, 3750, 5700, 5700]
    }
  ] as ApexAxisChartSeries,

  chart: {
    type: 'area',
    height: 80,
    sparkline: { enabled: true },
    animations: { enabled: false }, // estático como la tarjeta
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  } satisfies ApexChart,

  colors: ['#696cff'],

  stroke: {
    curve: 'smooth',
    width: 2
  } satisfies ApexStroke,

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
    show: false,
    padding: {
      left: 0,
      top: -10,
      right: 7,
      bottom: -3
    }
  },
  xaxis: {
    labels: { show: false },
    axisBorder: { show: false },
    axisTicks: { show: false }
  } as ApexXAxis,
  yaxis: { show: false } as ApexYAxis,

  tooltip: { enabled: false } // tarjeta “limpia” como la del demo
});

export const ORDER_CATEGORIES = signal<OrderCategory[]>([
  {
    name: 'Electronic',
    icon: 'devices',
    percentage: 82.5,
    count: 849,
    color: 'rgb(105, 108, 255)'
  },
  {
    name: 'Fashion',
    icon: 'checkroom',
    percentage: 23.8,
    count: 237,
    color: 'rgb(113, 221, 55)'
  },
  {
    name: 'Decor',
    icon: 'palette',
    percentage: 84.9,
    count: 849,
    color: 'rgb(3, 195, 236)'
  },
  {
    name: 'Sports',
    icon: 'sports_soccer',
    percentage: 9.9,
    count: 99,
    color: 'rgb(255, 171, 0)'
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
    color: '#0070ba'
  },
  {
    id: '2',
    type: 'MacD',
    company: 'Wallet',
    amount: '+$270.69',
    status: 'positive',
    icon: 'account_balance_wallet',
    color: 'rgb(105, 108, 255)'
  },
  {
    id: '3',
    type: 'Refund',
    company: 'Transfer',
    amount: '+$637.91',
    status: 'positive',
    icon: 'swap_horiz',
    color: 'rgb(3, 195, 236)'
  },
  {
    id: '4',
    type: 'Ordered Food',
    company: 'Credit Card',
    amount: '-$838.71',
    status: 'negative',
    icon: 'credit_card',
    color: 'rgb(113, 221, 55)'
  },
  {
    id: '5',
    type: 'Starbucks',
    company: 'Wallet',
    amount: '+$203.33',
    status: 'positive',
    icon: 'local_cafe',
    color: 'rgb(105, 108, 255)'
  },
  {
    id: '6',
    type: 'Ordered Food',
    company: 'Mastercard',
    amount: '-$92.45',
    status: 'negative',
    icon: 'restaurant',
    color: 'rgb(255, 171, 0)'
  }
]);
