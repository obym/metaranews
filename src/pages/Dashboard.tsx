import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Users, FileText, Heart, CircleDollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard() {
  const { user, role } = useAuth();
  
  const [stats, setStats] = useState({
    totalRevenue: 0,
    invoices: 0,
    clients: 0,
    loyalty: 78
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        const clientsQuery = role === 'admin' 
          ? query(collection(db, 'clients'))
          : query(collection(db, 'clients'), where('ownerId', '==', user.uid));
        const clientsSnapshot = await getDocs(clientsQuery);
        
        const clientNames = new Map<string, string>();
        clientsSnapshot.forEach(doc => {
          clientNames.set(doc.id, doc.data().name);
        });

        const allLettersQuery = role === 'admin'
           ? query(collection(db, 'letters'))
           : query(collection(db, 'letters'), where('ownerId', '==', user.uid));
        const allLettersSnapshot = await getDocs(allLettersQuery);
        
        let revenue = 0;
        let invCount = 0;
        const currentYear = new Date().getFullYear();
        const monthlyRev = new Array(12).fill(0);
        
        const allLetters: any[] = [];
        
        allLettersSnapshot.forEach(doc => {
          const data = doc.data();
          allLetters.push({ id: doc.id, clientName: clientNames.get(data.clientId) || data.clientName || 'Unknown', ...data });
          
          if (data.type === 'invoice') {
            invCount++;
            revenue += (data.subTotal || 0);
            
            if (data.date) {
              const date = new Date(data.date);
              if (date.getFullYear() === currentYear) {
                monthlyRev[date.getMonth()] += (data.subTotal || 0);
              }
            }
          }
        });
        
        setStats({
          totalRevenue: revenue,
          invoices: invCount,
          clients: clientsSnapshot.size,
          loyalty: 78
        });

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        setMonthlyData(monthlyRev.map((val, idx) => ({
          name: monthNames[idx],
          revenue: val
        })));
        
        allLetters.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const invoicesOnly = allLetters.filter(l => l.type === 'invoice');
        setRecentInvoices(invoicesOnly.slice(0, 5));
        
        setActivities(allLetters.slice(0, 5));
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, [user, role]);

  const formatCurrency = (val: number, compact = false) => {
    if (compact) {
      if (val >= 1000000000) return 'Rp ' + (val / 1000000000).toFixed(1) + 'M';
      if (val >= 1000000) return 'Rp ' + (val / 1000000).toFixed(1) + 'Jt';
      if (val >= 1000) return 'Rp ' + (val / 1000).toFixed(1) + 'k';
    }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  
  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white text-xs font-bold py-2 px-3 rounded-md shadow-lg">
          {formatCurrency(payload[0].value)}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full text-gray-800 font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
              <CircleDollarSign size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[13px] font-semibold text-gray-500">Total Revenue</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-[28px] font-bold text-gray-900 tracking-tight leading-none">{formatCurrency(stats.totalRevenue, true)}</span>
            <span className="text-[11px] font-extrabold text-green-600 bg-green-50/80 px-2 py-0.5 rounded flex items-center gap-1">+12% &uarr;</span>
          </div>
        </div>
        
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
              <FileText size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[13px] font-semibold text-gray-500">Invoices</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-[28px] font-bold text-gray-900 tracking-tight leading-none">{stats.invoices.toLocaleString('id-ID')}</span>
            <span className="text-[11px] font-extrabold text-green-600 bg-green-50/80 px-2 py-0.5 rounded flex items-center gap-1">+5% &uarr;</span>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <Users size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[13px] font-semibold text-gray-500">Clients</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-[28px] font-bold text-gray-900 tracking-tight leading-none">{stats.clients.toLocaleString('id-ID')}</span>
            <span className="text-[11px] font-extrabold text-green-600 bg-green-50/80 px-2 py-0.5 rounded flex items-center gap-1">+2% &uarr;</span>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-400">
              <Heart size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[13px] font-semibold text-gray-500">Loyalty</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-[28px] font-bold text-gray-900 tracking-tight leading-none">{stats.loyalty}%</span>
            <span className="text-[11px] font-extrabold text-red-500 bg-red-50 px-2 py-0.5 rounded flex items-center gap-1">-1% &darr;</span>
          </div>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 lg:col-span-2 hover:shadow-md transition-shadow">
          <div className="mb-8">
            <h3 className="text-[13px] font-bold text-gray-400 mb-2">Monthly Revenue</h3>
            <div className="text-[32px] font-bold text-gray-900 leading-none">
              {formatCurrency(monthlyData[new Date().getMonth()]?.revenue || 0)}
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#cbd5e1', fontWeight: 600 }} 
                  dy={15} 
                />
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ fill: 'transparent' }} 
                />
                <Bar dataKey="revenue" radius={[8, 8, 8, 8]} barSize={26}>
                  {monthlyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === new Date().getMonth() ? '#2563eb' : '#f1f5f9'} className="transition-colors duration-300" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1e3a8a] rounded-[24px] p-8 shadow-sm text-white lg:col-span-1 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-blue-500/40 blur-[40px] pointer-events-none transition-transform duration-700 group-hover:scale-110"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-40 h-40 rounded-full bg-[#38bdf8]/20 blur-[30px] pointer-events-none transition-transform duration-700 group-hover:scale-110"></div>
          
          <div className="relative z-10">
            <span className="inline-block bg-white text-[#1e3a8a] text-[10px] font-black px-3 py-1 rounded-full mb-6 tracking-widest">
              NEW
            </span>
            <h3 className="text-[26px] font-bold mb-4 leading-tight tracking-tight">We have added new invoicing templates!</h3>
            <p className="text-blue-100 text-[13px] mb-8 leading-relaxed font-medium">
              New templates focused on helping you improve your business
            </p>
          </div>
          <button className="relative z-10 bg-white text-[#1e3a8a] font-bold text-sm py-3.5 px-4 rounded-[14px] w-full hover:bg-gray-50 transition-colors shadow-sm">
            Download Now
          </button>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Activities */}
        <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 xl:col-span-1 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-bold text-gray-900 mb-8">Activities</h3>
          <div className="space-y-7">
            {activities.length > 0 ? activities.map((act, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100">
                   <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${act.id || idx}&backgroundColor=transparent`} alt="avatar" className="w-8 h-8 object-cover opacity-80" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-[13px] text-gray-600 font-medium leading-relaxed mb-1 pr-2">
                    <span className="font-bold text-gray-900">User</span> created {act.type === 'penawaran' ? 'penawaran' : 'invoice'}{' '}
                    <span className="font-bold text-gray-900">{act.number || 'Draft'}</span>
                  </p>
                  <p className="text-[13px] text-gray-500 mb-1">
                    {act.type === 'invoice' ? 'was sent to' : 'for'} <span className="font-bold text-gray-800">{act.clientName}</span>
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1 font-semibold">{formatDate(act.date) + ', ' + formatTime(act.date)}</p>
                </div>
              </div>
            )) : (
              <p className="text-[13px] text-gray-500 font-medium">No recent activities found.</p>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 xl:col-span-2 overflow-x-auto hover:shadow-md transition-shadow">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Invoices</h3>
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <th className="pb-4 font-bold px-2 whitespace-nowrap">No</th>
                <th className="pb-4 font-bold px-2">Date Created</th>
                <th className="pb-4 font-bold px-2">Client</th>
                <th className="pb-4 font-bold px-2">Amount</th>
                <th className="pb-4 font-bold px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {recentInvoices.length > 0 ? recentInvoices.map((inv, idx) => (
                <tr key={inv.id || idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
                  <td className="py-5 px-2 font-bold text-gray-600 text-[13px] group-hover:text-[#2563eb] transition-colors">{inv.number || 'Draft'}</td>
                  <td className="py-5 px-2 text-gray-500 font-semibold text-[13px]">{formatDate(inv.date)}</td>
                  <td className="py-5 px-2 font-bold text-gray-800 text-[13px]">{inv.clientName}</td>
                  <td className="py-5 px-2 font-bold text-gray-900 text-[13px]">{formatCurrency(inv.subTotal || 0)}</td>
                  <td className="py-5 px-2 text-right">
                    <span className={`inline-flex px-3 py-1.5 rounded-md text-[10px] font-black tracking-widest uppercase items-center justify-center ${
                      inv.status === 'paid' ? 'bg-green-50 text-green-600' : 
                      inv.status === 'overdue' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {inv.status || 'DRAFT'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400 font-medium text-[13px]">No recent invoices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
