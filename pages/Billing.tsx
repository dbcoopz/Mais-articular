import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Euro, TrendingUp, TrendingDown, Download, MessageSquare, Clock, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import subMonths from 'date-fns/subMonths';
import { UserRole } from '../types';
import pt from 'date-fns/locale/pt';
import { Modal } from '../components/ui/Modal';

export const Billing: React.FC = () => {
  const { sessions, users, currentUser, patients } = useApp();
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const [detailsModal, setDetailsModal] = useState<string | null>(null);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Filter sessions based on role
  const relevantSessions = isAdmin 
    ? sessions 
    : sessions.filter(s => s.therapistId === currentUser?.id);

  const monthSessions = relevantSessions.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Metrics setup
  let metric1, metric2, metric3;

  if (isAdmin) {
      const totalRevenue = monthSessions.reduce((acc, s) => acc + s.cost, 0);
      const totalTherapistCost = monthSessions.reduce((acc, s) => acc + s.therapistPayment, 0);
      const profit = totalRevenue - totalTherapistCost;

      metric1 = { id: 'revenue', title: 'Receita Total', value: `€${totalRevenue.toFixed(2)}`, icon: Euro, color: 'bg-green-100 text-green-600', subtitle: 'Receita da clínica' };
      metric2 = { id: 'payments', title: 'Pagamentos a Terapeutas', value: `€${totalTherapistCost.toFixed(2)}`, icon: TrendingDown, color: 'bg-red-100 text-red-600', subtitle: 'Custos operacionais' };
      metric3 = { id: 'profit', title: 'Lucro Líquido', value: `€${profit.toFixed(2)}`, icon: TrendingUp, color: 'bg-blue-100 text-blue-600', subtitle: 'Após pagamentos' };
  } else {
      const myEarnings = monthSessions.reduce((acc, s) => acc + s.therapistPayment, 0);
      const sessionCount = monthSessions.length;
      const totalMinutes = monthSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;

      metric1 = { id: 'earnings', title: 'Meus Ganhos', value: `€${myEarnings.toFixed(2)}`, icon: Euro, color: 'bg-green-100 text-green-600', subtitle: 'Este mês' };
      metric2 = { id: 'sessions', title: 'Sessões Realizadas', value: sessionCount.toString(), icon: MessageSquare, color: 'bg-purple-100 text-purple-600', subtitle: 'Total de consultas' };
      metric3 = { id: 'duration', title: 'Duração Total', value: `${hours}h ${mins}m`, icon: Clock, color: 'bg-orange-100 text-orange-600', subtitle: 'Horas de terapia' };
  }

  // Chart Data Construction (Last 6 months)
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const sessionsInMonth = relevantSessions.filter(s => {
        const d = new Date(s.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });

    let value = 0;
    if (isAdmin) {
        value = sessionsInMonth.reduce((acc, s) => acc + s.cost, 0);
    } else {
        value = sessionsInMonth.reduce((acc, s) => acc + s.therapistPayment, 0);
    }

    chartData.push({
        name: format(date, 'MMM', { locale: pt }),
        valor: value
    });
  }

  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'Desconhecido';
  const getTherapistName = (id: string) => users.find(u => u.id === id)?.name || 'Desconhecido';

  // Helpers for Sidebar Stats
  const therapistStats = users.filter(u => u.role === UserRole.THERAPIST).map(t => {
      const tSessions = monthSessions.filter(s => s.therapistId === t.id);
      const tRevenue = tSessions.reduce((acc, s) => acc + s.cost, 0);
      return { id: t.id, name: t.name, revenue: tRevenue, count: tSessions.length };
  }).sort((a,b) => b.revenue - a.revenue);

  const topPatients = patients
    .filter(p => isAdmin || p.therapistId === currentUser?.id)
    .map(p => {
        const pSessions = monthSessions.filter(s => s.patientId === p.id);
        return { id: p.id, name: p.name, count: pSessions.length };
    })
    .filter(p => p.count > 0)
    .sort((a,b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
             <h1 className="text-2xl font-bold text-[#1e3a5f]">Faturação</h1>
             <p className="text-gray-500">Visão geral financeira - {format(new Date(), 'MMMM yyyy', { locale: pt })}</p>
         </div>
         {isAdmin && (
            <Button variant="outline">
                <Download size={18} className="mr-2" /> Exportar Relatório
            </Button>
         )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[metric1, metric2, metric3].map((m, idx) => (
              <div 
                key={idx} 
                onClick={() => setDetailsModal(m.id)}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all"
              >
                  <div className="flex items-center justify-between mb-4">
                      <div className={`p-2 rounded-lg ${m.color}`}>
                          <m.icon size={24}/>
                      </div>
                      <span className="text-xs font-medium text-gray-400">Este mês</span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">{m.value}</h3>
                  <p className="text-sm text-gray-500 mt-1">{m.title}</p>
              </div>
          ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                  {isAdmin ? 'Evolução da Receita (6 Meses)' : 'Evolução dos Ganhos (6 Meses)'}
              </h3>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                          <defs>
                              <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip formatter={(value: number) => [`€${value.toFixed(2)}`, isAdmin ? 'Receita' : 'Ganhos']} />
                          <Area type="monotone" dataKey="valor" stroke="#1e3a5f" fillOpacity={1} fill="url(#colorValor)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                  {isAdmin ? 'Desempenho por Terapeuta (Mês Atual)' : 'Top Pacientes (Mês Atual)'}
              </h3>
               
               {isAdmin ? (
                   <div className="space-y-4">
                       {therapistStats.length === 0 ? (
                           <p className="text-gray-500 text-center py-8">Sem dados.</p>
                       ) : (
                           therapistStats.map(t => (
                               <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                   <div className="flex items-center gap-3">
                                       <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                           {t.name.charAt(0)}
                                       </div>
                                       <div>
                                           <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                                           <p className="text-xs text-gray-500">{t.count} sessões</p>
                                       </div>
                                   </div>
                                   <p className="font-bold text-[#1e3a5f]">€{t.revenue.toFixed(2)}</p>
                               </div>
                           ))
                       )}
                   </div>
               ) : (
                   <div className="space-y-4">
                       {topPatients.length === 0 ? (
                           <p className="text-gray-500 text-center py-8">Sem dados.</p>
                       ) : (
                           topPatients.map(p => (
                               <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                   <div className="flex items-center gap-3">
                                       <div className="h-8 w-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">
                                           {p.name.charAt(0)}
                                       </div>
                                       <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                                   </div>
                                   <p className="font-bold text-gray-700">{p.count} sessões</p>
                               </div>
                           ))
                       )}
                   </div>
               )}
          </div>
      </div>

      {/* Detail Modal */}
      <Modal 
        isOpen={!!detailsModal} 
        onClose={() => setDetailsModal(null)} 
        title={
            detailsModal === 'revenue' ? 'Detalhe de Receita' :
            detailsModal === 'payments' ? 'Pagamentos a Terapeutas' :
            detailsModal === 'profit' ? 'Análise de Lucro' :
            detailsModal === 'earnings' ? 'Meus Ganhos Detalhados' : 'Detalhes'
        }
        maxWidth="lg"
      >
          <div className="overflow-y-auto max-h-[60vh]">
              <div className="min-w-[500px]"> {/* Force horizontal scroll if table is too wide */}
                  <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                          <tr>
                              <th className="p-3 text-gray-700">Data</th>
                              <th className="p-3 text-gray-700">Paciente</th>
                              {isAdmin && <th className="p-3 text-gray-700">Terapeuta</th>}
                              <th className="p-3 text-right text-gray-700">Valor</th>
                          </tr>
                      </thead>
                      <tbody>
                          {monthSessions.map(s => {
                              let value = 0;
                              if (detailsModal === 'revenue') value = s.cost;
                              else if (detailsModal === 'payments') value = s.therapistPayment;
                              else if (detailsModal === 'profit') value = s.cost - s.therapistPayment;
                              else if (detailsModal === 'earnings') value = s.therapistPayment;
                              else value = s.cost; // Fallback

                              return (
                                <tr key={s.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 text-gray-700">{format(new Date(s.date), 'dd/MM/yyyy')}</td>
                                    <td className="p-3 font-medium text-[#1e3a5f]">{getPatientName(s.patientId)}</td>
                                    {isAdmin && <td className="p-3 text-gray-700">{getTherapistName(s.therapistId)}</td>}
                                    <td className="p-3 text-right text-gray-700 font-medium">€{value.toFixed(2)}</td>
                                </tr>
                              );
                          })}
                          <tr className="bg-gray-50 font-bold">
                              <td colSpan={isAdmin ? 3 : 2} className="p-3 text-right text-gray-900">Total Listado:</td>
                              <td className="p-3 text-right text-gray-900">
                                 €{monthSessions.reduce((acc, s) => {
                                      let value = 0;
                                      if (detailsModal === 'revenue') value = s.cost;
                                      else if (detailsModal === 'payments') value = s.therapistPayment;
                                      else if (detailsModal === 'profit') value = s.cost - s.therapistPayment;
                                      else if (detailsModal === 'earnings') value = s.therapistPayment;
                                      else value = s.cost;
                                      return acc + value;
                                 }, 0).toFixed(2)}
                              </td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </div>
          <div className="flex justify-end pt-4">
               <Button variant="secondary" onClick={() => setDetailsModal(null)}>Fechar</Button>
          </div>
      </Modal>
    </div>
  );
};