import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Users, FileText, FileCheck } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    clients: 0,
    penawaran: 0,
    invoice: 0
  });

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
        
        lettersSnapshot.forEach(doc => {
          if (doc.data().type === 'penawaran') penawaranCount++;
          if (doc.data().type === 'invoice') invoiceCount++;
        });

        setStats({
          clients: clientsSnapshot.size,
          penawaran: penawaranCount,
          invoice: invoiceCount
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [user]);

  const statCards = [
    { name: 'Total Klien', stat: stats.clients, icon: Users, color: 'bg-blue-500' },
    { name: 'Surat Penawaran', stat: stats.penawaran, icon: FileText, color: 'bg-yellow-500' },
    { name: 'Invoice', stat: stats.invoice, icon: FileCheck, color: 'bg-green-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          <h2 className="text-lg font-medium text-gray-900 mb-4">Selamat datang!</h2>
          <p className="text-gray-600">
            Sistem Manajemen Surat & Invoice Metaranews.co memungkinkan Anda untuk mengelola data klien, 
            membuat surat penawaran, dan menerbitkan invoice dengan mudah dan cepat.
          </p>
          <ul className="mt-4 list-disc list-inside text-gray-600 space-y-2">
            <li>Mulai dengan menambahkan data <strong>Klien</strong> baru.</li>
            <li>Buat <strong>Surat Penawaran</strong> atau <strong>Invoice</strong> dari menu Surat & Invoice.</li>
            <li>Nomor surat akan ter-generate secara otomatis.</li>
            <li>Anda dapat mencetak atau menyimpan dokumen sebagai PDF.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
