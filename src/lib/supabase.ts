import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

const g = globalThis as unknown as { __venkayamSupabase?: SupabaseClient };

export const getSupabase = (): SupabaseClient =>
  (g.__venkayamSupabase ??= createClient(`https://${projectId}.supabase.co`, publicAnonKey));

// Admin emails allowed past the login screen. Only these accounts can open the admin.
export const ADMIN_EMAILS: string[] = ["venkayam@gmail.com", "ashish.deo.tripathi@gmail.com"];
