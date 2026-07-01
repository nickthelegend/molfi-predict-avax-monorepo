/**
 * Re-exports the Supabase client cast as `any` to bypass empty type definitions
 * from the auto-generated types.ts when using an external Supabase instance.
 * 
 * Usage: Replace `import { supabase } from "@/integrations/supabase/client"`
 *   with `import { supabase } from "@/integrations/supabase/db"`
 */
import { supabase as typedSupabase } from "./client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = typedSupabase as any;
