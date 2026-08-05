import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ReportChartDto } from './reports.models';

Chart.register(...registerables);

@Component({
  selector: 'be-report-chart',
  standalone: true,
  template: `<canvas #canvas></canvas>`,
  styles: [`:host { display: block; min-height: 260px; } canvas { width: 100% !important; max-height: 320px; }`]
})
export class ReportChartComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) chart!: ReportChartDto;
  @ViewChild('canvas') canvas?: ElementRef<HTMLCanvasElement>;
  private instance?: Chart;

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chart']) this.render();
  }

  private render(): void {
    const canvas = this.canvas?.nativeElement;
    if (!canvas || !this.chart) return;
    this.instance?.destroy();
    const colors = ['#0f766e', '#2563eb', '#f59e0b', '#dc2626', '#7c3aed', '#059669', '#475467', '#db2777'];
    const config: ChartConfiguration = {
      type: this.chart.type,
      data: {
        labels: this.chart.labels,
        datasets: this.chart.datasets.map((set, index) => ({
          label: set.label,
          data: set.data,
          borderColor: colors[index % colors.length],
          backgroundColor: this.chart.type === 'line' ? colors[index % colors.length] : this.chart.labels.map((_, i) => colors[i % colors.length]),
          tension: 0.32,
          fill: false
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' }, title: { display: true, text: this.chart.title } },
        scales: this.chart.type === 'pie' || this.chart.type === 'doughnut' ? {} : { y: { beginAtZero: true } }
      }
    };
    this.instance = new Chart(canvas, config);
  }
}
