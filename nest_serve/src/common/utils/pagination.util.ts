export interface PageResult<T> {
  total: number;
  items: T[];
}

/**
 * 统一列表分页返回结构，避免各业务模块重复拼装 { total, items }。
 */
export function toPageResult<TSource, TItem = TSource>(
  rows: TSource[],
  total: number,
  mapper?: (row: TSource) => TItem,
): PageResult<TItem> {
  return {
    total: Number.isFinite(total) ? total : 0,
    items: mapper ? rows.map(mapper) : (rows as unknown as TItem[]),
  };
}
