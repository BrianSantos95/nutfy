-- ==========================================
-- SUPER ADMIN SETUP FOR NUTY
-- ==========================================
-- Este script cria funções seguras para o painel administrativo.
-- Ele garante que APENAS o usuário 'othonbrian@gmail.com' possa acessar esses dados.

-- 1. Função para Obter Dados do Dashboard (Nutricionistas + Assinaturas)
CREATE OR REPLACE FUNCTION get_admin_dashboard_data()
RETURNS TABLE (
    user_id UUID,
    email VARCHAR,
    name TEXT,
    phone TEXT,
    logo_url TEXT,
    subscription_status TEXT,
    plan_type TEXT,
    start_date TIMESTAMPTZ,
    plan_expiration_date TIMESTAMPTZ,
    last_renewal TIMESTAMPTZ
) 
SECURITY DEFINER
AS $$
BEGIN
    -- Verificação de Segurança Rígida
    IF auth.jwt() ->> 'email' <> 'othonbrian@gmail.com' THEN
        RAISE EXCEPTION 'Acesso negado: Apenas administradores.';
    END IF;

    RETURN QUERY
    SELECT 
        u.id as user_id,
        (u.email)::VARCHAR as email,
        p.name,
        (u.raw_user_meta_data ->> 'phone')::TEXT as phone, -- Tenta pegar telefone do auth user metadata
        p.logo_url,
        s.status::TEXT as subscription_status,
        s.plan_type::TEXT,
        s.start_date,
        s.plan_expiration_date,
        s.start_date as last_renewal -- Assumindo start_date como última renovação por enquanto
    FROM 
        auth.users u
    LEFT JOIN 
        public.profiles p ON u.id = p.user_id
    LEFT JOIN 
        public.subscriptions s ON u.id = s.user_id
    ORDER BY 
        s.start_date DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- 2. Função para Adicionar Dias de Teste
CREATE OR REPLACE FUNCTION admin_add_trial_days(target_user_id UUID, days_to_add INT)
RETURNS VOID
SECURITY DEFINER
AS $$
DECLARE
    current_trial_end TIMESTAMPTZ;
BEGIN
    -- Verificação de Segurança Rígida
    IF auth.jwt() ->> 'email' <> 'othonbrian@gmail.com' THEN
        RAISE EXCEPTION 'Acesso negado: Apenas administradores.';
    END IF;

    -- Busca data atual de fim de teste
    SELECT trial_end_date INTO current_trial_end FROM public.subscriptions WHERE user_id = target_user_id;

    -- Se não existir subscrição, cria uma trial
    IF NOT FOUND THEN
        INSERT INTO public.subscriptions (user_id, status, plan_type, trial_end_date, start_date)
        VALUES (target_user_id, 'trial', 'monthly', NOW() + (days_to_add || ' days')::INTERVAL, NOW());
    ELSE
        -- Atualiza existente. Se já venceu, soma a partir de agora. Se não, soma ao final.
        IF current_trial_end < NOW() THEN
            current_trial_end := NOW();
        END IF;

        UPDATE public.subscriptions
        SET 
            trial_end_date = current_trial_end + (days_to_add || ' days')::INTERVAL,
            status = 'trial', -- Força status trial
            plan_expiration_date = NULL -- Limpa expiração de plano pago se houver, para evitar confusão
        WHERE user_id = target_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Comentário Final
-- Execute este script na aba 'SQL Editor' do seu painel Supabase.
