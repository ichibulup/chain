// =========================
// HELPER FUNCTIONS
// =========================

import { Category, Menu, MenuItem } from "@/models/menu";
import { InventoryItem, Warehouse } from "@/models/inventory";
import { Organization, Restaurant, User } from "@/models/organization";
import { Supplier } from "@/models/supply";
import { httpError } from "@/middlewares/error";

/**
 * Check if user exists
 */
export const checkUserExists = async (id: string): Promise<boolean> => {
  try {
    const user = await User.findUnique({
      where: { id, },
      select: { id: true }
    });

    const supabaseUser = await User.findUnique({
      where: { supabaseUserId: id, },
      select: { supabaseUserId: true }
    });

    return !!user || !!supabaseUser;
  } catch (error) {
    console.error('Error checking user existence:', error);
    throw error;
  }
};

/**
 * Check if organization exists
 */
export const checkOrganizationExists = async (id: string) => {
  try {
    const organization = await Organization.findUnique({
      where: { id },
      // select: { id: true },
    });
    return !!organization;
  } catch (error) {
    console.error('Error checking organization existence:', error);
    return false;
  }
};

/**
 * Check if restaurant exists
 */
export const checkRestaurantExists = async (id: string): Promise<boolean> => {
  try {
    const restaurant = await Restaurant.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!restaurant;
  } catch (error) {
    return false;
  }
};

/**
 * Check if supplier exists
 */
export const checkSupplierExists = async (id: string): Promise<boolean> => {
  try {
    const supplier = await Supplier.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!supplier;
  } catch (error) {
    console.error('Error checking supplier existence:', error);
    return false;
  }
};

/**
 * Check if warehouse exists
 */
export const checkWarehouseExists = async (id: string): Promise<boolean> => {
  try {
    const warehouse = await Warehouse.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!warehouse;
  } catch (error) {
    console.error('Error checking warehouse existence:', error);
    return false;
  }
};

/**
 * Check if inventory item exists
 */
export const checkInventoryItemExists = async (id: string): Promise<boolean> => {
  try {
    const item = await InventoryItem.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!item;
  } catch (error) {
    console.error('Error checking inventory item existence:', error);
    return false;
  }
};

/**
 * Check if menu item exists
 */
export const checkMenuItemExists = async (id: string): Promise<boolean> => {
  try {
    const menuItem = await MenuItem.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!menuItem;
  } catch (error) {
    console.error('Error checking menu item existence:', error);
    return false;
  }
};

/**
 * Check if menu exists
 */
export const checkMenuExists = async (id: string): Promise<boolean> => {
  try {
    const menu = await Menu.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!menu;
  } catch (error) {
    console.error('Error checking menu existence:', error);
    return false;
  }
};

/**
 * Check if category exists
 */
export const checkCategoryExists = async (id: string): Promise<boolean> => {
  try {
    const category = await Category.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!category;
  } catch (error) {
    console.error('Error checking category existence:', error);
    return false;
  }
};
