import { createApi } from "@trailmark/core";
import { supabase } from "./supabase";

/** Database API bound to the web Supabase client. */
export const api = createApi(supabase);
