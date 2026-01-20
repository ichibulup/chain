import { prisma } from '@/lib/prisma';

export const Category = prisma.category
export const Menu = prisma.menu
export const MenuItem = prisma.menuItem
export const Recipe = prisma.recipe
export const RecipeIngredient = prisma.recipeIngredient
export const OptionGroup = prisma.optionGroup
export const Option = prisma.option
export const MenuItemOptionGroup = prisma.menuItemOptionGroup
