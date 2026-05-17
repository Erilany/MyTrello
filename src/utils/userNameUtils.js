export const formatUserNameToDisplay = name => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].toUpperCase();
  const lastName = parts[parts.length - 1].toUpperCase();
  const firstName = parts
    .slice(0, -1)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
  return `${firstName} ${lastName}`;
};
