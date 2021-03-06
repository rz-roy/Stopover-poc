export default class DateUtils {
  static getDDHHMMFromMinutes(timeMinutes: number): string {
    const days = Math.floor(timeMinutes / (60 * 24));
    const hours = Math.floor((timeMinutes % (60 * 24)) / 60);
    const minutes = timeMinutes % 60;

    const result: string[] = [];

    if (days > 0) {
      result.push(`${days}d`);
    }

    if (hours) {
      result.push(`${hours}h`);
    }

    if (minutes) {
      result.push(`${minutes}m`);
    }

    return result.join(' ');
  }

  static compareDates(a: Date, b: Date): number {
    const d1 = new Date(a);
    const d2 = new Date(b);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);

    if (d1.valueOf() < d2.valueOf()) {
      return -1;
    }

    if (d1.valueOf() > d2.valueOf()) {
      return 1;
    }

    return 0;
  }

  static getDaysDelta(date1: Date, date2: Date): number {
    return Math.floor(Math.abs(date1.valueOf() - date2.valueOf()) / (1000 * 60 * 60 * 24));
  }

  static getWeekdays(locale: string): string[] {
    const date = new Date(2020, 4, 24);

    const result: string[] = [];

    for (let i = 0; i < 7; i += 1) {
      result.push(date.toLocaleDateString(locale, { weekday: 'long' }));
      date.setDate(date.getDate() + 1);
    }

    return result;
  }

  static getTimeDeltaFromMs(timeMs: number): string {
    return DateUtils.getDDHHMMFromMinutes(Math.floor(timeMs / (1000 * 60)));
  }

  static getTimeDelta(a: Date, b: Date): string {
    const delta = Math.abs(a.valueOf() - b.valueOf());

    return DateUtils.getTimeDeltaFromMs(delta);
  }

  static getTimeZoneDeltaMs(tz1?: string, tz2?: string): number | undefined {
    if (!(tz1 && tz2)) {
      return 0;
    }

    const date = new Date();
    const date1 = new Date(date.toLocaleString('sv-SE', { timeZone: tz1 }));
    const date2 = new Date(date.toLocaleString('sv-SE', { timeZone: tz2 }));

    return date2.valueOf() - date1.valueOf();
  }

  static getTimeZoneDelta(tz1?: string, tz2?: string): string | undefined {
    const timeDeltaMs = this.getTimeZoneDeltaMs(tz1, tz2);

    if (timeDeltaMs === undefined) {
      return undefined;
    }

    if (timeDeltaMs < 0) {
      return `-${DateUtils.getTimeDeltaFromMs(Math.abs(timeDeltaMs))}`;
    }

    return `+${DateUtils.getTimeDeltaFromMs(Math.abs(timeDeltaMs))}`;
  }

  static getHHMM(date: Date): string {
    return date.toLocaleTimeString('sv-SE').split(':').slice(0, 2).join(':');
  }

  static getDateString(date: Date): string {
    return date.toLocaleDateString('sv-SE');
  }

  static getFullDateString(date: Date): string {
    const strDate = date.toLocaleDateString('sv-SE');
    const strHours = this.getHHMM(date);

    return `${strDate} ${strHours}`;
  }

  static compareDatesSimple(a: Date, b: Date): boolean {
    return DateUtils.compareDates(a, b) === 0;
  }

  static compareDatesExact(a: Date, b: Date): number {
    const aVal = a.valueOf();
    const bVal = b.valueOf();

    if (aVal < bVal) {
      return -1;
    }

    if (aVal > bVal) {
      return 1;
    }

    return 0;
  }
}
