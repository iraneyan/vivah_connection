import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Category } from '@/lib/types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (active && data) setCategories(data as Category[]);
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { categories, loading };
}
