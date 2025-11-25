'use client';

import { useState, useEffect } from 'react';
import { reviewsApi, Review } from '@/lib/api';

export function useReviews(companyId?: number) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reviewsApi.getAll(companyId ? { company_id: companyId } : undefined);
      setReviews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const createReview = async (review: Omit<Review, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newReview = await reviewsApi.create(review);
      setReviews(prev => [newReview, ...prev]);
      return newReview;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create review');
      throw err;
    }
  };

  const updateReview = async (id: number, updates: Partial<Review>) => {
    try {
      const updatedReview = await reviewsApi.update(id, updates);
      setReviews(prev => prev.map(review => review.id === id ? updatedReview : review));
      return updatedReview;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update review');
      throw err;
    }
  };

  const deleteReview = async (id: number) => {
    try {
      await reviewsApi.delete(id);
      setReviews(prev => prev.filter(review => review.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete review');
      throw err;
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [companyId]);

  return {
    reviews,
    loading,
    error,
    refetch: fetchReviews,
    createReview,
    updateReview,
    deleteReview,
  };
}

export function useReview(id: number) {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchReview(id);
    }
  }, [id]);

  const fetchReview = async (reviewId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await reviewsApi.getById(reviewId);
      setReview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch review');
    } finally {
      setLoading(false);
    }
  };

  return { review, loading, error, refetch: () => fetchReview(id) };
}
