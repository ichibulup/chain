import { z } from 'zod';

export type SearchType = 'menuItem' | 'restaurant' | 'ingredient';

const SearchTypesSchema = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const items = value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    return items.length > 0 ? items : undefined;
  }
  return undefined;
}, z.array(z.enum(['menuItem', 'restaurant', 'ingredient'])).min(1).optional());

export const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  types: SearchTypesSchema,
  categoryId: z.string().uuid().optional(),
  menuId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  chainId: z.string().uuid().optional(),
  restaurantStatus: z.enum(['active', 'inactive', 'maintenance', 'closed']).optional(),
  inventoryCategory: z.string().min(1).optional(),
  onlyActive: z.coerce.boolean().default(true).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;
