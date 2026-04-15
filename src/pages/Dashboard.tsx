import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Users, FileText, FileCheck, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    clients: 0,
    penawaran: 0,
    invoice: 0,
    cities: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const clientsQuery = query(collection(db, 'clients'), where('ownerId', '==', user.uid));
        const clientsSnapshot = await getDocs(clientsQuery);
        
        const lettersQuery = query(collection(db, 'letters'), where('ownerId', '==', user.uid));
        const lettersSnapshot = await getDocs(lettersQuery);
        
        let penawaranCount = 0;
        let invoiceCount = 0;
        
        const cities = new Set<string>();
        const clientNames = new Map<string, string>();
        
        clientsSnapshot.forEach(doc => {
          const data = doc.data();
          clientNames.set(doc.id, data.name);
          
          if (data.address) {
            // Simple heuristic to extract city: take the last part after comma, or the last word
            const parts = data.address.split(',');
            if (parts.length > 1) {
              cities.add(parts[parts.length - 1].trim().toLowerCase());
            } else {
              const words = data.address.split(' ');
              if (words.length > 0) {
                cities.add(words[words.length - 1].trim().toLowerCase());
              }
            }
          }
        });

        const invoicePerClient = new Map<string, number>();

        lettersSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.type === 'penawaran') penawaranCount++;
          if (data.type === 'invoice') {
            invoiceCount++;
            const clientId = data.clientId;
            if (clientId) {
              invoicePerClient.set(clientId, (invoicePerClient.get(clientId) || 0) + 1);
            }
          }
        });

        const chartDataArray = Array.from(invoicePerClient.entries()).map(([clientId, count]) => ({
          name: clientNames.get(clientId) || 'Unknown',
          invoices: count
        })).sort((a, b) => b.invoices - a.invoices).slice(0, 10); // Top 10 clients

        setChartData(chartDataArray);

        setStats({
          clients: clientsSnapshot.size,
          penawaran: penawaranCount,
          invoice: invoiceCount,
          cities: cities.size
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [user]);

  const statCards = [
    { name: 'Total Klien', stat: stats.clients, icon: Users, color: 'bg-blue-500' },
    { name: 'Jumlah Kota', stat: stats.cities, icon: MapPin, color: 'bg-purple-500' },
    { name: 'Surat Penawaran', stat: stats.penawaran, icon: FileText, color: 'bg-yellow-500' },
    { name: 'Invoice', stat: stats.invoice, icon: FileCheck, color: 'bg-green-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard Analytics</h1>
      
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`rounded-md p-3 ${item.color}`}>
                    <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{item.stat}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Top Klien (Berdasarkan Jumlah Invoice)</h2>
          {chartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="invoices" fill="#ef4444" name="Jumlah Invoice" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              Belum ada data invoice untuk ditampilkan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
