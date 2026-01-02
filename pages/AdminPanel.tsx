import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { adminService, AdminUser } from '../services/adminService';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, UserCheck, UserX, Search, Calendar, Plus, Loader2, AlertTriangle, CheckCircle, Mail, Phone, DollarSign, Eye, X } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

export const AdminPanel: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Estado para Modal de Adicionar Dias
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [viewingUser, setViewingUser] = useState<AdminUser | null>(null); // Novo: Estado para ver detalhes
    const [trialDays, setTrialDays] = useState(7);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        // Proteção Frontend Extra
        if (user && user.email !== 'othonbrian@gmail.com') {
            navigate('/');
            return;
        }

        loadData();
    }, [user, navigate]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await adminService.getDashboardData();
            setUsers(data);
        } catch (error: any) {
            console.error(error);
            showNotification(`Erro: ${error.message || error.error_description || 'Falha ao carregar dados'}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTrial = async () => {
        if (!selectedUser) return;
        setIsProcessing(true);
        try {
            await adminService.addTrialDays(selectedUser.user_id, trialDays);
            showNotification(`Adicionados ${trialDays} dias para ${selectedUser.name || selectedUser.email}`, 'success');
            setSelectedUser(null);
            loadData(); // Recarrega para ver atualização
        } catch (error) {
            showNotification('Erro ao adicionar dias.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredUsers = users.filter(u =>
        (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    // KPIs
    const totalUsers = users.length;
    const activePremium = users.filter(u => u.subscription_status === 'premium').length;
    const activeTrial = users.filter(u => u.subscription_status === 'trial').length;
    const expired = users.filter(u => u.subscription_status === 'expired' || !u.subscription_status).length; // Tratando null como expired/sem plano

    if (loading) return (
        <Layout title="Super Admin">
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-emerald-500 w-12 h-12" />
            </div>
        </Layout>
    );

    return (
        <Layout title="Painel Super Admin" showBack backPath="/">
            <div className="pb-20">
                {/* Header Section */}
                <div className="bg-slate-900 rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="text-emerald-400 w-8 h-8" />
                            <h2 className="text-2xl font-bold">Visão Geral do Sistema</h2>
                        </div>
                        <p className="text-slate-400">Gerenciamento completo de nutricionistas e assinaturas.</p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-500 text-sm font-bold uppercase">Total Usuários</span>
                            <Users size={20} className="text-blue-500" />
                        </div>
                        <div className="text-3xl font-black text-slate-800 dark:text-white">{totalUsers}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-500 text-sm font-bold uppercase">Ativos (Premium)</span>
                            <CheckCircle size={20} className="text-emerald-500" />
                        </div>
                        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{activePremium}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-500 text-sm font-bold uppercase">Em Teste</span>
                            <ClockIcon size={20} className="text-amber-500" />
                        </div>
                        <div className="text-3xl font-black text-amber-500">{activeTrial}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-500 text-sm font-bold uppercase">Expirados / Churn</span>
                            <UserX size={20} className="text-red-500" />
                        </div>
                        <div className="text-3xl font-black text-red-500">{expired}</div>
                    </div>
                </div>

                {/* Search & Actions */}
                <div className="mb-6 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 dark:text-slate-200"
                    />
                </div>

                {/* Users List */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase">Nutricionista</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase">Contato</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase">Status</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase">Validade</th>
                                    <th className="text-right py-4 px-6 text-xs font-bold text-slate-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredUsers.map(u => (
                                    <tr key={u.user_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                                    {u.logo_url ? (
                                                        <img src={u.logo_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="font-bold text-slate-500 text-xs">{u.name?.substring(0, 2).toUpperCase() || 'NU'}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white">{u.name || 'Sem Nome'}</div>
                                                    <div className="text-xs text-slate-500">ID: {u.user_id.substring(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                                                    <Mail size={14} className="text-slate-400" />
                                                    {u.email}
                                                </div>
                                                {u.phone && (
                                                    <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                                                        <Phone size={14} className="text-slate-400" />
                                                        {u.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <StatusBadge status={u.subscription_status} plan={u.plan_type} />
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm">
                                                {formatDate(u.plan_expiration_date || u.last_renewal || u.start_date)}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {u.start_date ? `Desde: ${new Date(u.start_date).toLocaleDateString()}` : 'Nunca acessou'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setViewingUser(u)}
                                                    className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors"
                                                    title="Ver Detalhes"
                                                >
                                                    <Eye size={20} />
                                                </button>
                                                <button
                                                    onClick={() => setSelectedUser(u)}
                                                    className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors inline-flex items-center gap-1"
                                                >
                                                    <Plus size={16} /> Add Dias
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredUsers.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            Nenhum usuário encontrado.
                        </div>
                    )}
                </div>

                {/* Add Days Modal */}
                {selectedUser && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Adicionar Dias de Teste</h3>
                            <p className="text-slate-500 mb-6">
                                Estender o período de trial para <span className="font-bold text-slate-700 dark:text-slate-300">{selectedUser.name || selectedUser.email}</span>.
                            </p>

                            <div className="space-y-4 mb-8">
                                <div className="grid grid-cols-3 gap-3">
                                    {[3, 7, 15, 30].map(days => (
                                        <button
                                            key={days}
                                            onClick={() => setTrialDays(days)}
                                            className={`py-2 rounded-xl border text-sm font-bold transition-all ${trialDays === days
                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
                                                }`}
                                        >
                                            +{days} Dias
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <Calendar className="text-slate-400" />
                                    <input
                                        type="number"
                                        value={trialDays}
                                        onChange={e => setTrialDays(Number(e.target.value))}
                                        className="bg-transparent outline-none w-full font-bold text-slate-700 dark:text-white"
                                    />
                                    <span className="text-sm text-slate-500 font-bold">Dias</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="flex-1 py-3 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddTrial}
                                    disabled={isProcessing}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* View Details Modal */}
                {viewingUser && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl p-0 shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
                            {/* Modal Header */}
                            <div className="bg-slate-50 dark:bg-slate-950 p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
                                        {viewingUser.logo_url ? (
                                            <img src={viewingUser.logo_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-bold text-slate-500 text-lg">{viewingUser.name?.substring(0, 2).toUpperCase() || 'NU'}</span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{viewingUser.name || 'Sem Nome'}</h3>
                                        <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                                            <Mail size={14} />
                                            {viewingUser.email}
                                        </div>
                                        {viewingUser.phone && (
                                            <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                                                <Phone size={14} />
                                                {viewingUser.phone}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => setViewingUser(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl">
                                    <X />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                                        <div className="text-blue-500 text-xs font-bold uppercase mb-1">Total de Pacientes</div>
                                        <div className="text-2xl font-black text-blue-700 dark:text-blue-400">{viewingUser.total_students || 0}</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
                                        <div className="text-emerald-500 text-xs font-bold uppercase mb-1">Pacientes Ativos</div>
                                        <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{viewingUser.active_students || 0}</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                        <div className="text-slate-500 text-xs font-bold uppercase mb-1">Inativos</div>
                                        <div className="text-2xl font-black text-slate-700 dark:text-slate-400">{(viewingUser.total_students || 0) - (viewingUser.active_students || 0)}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Informações da Assinatura</h4>
                                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                                        <div>
                                            <div className="text-slate-500">Status</div>
                                            <div className="font-medium text-slate-900 dark:text-white mt-1">
                                                <StatusBadge status={viewingUser.subscription_status} plan={viewingUser.plan_type} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-slate-500">Vencimento</div>
                                            <div className="font-medium text-slate-900 dark:text-white mt-1">
                                                {formatDate(viewingUser.plan_expiration_date || viewingUser.trial_end_date)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-slate-500">Última Renovação/Início</div>
                                            <div className="font-medium text-slate-900 dark:text-white mt-1">
                                                {formatDate(viewingUser.last_renewal)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-slate-500">ID do Usuário</div>
                                            <div className="font-mono text-xs text-slate-400 mt-1 truncate max-w-[150px]" title={viewingUser.user_id}>
                                                {viewingUser.user_id}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

// Helper Components
const StatusBadge = ({ status, plan }: { status: string, plan: string }) => {
    if (status === 'premium') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <DollarSign size={12} />
                Premium ({plan === 'yearly' ? 'Anual' : 'Mensal'})
            </span>
        );
    }
    if (status === 'trial') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <ClockIcon size={12} />
                Trial (Teste)
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <AlertTriangle size={12} />
            Expirado / Inativo
        </span>
    );
};

const ClockIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString('pt-BR');
};
