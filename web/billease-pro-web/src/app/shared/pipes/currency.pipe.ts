import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'beCurrency', standalone: true })
export class BeCurrencyPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    const amount = Number(value ?? 0);
    return `Rs. ${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  }
}
