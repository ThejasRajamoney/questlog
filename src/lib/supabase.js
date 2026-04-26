import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function createNoopQueryBuilder() {
  const error = { message: 'Supabase is not configured.' };

  const builder = {
    select() { return builder; },
    eq() { return builder; },
    order() { return builder; },
    limit() { return builder; },
    delete() { return builder; },
    then(onFulfilled) {
      return Promise.resolve({ data: null, error }).then(onFulfilled);
    },
    maybeSingle: async () => ({ data: null, error }),
    insert: async () => ({ data: null, error }),
    upsert: async () => ({ data: null, error }),
  };

  return builder;
}

function createNoopSupabase() {
  const error = { message: 'Supabase is not configured.' };

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error }),
      signUp: async () => ({ data: { user: null, session: null }, error }),
      signOut: async () => ({ error }),
    },
    from: () => createNoopQueryBuilder(),
  };
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createNoopSupabase();
