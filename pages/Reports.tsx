import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FileText, Download, Users, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { UserRole } from '../types';

export const Reports: React.FC = () => {
  const { sessions, patients, users } = useApp();
  const [reportType, setReportType] = useState('therapists');
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Calculate data based on selection
  const reportData = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filteredSessions = sessions.filter(s => {
        const d = new Date(s.date);
        return d >= start && d <= end;
    });

    if (reportType === 'therapists') {
        const therapists = users.filter(u => u.role === UserRole.THERAPIST);
        return therapists.map(t => {
            const tSessions = filteredSessions.filter(s => s.therapistId === t.id);
            const revenue = tSessions.reduce((acc, s) => acc + s.cost, 0);
            const earnings = tSessions.reduce((acc, s) => acc + s.therapistPayment, 0);
            return {
                id: t.id,
                name: t.name,
                count: tSessions.length,
                revenue: revenue,
                earnings: earnings,
                profit: revenue - earnings
            };
        }).sort((a, b) => b.revenue - a.revenue); // Sort by revenue desc
    }

    return filteredSessions;
  }, [sessions, users, reportType, startDate, endDate]);

  const handleDownload = () => {
      let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM for Excel unicode support

      if (reportType === 'therapists') {
          // Header
          csvContent += "Nome do Terapeuta;Sessões Realizadas;Receita Gerada (€);Pagamento Terapeuta (€);Lucro Clínica (€)\n";
          
          // Rows
          (reportData as any[]).forEach(row => {
              const line = `${row.name};${row.count};${row.revenue.toFixed(2).replace('.', ',')};${row.earnings.toFixed(2).replace('.', ',')};${row.profit.toFixed(2).replace('.', ',')}`;
              csvContent += line + "\n";
          });
          
          // Footer
          const totalRevenue = (reportData as any[]).reduce((acc, r) => acc + r.revenue, 0);
          const totalSessions = (reportData as any[]).reduce((acc, r) => acc + r.count, 0);
          csvContent += `TOTAL;${totalSessions};${totalRevenue.toFixed(2).replace('.', ',')};;\n`;

      } else if (reportType === 'sessions') {
          csvContent += "Data;Paciente;Terapeuta;Atividades;Valor (€)\n";
          (reportData as any[]).forEach(s => {
              const p = patients.find(p => p.id === s.patientId)?.name || 'N/A';
              const t = users.find(u => u.id === s.therapistId)?.name || 'N/A';
              const line = `${s.date};${p};${t};"${s.activities.replace(/"/g, '""')}";${s.cost.toFixed(2).replace('.', ',')}`;
              csvContent += line + "\n";
          });
      } else if (reportType === 'patients') {
          csvContent += "Nome;Idade;Responsável;Telefone;Estado;Terapeuta\n";
          patients.forEach(p => {
               const t = users.find(u => u.id === p.therapistId)?.name || 'N/A';
               const line = `${p.name};${p.age};${p.responsibleName};${p.phone};${p.active ? 'Ativo' : 'Inativo'};${t}`;
               csvContent += line + "\n";
          });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `relatorio_${reportType}_${startDate}_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Aggregates for Preview
  const totalSessions = reportType === 'sessions' 
    ? (reportData as any[]).length 
    : reportType === 'therapists' 
        ? (reportData as any[]).reduce((acc, r) => acc + r.count, 0)
        : 0;

  const totalRevenue = reportType === 'sessions'
    ? (reportData as any[]).reduce((acc, s) => acc + s.cost, 0)
    : reportType === 'therapists'
        ? (reportData as any[]).reduce((acc, r) => acc + r.revenue, 0)
        : 0;

  return (
    <div className="space-y-8">
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#1e3a5f]">Relatórios</h1>
            <p className="text-gray-500">Gere relatórios detalhados da sua clínica</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
                onClick={() => setReportType('therapists')}
                className={`p-4 rounded-xl font-medium cursor-pointer border-2 transition-all flex items-center gap-3 ${reportType === 'therapists' ? 'border-[#1e3a5f] bg-blue-50 text-[#1e3a5f]' : 'border-transparent bg-white hover:bg-gray-50'}`}
            >
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Users size={20}/></div>
                Desempenho Terapeutas
            </div>
            <div 
                onClick={() => setReportType('sessions')}
                className={`p-4 rounded-xl font-medium cursor-pointer border-2 transition-all flex items-center gap-3 ${reportType === 'sessions' ? 'border-[#1e3a5f] bg-blue-50 text-[#1e3a5f]' : 'border-transparent bg-white hover:bg-gray-50'}`}
            >
                <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><FileText size={20}/></div>
                Histórico de Sessões
            </div>
            <div 
                onClick={() => setReportType('patients')}
                className={`p-4 rounded-xl font-medium cursor-pointer border-2 transition-all flex items-center gap-3 ${reportType === 'patients' ? 'border-[#1e3a5f] bg-blue-50 text-[#1e3a5f]' : 'border-transparent bg-white hover:bg-gray-50'}`}
            >
                <div className="bg-green-100 p-2 rounded-lg text-green-600"><Users size={20}/></div>
                Lista de Pacientes
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                    {reportType !== 'patients' && (
                        <>
                            <Input label="Data Inicial" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            <Input label="Data Final" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </>
                    )}
                    {reportType === 'patients' && <div className="col-span-2 text-sm text-gray-500 flex items-center">Este relatório exporta a base de dados completa de pacientes.</div>}
                </div>
                <Button onClick={handleDownload} className="flex items-center whitespace-nowrap">
                    <Download size={18} className="mr-2" /> 
                    Exportar Excel (.csv)
                </Button>
            </div>

            {/* VISUALIZAÇÃO NA APP */}
            <div className="mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-[#1e3a5f]"/> 
                    Visualização de Dados
                </h3>

                {reportType === 'therapists' && (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs">
                                <tr>
                                    <th className="p-4">Terapeuta</th>
                                    <th className="p-4 text-center">Sessões</th>
                                    <th className="p-4 text-right">Receita Gerada</th>
                                    <th className="p-4 text-right">Pagamento (Est.)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(reportData as any[]).map((row: any) => (
                                    <tr key={row.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-medium text-gray-900">{row.name}</td>
                                        <td className="p-4 text-center text-gray-700">{row.count}</td>
                                        <td className="p-4 text-right text-green-600 font-bold">€{row.revenue.toFixed(2)}</td>
                                        <td className="p-4 text-right text-gray-500">€{row.earnings.toFixed(2)}</td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-50 font-bold">
                                    <td className="p-4 text-gray-900">TOTAL</td>
                                    <td className="p-4 text-center text-gray-900">{totalSessions}</td>
                                    <td className="p-4 text-right text-[#1e3a5f]">€{totalRevenue.toFixed(2)}</td>
                                    <td className="p-4 text-right text-gray-500">-</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {reportType === 'sessions' && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                        <p className="text-gray-500 mb-2">{totalSessions} sessões encontradas no período.</p>
                        <p className="text-gray-900 font-bold text-xl">Receita: €{totalRevenue.toFixed(2)}</p>
                        <p className="text-xs text-gray-400 mt-2">Use o botão "Exportar" para ver a lista detalhada.</p>
                    </div>
                )}

                {reportType === 'patients' && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                         <p className="text-gray-900 font-bold text-xl">{patients.length} Pacientes Registados</p>
                         <p className="text-xs text-gray-400 mt-2">Use o botão "Exportar" para ver a lista completa.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};