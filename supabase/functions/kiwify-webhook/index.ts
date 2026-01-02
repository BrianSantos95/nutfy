// Setup:
// 1. Instale o Supabase CLI: npm install -g supabase
// 2. Login: supabase login
// 3. Deploy: supabase functions deploy kiwify-webhook --no-verify-jwt
// 4. Configure os Secrets: supabase secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
    try {
        // 1. Verificar método
        if (req.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 })
        }

        // 2. Pegar Payload do Kiwify
        const payload = await req.json();
        console.log("Recebido Webhook Kiwify:", payload);

        // Tipos de evento: order_approved, subscription_renewed, etc.
        const status = payload.order_status;

        // Apenas processa se estiver pago
        if (status !== 'paid') {
            return new Response(JSON.stringify({ message: 'Order not paid', status }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        // 3. Inicializar Supabase Admin (Bypass RLS)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 4. Buscar Usuário pelo Email da Compra
        const email = payload.Customer.email;
        if (!email) throw new Error("Email não fornecido no payload");

        // Procura na tabela auth.users (precisa de Service Role)
        // Nota: listUsers pode ser lento se tiver milhões, mas é o jeito oficial via admin api
        // Alternativa: Fazer um select na tabela profiles se email estiver lá, ou criar uma RPC.
        // Vamos usar uma query direta no DB via RPC para ser mais rápido ou searchUser

        // Tentativa 1: Buscar usuário existente
        const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();
        const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

        if (!user) {
            console.log(`Usuário não encontrado para o email: ${email}`);
            // Opcional: Criar usuário ou guardar em uma tabela de "vendas pendentes"
            return new Response(JSON.stringify({ message: 'User not found, subscription pending registration' }), { status: 200 });
        }

        // 5. Determinar Plano (Mensal ou Anual)
        // Você pode usar o Product ID do payload para diferenciar
        // Exemplo: payload.Product.product_id
        // Aqui vamos assumir uma lógica simples ou default:

        // Lógica inteligente: Verifica o valor ou nome do produto
        let planType = 'monthly';
        const productName = payload.Product?.product_name?.toLowerCase() || '';
        if (productName.includes('anual') || payload.order_total > 10000) { // Ex: > R$ 100,00
            planType = 'yearly';
        }

        // 6. Atualizar Assinatura
        const startDate = new Date();
        const expiryDate = new Date();

        if (planType === 'yearly') {
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        } else {
            expiryDate.setMonth(expiryDate.getMonth() + 1);
        }

        const { error: upsertError } = await supabaseAdmin
            .from('subscriptions')
            .upsert({
                user_id: user.id,
                status: 'premium',
                plan_type: planType,
                start_date: startDate.toISOString(),
                plan_expiration_date: expiryDate.toISOString(),
                trial_end_date: null // Remove trial se virou premium
            }, { onConflict: 'user_id' });

        if (upsertError) throw upsertError;

        console.log(`Assinatura atualizada para ${email} (${user.id}) - Plano ${planType}`);

        return new Response(JSON.stringify({ message: 'Subscription updated successfully' }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        })

    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        })
    }
})
