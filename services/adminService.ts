import { supabase } from './supabase';

export interface AdminUser {
    user_id: string;
    email: string;
    name: string;
    phone: string;
    logo_url: string;
    subscription_status: string;
    plan_type: string;
    start_date: string;
    plan_expiration_date: string;
    last_renewal: string;
    total_students: number;
    active_students: number;
}

export const adminService = {
    // Busca dados de todos os usuários (Apenas para o Super Admin)
    getDashboardData: async (): Promise<AdminUser[]> => {
        const { data, error } = await supabase.rpc('get_admin_dashboard_data');
        if (error) {
            console.error('Erro ao buscar dados do admin:', error);
            throw error;
        }
        return data || [];
    },

    // Adiciona dias de teste para um usuário específico
    addTrialDays: async (userId: string, days: number): Promise<void> => {
        const { error } = await supabase.rpc('admin_add_trial_days', {
            target_user_id: userId,
            days_to_add: days
        });
        if (error) {
            console.error('Erro ao adicionar dias de teste:', error);
            throw error;
        }
    }
};
