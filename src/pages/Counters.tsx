import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, getDocs, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { FileText } from 'lucide-react';

interface Letter {
  id: string;
  type: 'penawaran' | 'invoice';
  number: string;
  date: string;
  clientName: string;
  items?: { description: string }[];
}

export default function Counters() {
  const { user, role } = useAuth();
  const [letters, setLetters] = useState<Letter[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = role === 'admin'
      ? query(collection(db, 'letters'))
      : query(collection(db, 'letters'), where('ownerId', '==', user.uid));
      
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const lettersData: Letter[] = [];
      snapshot.forEach((doc) => {
        lettersData.push({ id: doc.id, ...doc.data() } as Letter);
      });
      // Sort by date descending
      lettersData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setLetters(lettersData);
      
      // Admin syncs the global counter based on existing letters
      if (role === 'admin' && lettersData.length > 0) {
        try {
          const currentYear = new Date().getFullYear();
          let maxPenawaran = 0;
          let maxInvoice = 0;
          
          lettersData.forEach(l => {
             const lYear = new Date(l.date).getFullYear();
             if (lYear === currentYear) {
               const num = parseInt(l.number, 10);
               if (!isNaN(num)) {
                 if (l.type === 'penawaran' && num > maxPenawaran) {
                   maxPenawaran = num;
                 } else if (l.type === 'invoice' && num > maxInvoice) {
                   maxInvoice = num;
                 }
               }
             }
          });
          
          if (maxPenawaran > 0 || maxInvoice > 0) {
            const counterRef = doc(db, 'counters', 'global');
            const counterSnap = await getDoc(counterRef);
            
            const dataToSet = {
              year: currentYear,
              month: new Date().getMonth() + 1,
              penawaranCount: maxPenawaran,
              invoiceCount: maxInvoice
            };
            
            if (!counterSnap.exists()) {
              await setDoc(counterRef, dataToSet);
            } else {
              const currentData = counterSnap.data();
              if (currentData.year !== currentYear || 
                  (currentData.penawaranCount || 0) < maxPenawaran || 
                  (currentData.invoiceCount || 0) < maxInvoice) {
                await updateDoc(counterRef, {
                  year: currentYear,
                  penawaranCount: Math.max(currentData.year === currentYear ? (currentData.penawaranCount || 0) : 0, maxPenawaran),
                  invoiceCount: Math.max(currentData.year === currentYear ? (currentData.invoiceCount || 0) : 0, maxInvoice)
                });
              }
            }
          }
        } catch (err) {
          console.error("Failed to sync global counters", err);
        }
      }
    }, (error) => {
      console.error("Error fetching letters:", error);
    });

    return () => unsubscribe();
  }, [user, role]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Buku Agenda Nomor Surat
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Daftar riwayat nomor surat yang telah dikeluarkan beserta nama perusahaan dan keterangannya.
          </p>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nomor Surat
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama Perusahaan
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Keterangan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {letters.map((letter) => (
                      <tr key={letter.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {letter.number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {letter.clientName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <span className="font-medium text-gray-900 mr-2">
                            {letter.type === 'invoice' ? 'Invoice' : 'Penawaran'}
                          </span>
                          {letter.items && letter.items.length > 0 && (
                            <span className="text-gray-500">
                              - {letter.items[0].description} {letter.items.length > 1 ? `(+${letter.items.length - 1} item lainnya)` : ''}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {letters.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                          Belum ada surat yang dikeluarkan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
