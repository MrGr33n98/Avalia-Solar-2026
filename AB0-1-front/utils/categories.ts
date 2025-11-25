import { Category } from '@/lib/api';

export async function getCategoryById(id: number): Promise<Category | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`API call failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data as Category;
  } catch (error) {
    console.error(`Failed to fetch category with id ${id}:`, error);
    return null;
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/by_slug/${slug}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`API call failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data as Category;
  } catch (error) {
    console.error(`Failed to fetch category with slug ${slug}:`, error);
    return null;
  }
}