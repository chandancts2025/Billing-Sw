import { Pipe, PipeTransform } from '@angular/core';
import { format } from 'date-fns';

@Pipe({ name: 'beDateFormat', standalone: true })
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, pattern = 'dd MMM yyyy'): string {
    if (!value) return '';
    return format(new Date(value), pattern);
  }
}
