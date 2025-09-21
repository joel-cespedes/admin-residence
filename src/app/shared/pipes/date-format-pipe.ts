import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat'
})
export class DateFormatPipe implements PipeTransform {

  transform(value: string | Date | null, format: 'short' | 'medium' | 'long' | 'full' = 'short'): string {
    if (!value) return '';

    const date = typeof value === 'string' ? new Date(value) : value;

    if (isNaN(date.getTime())) return value.toString();

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };

    switch (format) {
      case 'medium':
        options.month = 'short';
        break;
      case 'long':
        options.month = 'long';
        options.weekday = 'long';
        break;
      case 'full':
        options.month = 'long';
        options.weekday = 'long';
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
    }

    return new Intl.DateTimeFormat('es-ES', options).format(date);
  }

}
