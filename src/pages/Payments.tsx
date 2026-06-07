import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Edit2, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Letter {
  id: string;
  type: 'penawaran' | 'invoice';
  number: string;
  date: string;
  clientName: string;
  subTotal: number;
  paidAmount?: number;
  remainingAmount?: number;
  incentiveFee?: number;
  paymentDate?: string;
}

export default function Payments() {
  const { user, role } = useAuth();
  const [invoices, setInvoices] = useState<Letter[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ paidAmount: 0, remainingAmount: 0, incentiveFee: 0, paymentDate: '' });

  useEffect(() => {
    if (!user) return;

    const baseQuery = query(collection(db, 'letters'), where('type', '==', 'invoice'));
    const q = (role === 'admin' || role === 'supervisor')
      ? baseQuery
      : query(collection(db, 'letters'), where('type', '==', 'invoice'), where('ownerId', '==', user.uid));
      
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoicesData: Letter[] = [];
      snapshot.forEach((doc) => {
        invoicesData.push({ id: doc.id, ...doc.data() } as Letter);
      });
      // Sort by number descending, then by date descending
      invoicesData.sort((a, b) => {
        const numA = parseInt(a.number.split('/')[0]) || 0;
        const numB = parseInt(b.number.split('/')[0]) || 0;
        
        if (numB !== numA) {
          return numB - numA;
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      setInvoices(invoicesData);
    }, (error) => {
      console.error("Error fetching invoices:", error);
    });

    return () => unsubscribe();
  }, [user, role]);

  const handleEditClick = (invoice: Letter) => {
    setEditingId(invoice.id);
    setEditForm({
      paidAmount: invoice.paidAmount || 0,
      remainingAmount: invoice.remainingAmount !== undefined ? invoice.remainingAmount : (invoice.subTotal - (invoice.paidAmount || 0)),
      incentiveFee: invoice.incentiveFee || 0,
      paymentDate: invoice.paymentDate || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSave = async (id: string) => {
    try {
      await updateDoc(doc(db, 'letters', id), {
        paidAmount: editForm.paidAmount,
        remainingAmount: editForm.remainingAmount,
        incentiveFee: editForm.incentiveFee,
        paymentDate: editForm.paymentDate,
      });
      setEditingId(null);
    } catch (error) {
      console.error("Error updating payment info:", error);
      alert("Gagal mengupdate data pembayaran.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const totalMasuk = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalInsentif = invoices.reduce((sum, inv) => sum + (inv.incentiveFee || 0), 0);
  const totalTagihan = invoices.reduce((sum, inv) => sum + inv.subTotal, 0);
  const totalSisa = invoices.reduce((sum, inv) => sum + (inv.remainingAmount !== undefined ? inv.remainingAmount : (inv.subTotal - (inv.paidAmount || 0))), 0);

  return (
    <div>
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Pembayaran Invoice</h1>
          <p className="mt-2 text-sm text-gray-700">
            Pencatatan dana yang masuk dan fee insentif yang diberikan per invoice.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-100">
          <dt className="truncate text-sm font-medium text-gray-500">Total Nilai Invoice</dt>
          <dd className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">{formatCurrency(totalTagihan)}</dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-100">
          <dt className="truncate text-sm font-medium text-gray-500">Total Dana Masuk</dt>
          <dd className="mt-1 text-2xl font-semibold tracking-tight text-green-600">{formatCurrency(totalMasuk)}</dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-100">
          <dt className="truncate text-sm font-medium text-gray-500">Sisa Tagihan Belum Dibayar</dt>
          <dd className="mt-1 text-2xl font-semibold tracking-tight text-red-600">{formatCurrency(totalSisa)}</dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-100">
          <dt className="truncate text-sm font-medium text-gray-500">Total Fee Insentif</dt>
          <dd className="mt-1 text-2xl font-semibold tracking-tight text-blue-600">{formatCurrency(totalInsentif)}</dd>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Invoice & Klien</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tanggal Dana Masuk</th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Nilai Invoice</th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Dana Masuk</th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Sisa Tagihan</th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Fee Insentif</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {invoices.map((invoice) => {
                    const isEditing = editingId === invoice.id;
                    const paid = invoice.paidAmount || 0;
                    const insentif = invoice.incentiveFee || 0;
                    const sisa = invoice.remainingAmount !== undefined ? invoice.remainingAmount : (invoice.subTotal - paid);
                    const isPaid = sisa <= 0;

                    return (
                      <tr key={invoice.id} className={isPaid ? 'bg-green-50/30' : ''}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="font-medium text-gray-900">{invoice.number}</div>
                          <div className="text-gray-500">{invoice.clientName}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{format(new Date(invoice.date), 'dd MMM yyyy', { locale: idLocale })}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {isEditing ? (
                            <input
                              type="date"
                              className="w-full min-w-[130px] border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                              value={editForm.paymentDate}
                              onChange={(e) => setEditForm({ ...editForm, paymentDate: e.target.value })}
                            />
                          ) : (
                            <span className="text-gray-500">
                              {invoice.paymentDate ? format(new Date(invoice.paymentDate), 'dd MMM yyyy', { locale: idLocale }) : '-'}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 text-right font-medium">
                          {formatCurrency(invoice.subTotal)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              className="w-full min-w-[120px] text-right border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                              value={editForm.paidAmount === 0 ? '' : editForm.paidAmount}
                              onChange={(e) => setEditForm({ ...editForm, paidAmount: Number(e.target.value) })}
                              placeholder="0"
                            />
                          ) : (
                            <span className={paid > 0 ? "text-green-600 font-medium" : "text-gray-500"}>
                              {formatCurrency(paid)}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              className="w-full min-w-[120px] text-right border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                              value={editForm.remainingAmount === 0 ? '' : editForm.remainingAmount}
                              onChange={(e) => setEditForm({ ...editForm, remainingAmount: Number(e.target.value) })}
                              placeholder="0"
                            />
                          ) : (
                            <span className={sisa > 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                              {formatCurrency(sisa)}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              className="w-full min-w-[120px] text-right border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                              value={editForm.incentiveFee === 0 ? '' : editForm.incentiveFee}
                              onChange={(e) => setEditForm({ ...editForm, incentiveFee: Number(e.target.value) })}
                              placeholder="0"
                            />
                          ) : (
                            <span className={insentif > 0 ? "text-blue-600 font-medium" : "text-gray-500"}>
                              {formatCurrency(insentif)}
                            </span>
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {role !== 'supervisor' && (
                            isEditing ? (
                              <div className="flex justify-end space-x-2">
                                <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700" title="Batal">
                                  <X className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleSave(invoice.id)} className="text-green-600 hover:text-green-900" title="Simpan">
                                  <Save className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => handleEditClick(invoice)} className="text-blue-600 hover:text-blue-900" title="Edit Pembayaran">
                                <Edit2 className="h-4 w-4" />
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-gray-500">
                        Belum ada data invoice yang dibuat.
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
  );
}
