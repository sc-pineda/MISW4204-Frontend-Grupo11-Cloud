import { Pipe, PipeTransform } from '@angular/core';

/** Muestra solo la parte fecha (YYYY-MM-DD) de un ISO string del API. */
@Pipe({ name: 'isoDate', standalone: true })
export class IsoDatePipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    if (value == null || value === '') {
      return '';
    }
    return value.length >= 10 ? value.slice(0, 10) : value;
  }
}
