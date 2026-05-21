/**
 * Format a user name to "NOM Prénom" convention.
 * Assumes last word = surname (NOM, all caps), rest = given name (Prénom, capitalized).
 * Examples: "Jean Dupont" → "DUPONT Jean", "marie pierre leblanc" → "LEBLANC Marie Pierre"
 */
export function formatUserName(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].toUpperCase();
  const lastName = parts[parts.length - 1].toUpperCase();
  const firstName = parts
    .slice(0, -1)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
  return `${firstName} ${lastName}`;
}
