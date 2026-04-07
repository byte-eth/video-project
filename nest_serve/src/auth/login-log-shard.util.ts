/** 国内自然月：按 Asia/Shanghai 日历年月切分，与业务日界一致 */
const LOGIN_LOG_TZ = 'Asia/Shanghai';

export function shanghaiCalendarYearMonth(d: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: LOGIN_LOG_TZ,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(d);
  const year = Number(parts.find((p) => p.type === 'year')!.value);
  const month = Number(parts.find((p) => p.type === 'month')!.value);
  return { year, month };
}

export function loginLogTableName(d = new Date()): string {
  const { year, month } = shanghaiCalendarYearMonth(d);
  return `login_logs_${year}_${String(month).padStart(2, '0')}`;
}

/** 上海时区下的「下一自然月」对应分表名（用于预建表） */
export function loginLogTableNameNextShanghaiMonth(d = new Date()): string {
  let { year, month } = shanghaiCalendarYearMonth(d);
  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `login_logs_${year}_${String(month).padStart(2, '0')}`;
}
