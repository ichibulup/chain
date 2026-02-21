import { MenuItem } from '@/models/menu';
import { InventoryItem } from '@/models/inventory';
import { Restaurant } from '@/models/organization';
import { SearchQuery, SearchType } from '@/schemas/search';
import { CategoryShortly, MenuShortly, OrganizationShortly } from '@/lib/interfaces';

type PagedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const resolveTypes = (types?: SearchType[]) => {
  if (types && types.length > 0) {
    return types;
  }
  return ['menuItem', 'restaurant', 'ingredient'] as SearchType[];
};

const buildEmptyResult = <T>(page: number, limit: number): PagedResult<T> => ({
  data: [],
  total: 0,
  page,
  limit,
  totalPages: 0,
});

export const searchAll = async (query: SearchQuery) => {
  const {
    q,
    types,
    categoryId,
    menuId,
    organizationId,
    chainId,
    restaurantStatus,
    inventoryCategory,
    onlyActive = true,
    page,
    limit,
  } = query;

  const activeTypes = resolveTypes(types);
  const skip = (page - 1) * limit;

  const shouldSearchMenuItems = activeTypes.includes('menuItem');
  const shouldSearchRestaurants = activeTypes.includes('restaurant');
  const shouldSearchIngredients = activeTypes.includes('ingredient');

  const menuItemPromise = shouldSearchMenuItems
    ? await (async () => {
      const where: any = {};

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (menuId) {
        where.menuId = menuId;
      }

      if (organizationId) {
        where.menu = { organizationId };
      }

      if (onlyActive) {
        where.isAvailable = true;
      }

      if (q) {
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ];
      }

      const [data, total] = await Promise.all([
        MenuItem.findMany({
          where,
          include: {
            category: {
              select: CategoryShortly,
            },
            menu: {
              select: MenuShortly,
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
          skip,
          take: limit,
        }),
        MenuItem.count({ where }),
      ]);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      } as PagedResult<typeof data[number]>;
    })()
    : Promise.resolve(buildEmptyResult(page, limit));

  const restaurantPromise = shouldSearchRestaurants
    ? await (async () => {
      const where: any = {};

      if (organizationId) {
        where.organizationId = organizationId;
      }

      if (chainId) {
        where.chainId = chainId;
      }

      if (restaurantStatus) {
        where.status = restaurantStatus;
      } else if (onlyActive) {
        where.status = 'active';
      }

      if (q) {
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { code: { contains: q, mode: 'insensitive' } },
          { address: { contains: q, mode: 'insensitive' } },
          { phoneNumber: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ];
      }

      const [data, total] = await Promise.all([
        Restaurant.findMany({
          where,
          include: {
            organization: {
              select: OrganizationShortly,
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
          skip,
          take: limit,
        }),
        Restaurant.count({ where }),
      ]);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      } as PagedResult<typeof data[number]>;
    })()
    : Promise.resolve(buildEmptyResult(page, limit));

  const ingredientPromise = shouldSearchIngredients
    ? await (async () => {
      const where: any = {};

      if (organizationId) {
        where.organizationId = organizationId;
      }

      if (inventoryCategory) {
        where.category = inventoryCategory;
      }

      if (onlyActive) {
        where.isActive = true;
      }

      if (q) {
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { barcode: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
        ];
      }

      const [data, total] = await Promise.all([
        InventoryItem.findMany({
          where,
          include: {
            organization: {
              select: OrganizationShortly,
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
          skip,
          take: limit,
        }),
        InventoryItem.count({ where }),
      ]);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      } as PagedResult<typeof data[number]>;
    })()
    : Promise.resolve(buildEmptyResult(page, limit));

  const [menuItems, restaurants, ingredients] = await Promise.all([
    menuItemPromise,
    restaurantPromise,
    ingredientPromise,
  ]);

  return {
    menuItems,
    restaurants,
    ingredients,
  };
};
