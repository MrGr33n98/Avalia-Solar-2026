import { Category } from '@/lib/api';
import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';

export async function getCategoryById(id: number): Promise<Category | null> {
  try {
    const response = await fetch(buildApiUrl(`categories/${id}`), {
      headers: getApiRequestHeaders(),
    });
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
    const response = await fetch(buildApiUrl(`categories/by_slug/${slug}`), {
      headers: getApiRequestHeaders(),
    });
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
