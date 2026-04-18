export const getDeleteFilter = (query) => {
  const active = query.active;
  if (active === 'false') return { isDeleted: true };
  if (active === 'all') return {};
  return { isDeleted: { $ne: true } };
};
