import { z } from 'zod';

// --- Entités de base ---

const BoardSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1, 'Le titre du projet est requis').max(500),
}).passthrough();

const ColumnSchema = z.object({
  id: z.number().int().positive(),
  board_id: z.number().int().positive(),
  title: z.string().min(1).max(200),
  position: z.number().int().nonnegative().optional(),
}).passthrough();

const CardSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1, 'Le titre de la carte est requis').max(500),
}).passthrough();

const CategorySchema = z.object({
  id: z.number().int().positive(),
  card_id: z.number().int().nonnegative().nullable().optional(),
  title: z.string().min(1).max(500),
}).passthrough();

const SubcategorySchema = z.object({
  id: z.number().int().positive(),
  category_id: z.number().int().positive(),
  title: z.string().min(1).max(500),
  priority: z.enum(['urgent', 'high', 'normal', 'low', 'waiting', 'done']).optional(),
  status: z.enum(['todo', 'in_progress', 'done', 'waiting', 'blocked']).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  duration_days: z.number().nonnegative().optional(),
}).passthrough();

// --- Structure core v2.0 ---

const CoreDbSchema = z.object({
  boards: z.array(BoardSchema),
  columns: z.array(ColumnSchema).optional().default([]),
  cards: z.array(CardSchema).optional().default([]),
  categories: z.array(CategorySchema).optional().default([]),
  subcategories: z.array(SubcategorySchema).optional().default([]),
}).passthrough();

// --- Format v2.0 ---

const ImportV2Schema = z.object({
  version: z.literal('2.0'),
  exportedAt: z.string().optional(),
  databases: z.object({
    core: CoreDbSchema,
  }).passthrough(),
}).passthrough();

// --- Format v1.0 (legacy) ---

const ImportV1Schema = z.object({
  version: z.literal('1.0'),
  data: z.object({
    boards: z.array(BoardSchema).optional().default([]),
    cards: z.array(CardSchema).optional().default([]),
  }).passthrough().optional(),
}).passthrough();

// --- Format inconnu (tolerant) ---

const ImportUnknownSchema = z.object({
  version: z.string(),
}).passthrough();

// --- Schéma principal (union des versions) ---

const ImportDataSchema = z.union([ImportV2Schema, ImportV1Schema, ImportUnknownSchema]);

/**
 * Valide les données importées avec zod.
 * Retourne le même format que l'ancienne validateImportData pour compatibilité.
 */
export function validateImportDataWithSchema(data) {
  const errors = [];
  const warnings = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Données manquantes ou format invalide'], warnings, version: null };
  }

  const version = data.version || '1.0';

  // Validation structurelle par version
  if (version === '2.0') {
    const result = ImportV2Schema.safeParse(data);
    if (!result.success) {
      const issues = result.error.issues;
      issues.forEach(issue => {
        const path = issue.path.join('.');
        errors.push(path ? `${path}: ${issue.message}` : issue.message);
      });
    } else {
      // Vérifications de cohérence sur les données valides
      const core = result.data.databases.core;
      if (!core.boards || core.boards.length === 0) {
        warnings.push('Aucun projet trouvé dans les données');
      }
      const boardIds = new Set((core.boards || []).map(b => b.id));
      (core.columns || []).forEach(col => {
        if (!boardIds.has(col.board_id)) {
          warnings.push(`Colonne ${col.id} référence un projet inexistant (board_id: ${col.board_id})`);
        }
      });
    }
  } else if (version === '1.0') {
    const result = ImportV1Schema.safeParse(data);
    if (!result.success) {
      const issues = result.error.issues;
      issues.forEach(issue => {
        const path = issue.path.join('.');
        warnings.push(path ? `${path}: ${issue.message}` : issue.message);
      });
    }
    if (!data.data?.boards || data.data.boards.length === 0) {
      warnings.push('Aucun projet trouvé dans les données v1.0');
    }
  } else {
    warnings.push(`Version inconnue "${version}" — import tenté sans garantie`);
  }

  return {
    valid: errors.length === 0,
    version,
    errors,
    warnings,
  };
}
