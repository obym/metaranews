import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Users, FileText, CircleDollarSign, Wallet, TrendingUp, Newspaper, MapPin, UserCheck, Camera, PenTool } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, ComposedChart, Area, Line, CartesianGrid, Legend, YAxis } from 'recharts';

export default function Dashboard() {
  const { user, role } = useAuth();
  
  const [stats, setStats] = useState({
    totalRevenue: 0,
    invoices: 0,
    clients: 0,
    loyalty: 78,
    incentiveFee: 0,
    netRevenue: 0
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [newsStats, setNewsStats] = useState({
    byArea: [] as {name: string, count: number}[],
    byReporter: [] as {name: string, count: number}[],
    byWriter: [] as {name: string, count: number}[],
    byDocumentation: [] as {name: string, count: number}[],
    byDate: [] as {date: string, count: number, day: string}[]
  });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [allLettersData, setAllLettersData] = useState<any[]>([]);
  const [clientCount, setClientCount] = useState<number>(0);
  const [newsData, setNewsData] = useState<any[]>([]);
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<'area' | 'reporter' | 'writer' | 'documentation'>('area');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const currentYear = new Date().getFullYear();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        const clientsQuery = (role === 'admin' || role === 'supervisor')
          ? query(collection(db, 'clients'))
          : query(collection(db, 'clients'), where('ownerId', '==', user.uid));
        const clientsSnapshot = await getDocs(clientsQuery);
        
        const clientNames = new Map<string, string>();
        clientsSnapshot.forEach(doc => {
          clientNames.set(doc.id, doc.data().name);
        });

        const allLettersQuery = (role === 'admin' || role === 'supervisor')
           ? query(collection(db, 'letters'))
           : query(collection(db, 'letters'), where('ownerId', '==', user.uid));
        const allLettersSnapshot = await getDocs(allLettersQuery);
        
        const allLetters: any[] = [];
        allLettersSnapshot.forEach(doc => {
          const data = doc.data();
          allLetters.push({ id: doc.id, clientName: clientNames.get(data.clientId) || data.clientName || 'Unknown', ...data });
        });
        
        setAllLettersData(allLetters);
        setClientCount(clientsSnapshot.size);
        
        // Fetch news data
        const newsQuery = query(collection(db, 'news'));
        const newsSnapshot = await getDocs(newsQuery);
        const newsItems: any[] = [];
        newsSnapshot.forEach(doc => {
          newsItems.push({ id: doc.id, ...doc.data() });
        });
        setNewsData(newsItems);

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

  useEffect(() => {
    let revenue = 0;
    let totalIncentive = 0;
    let invCount = 0;
    
    const monthlyRev = new Array(12).fill(0);
    const monthlyInc = new Array(12).fill(0);
    const invoicesOnly = allLettersData.filter(l => l.type === 'invoice');

    invoicesOnly.forEach(data => {
      const date = data.date ? new Date(data.date) : null;
      const dataMonth = date ? date.getMonth() : -1;
      const dataYear = date ? date.getFullYear() : -1;

      if (dataYear === currentYear) {
        monthlyRev[dataMonth] += (data.paidAmount || 0);
        monthlyInc[dataMonth] += (data.incentiveFee || 0);
      }

      let includeInStats = false;
      if (selectedMonth === 'all') {
        includeInStats = true;
      } else {
        if (dataYear === currentYear && dataMonth === selectedMonth) {
          includeInStats = true;
        }
      }

      if (includeInStats) {
        invCount++;
        revenue += (data.paidAmount || 0);
        totalIncentive += (data.incentiveFee || 0);
      }
    });

    setStats({
      totalRevenue: revenue,
      invoices: invCount,
      clients: clientCount,
      loyalty: 78,
      incentiveFee: totalIncentive,
      netRevenue: revenue - totalIncentive
    });

    setMonthlyData(monthlyRev.map((val, idx) => ({
      name: monthNames[idx],
      revenue: val,
      incentive: monthlyInc[idx],
      net: val - monthlyInc[idx]
    })));

  }, [selectedMonth, allLettersData, clientCount]);

  useEffect(() => {
    let filteredNews = newsData;
    
    if (selectedMonth !== 'all') {
      filteredNews = newsData.filter(news => {
        // use publishDate if available, else createdAt
        let d = null;
        if (news.publishDate) d = new Date(news.publishDate);
        else if (news.createdAt?.toDate) d = news.createdAt.toDate();
        else if (news.createdAt) d = new Date(news.createdAt);
        
        if (d) {
          return d.getMonth() === selectedMonth && d.getFullYear() === currentYear;
        }
        return false;
      });
    }

    const areaMap: Record<string, number> = {};
    const reporterMap: Record<string, number> = {};
    const writerMap: Record<string, number> = {};
    const docMap: Record<string, number> = {};
    const dateMap: Record<string, {count: number, d: Date}> = {};

    filteredNews.forEach(news => {
      if (news.area) areaMap[news.area] = (areaMap[news.area] || 0) + 1;
      if (news.reporter) reporterMap[news.reporter] = (reporterMap[news.reporter] || 0) + 1;
      if (news.writer) writerMap[news.writer] = (writerMap[news.writer] || 0) + 1;
      if (news.documentation) docMap[news.documentation] = (docMap[news.documentation] || 0) + 1;

      let dateStr = '';
      let dObj = null;
      if (news.publishDate) {
        dObj = new Date(news.publishDate);
      } else if (news.createdAt?.toDate) {
        dObj = news.createdAt.toDate();
      } else if (news.createdAt) {
        dObj = new Date(news.createdAt);
      }

      if (dObj) {
        dateStr = dObj.toISOString().split('T')[0];
        if (!dateMap[dateStr]) {
          dateMap[dateStr] = { count: 0, d: dObj };
        }
        dateMap[dateStr].count += 1;
      }
    });

    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    const sortedDates = Object.keys(dateMap).sort().map(k => {
      const d = dateMap[k].d;
      const dayName = days[d.getDay()];
      return {
        date: k,
        day: dayName,
        count: dateMap[k].count
      };
    });

    const sortMap = (m: Record<string, number>) => Object.entries(m)
      .sort((a,b) => b[1] - a[1])
      .map(([name, count]) => ({name, count}));

    setNewsStats({
      byArea: sortMap(areaMap),
      byReporter: sortMap(reporterMap),
      byWriter: sortMap(writerMap),
      byDocumentation: sortMap(docMap),
      byDate: sortedDates
    });
  }, [newsData, selectedMonth]);

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
        <select 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-sm"
        >
          <option value="all">Semua Bulan</option>
          {monthNames.map((m, idx) => (
            <option key={idx} value={idx}>{m} {currentYear}</option>
          ))}
        </select>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <CircleDollarSign size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[13px] font-semibold text-gray-500">Total Dana Masuk</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-[28px] font-bold text-gray-900 tracking-tight leading-none">{formatCurrency(stats.totalRevenue)}</span>
          </div>
        </div>
        
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
              <Wallet size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[13px] font-semibold text-gray-500">Fee Insentif / Cashback</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-[28px] font-bold text-gray-900 tracking-tight leading-none">{formatCurrency(stats.incentiveFee)}</span>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
              <TrendingUp size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[13px] font-semibold text-gray-500">Sisa Dana</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-[28px] font-bold text-gray-900 tracking-tight leading-none">{formatCurrency(stats.netRevenue)}</span>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
              <FileText size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[13px] font-semibold text-gray-500">Total Invoices</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-[28px] font-bold text-gray-900 tracking-tight leading-none">{stats.invoices.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 w-full hover:shadow-md transition-shadow">
          <div className="mb-8">
            <h3 className="text-[13px] font-bold text-gray-400 mb-2">Dana Masuk Bulanan</h3>
            <div className="text-[32px] font-bold text-gray-900 leading-none">
              {formatCurrency(monthlyData[new Date().getMonth()]?.revenue || 0)}
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => formatCurrency(val, true)}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number, name: string) => [formatCurrency(value), name === 'revenue' ? 'Dana Masuk' : name === 'net' ? 'Sisa Dana' : 'Fee Insentif']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="revenue" name="Dana Masuk" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                <Area type="monotone" dataKey="net" name="Sisa Dana" fillOpacity={1} fill="url(#colorNet)" stroke="#22c55e" strokeWidth={2} />
                <Line type="monotone" dataKey="incentive" name="Fee Insentif" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* News Stats Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Newspaper size={24} className="text-blue-500" />
          Statistik Publikasi Berita
        </h2>
        
        {/* News Chart */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 w-full hover:shadow-md transition-shadow">
            <div className="mb-8">
              <h3 className="text-[13px] font-bold text-gray-400 mb-2">Grafik Publikasi per Tanggal</h3>
              <div className="text-[32px] font-bold text-gray-900 leading-none">
                {newsStats.byDate.reduce((acc, curr) => acc + curr.count, 0)} <span className="text-lg text-gray-500 font-medium">Berita</span>
              </div>
            </div>
            {newsStats.byDate.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={newsStats.byDate} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} 
                      tickFormatter={(val) => {
                        const row = newsStats.byDate.find(d => d.date === val);
                        return row ? `${row.day.substring(0,3)}, ${val.substring(5)}` : val;
                      }}
                      dy={10} 
                    />
                    <YAxis 
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelFormatter={(label) => {
                        const row = newsStats.byDate.find(d => d.date === label);
                        return row ? `${row.day}, ${label}` : label;
                      }}
                      formatter={(value: number) => [value, 'Jumlah Berita']}
                    />
                    <Bar dataKey="count" name="Jumlah Berita" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={32}>
                      {newsStats.byDate.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#ef4444" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <Newspaper className="w-12 h-12 mb-3 text-gray-200" />
                <p>Belum ada data publikasi berita.</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Chart */}
        <div className="grid grid-cols-1 mb-6">
          <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h3 className="text-[13px] font-bold text-gray-400 mb-1">Distribusi per Kategori</h3>
                <div className="text-xl font-bold text-gray-900 leading-none">
                  {selectedNewsCategory === 'area' ? 'Daerah Liputan' :
                   selectedNewsCategory === 'reporter' ? 'Wartawan' :
                   selectedNewsCategory === 'writer' ? 'Penulis' : 'Dokumentasi'}
                </div>
              </div>
              <select
                value={selectedNewsCategory}
                onChange={(e) => setSelectedNewsCategory(e.target.value as any)}
                className="text-sm border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 pl-3 pr-10 bg-gray-50 text-gray-800 font-medium"
              >
                <option value="area">Daerah Liputan</option>
                <option value="reporter">Wartawan</option>
                <option value="writer">Penulis</option>
                <option value="documentation">Dokumentasi</option>
              </select>
            </div>
            
            {(() => {
              const data = 
                selectedNewsCategory === 'area' ? newsStats.byArea :
                selectedNewsCategory === 'reporter' ? newsStats.byReporter :
                selectedNewsCategory === 'writer' ? newsStats.byWriter :
                newsStats.byDocumentation;

              if (data.length === 0) {
                return (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                    <p>Belum ada data untuk kategori ini.</p>
                  </div>
                );
              }

              return (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} 
                        dy={10} 
                      />
                      <YAxis 
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [value, 'Jumlah Berita']}
                      />
                      <Bar dataKey="count" name="Jumlah" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="#3b82f6" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
          </div>
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
        <div className="bg-white rounded-[24px] p-4 lg:p-8 shadow-sm border border-gray-100 xl:col-span-2 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Invoices</h3>
          <div className="overflow-x-auto mobile-cards">
          <table className="w-full text-left border-collapse md:min-w-[500px]">
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
                  <td data-label="No" className="py-5 px-2 font-bold text-gray-600 text-[13px] group-hover:text-[#2563eb] transition-colors">{inv.number || 'Draft'}</td>
                  <td data-label="Date" className="py-5 px-2 text-gray-500 font-semibold text-[13px]">{formatDate(inv.date)}</td>
                  <td data-label="Client" className="py-5 px-2 font-bold text-gray-800 text-[13px]">{inv.clientName}</td>
                  <td data-label="Amount" className="py-5 px-2 font-bold text-gray-900 text-[13px]">{formatCurrency(inv.subTotal || 0)}</td>
                  <td data-label="Status" className="py-5 px-2 text-right">
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
    </div>
  );
}
