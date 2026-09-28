import { createClient } from '@supabase/supabase-js';

// TODO: BẠN HÃY COPY URL VÀ ANON KEY TỪ SUPABASE DÁN VÀO ĐÂY NHÉ
const supabaseUrl = 'https://dwmkvkytfgfvvhjxqwpl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3bWt2a3l0ZmdmdnZoanhxd3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNDgyODIsImV4cCI6MjEwNTkyNDI4Mn0.lwdPEM8OUl4nOe8k1TYtOTTlkbU_qNZgUBEX6m5uT1U';

// Khởi tạo client kết nối với PostgreSQL của Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
