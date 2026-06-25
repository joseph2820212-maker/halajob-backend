function firstFacetDocument(result) {
  const value = Array.isArray(result) ? result[0] : result;
  return value && typeof value === "object" ? value : {};
}

function firstCountDocument(result) {
  const value = Array.isArray(result) ? result[0] : result;
  return value && typeof value === "object" ? value : {};
}

function appliedAtTime(item) {
  const value = item?.applied_at || item?.createdAt || item?.created_at || 0;
  return new Date(value).getTime() || 0;
}

export function buildCampusApplicationPage({
  internalAgg,
  outsideRows,
  outsideTotalResult,
  skip,
  limit,
}) {
  const internalFacet = firstFacetDocument(internalAgg);
  const internalItems = Array.isArray(internalFacet.items)
    ? internalFacet.items
    : [];
  const internalTotal = Number(internalFacet.meta?.[0]?.total || 0);
  const externalItems = Array.isArray(outsideRows) ? outsideRows : [];
  const outsideTotalDoc = firstCountDocument(outsideTotalResult);
  const outsideTotal = Number(outsideTotalDoc.total || 0);

  const normalizedSkip = Math.max(0, Number(skip || 0));
  const normalizedLimit = Math.max(1, Number(limit || 10));
  const combinedItems = [...internalItems, ...externalItems]
    .sort((a, b) => appliedAtTime(b) - appliedAtTime(a))
    .slice(normalizedSkip, normalizedSkip + normalizedLimit);

  return {
    items: combinedItems,
    total: internalTotal + outsideTotal,
  };
}
