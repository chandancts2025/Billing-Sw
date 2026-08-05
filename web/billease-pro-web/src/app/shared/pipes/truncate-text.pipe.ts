import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncateText', standalone: true })
export class TruncateTextPipe implements PipeTransform {
  transform(value: string | null | undefined, length = 42): string {
    const text = value ?? '';
    return text.length > length ? `${text.slice(0, Math.max(0, length - 1))}...` : text;
  }
}
