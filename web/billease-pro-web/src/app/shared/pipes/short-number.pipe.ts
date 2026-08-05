import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'shortNumber', standalone: true })
export class ShortNumberPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    const number = Number(value ?? 0);
    if (Math.abs(number) >= 10000000) return `${(number / 10000000).toFixed(1)}Cr`;
    if (Math.abs(number) >= 100000) return `${(number / 100000).toFixed(1)}L`;
    if (Math.abs(number) >= 1000) return `${(number / 1000).toFixed(1)}K`;
    return String(number);
  }
}
