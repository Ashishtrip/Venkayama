import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

export const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

// Admin emails allowed past the login screen. Leave empty to allow any signed-in account.
export const ADMIN_EMAILS: string[] = [];
