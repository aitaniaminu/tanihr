import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://glafsagdgepfvxtekqrw.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ydI_X0Y4JAerihIzaK_pjA_BfbuabN7'

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

export { supabase }
export default supabase