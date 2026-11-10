import { createApi } from "@trailmark/core";
import { supabase } from "./supabase";

export const api = createApi(supabase);
