import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'etb' })
export class EtbPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    const amount = Number(value ?? 0);
    const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0);
    return `${formatted} ETB`;
  }
}
