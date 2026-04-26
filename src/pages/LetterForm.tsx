import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, doc, getDoc, updateDoc, setDoc, serverTimestamp, runTransaction, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  address: string;
}

interface Item {
  description: string;
  qty: number;
  period: string;
  price: number;
  total: number;
}

const ROMAN_NUMERALS = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export default function LetterForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  const [type, setType] = useState<'penawaran' | 'invoice'>(
    (searchParams.get('type') as 'penawaran' | 'invoice') || 'penawaran'
  );

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualNumber, setManualNumber] = useState('');
  const [subject, setSubject] = useState('Penawaran iklan di metaranews.co');
  const [content, setContent] = useState(`Dengan hormat,\n\nSalam silaturrahim kami sampaikan, semoga Bapak/Ibu beserta seluruh staf senantiasa mendapat limpahan rahmat dari Tuhan Yang Maha Esa. Amin.\n\nMetaranews.co merupakan media online yang menyajikan berita-berita aktual secara cepat, akurat, terpercaya dan dikaji secara mendalam dan merupakan media efektif untuk menyebarkan informasi tanpa batas teritorial. Media ini bernaung di bawah PT Portal Digital Media Nusantara.\n\nMetaranews.co yang menyajikan berita-berita khas dan khusus Jawa Timur hadir menjawab kebutuhan zaman, dengan semangat mengusung misi building, inspiring, dan positive thinking melalui portal berita metaranews.co. Dengan menggunakan metaranews.co, maka berita-berita lokal yang tersaji bisa dibaca dan dinikmati secara lokal, regional, nasional, maupun internasional.\n\nPada kesempatan ini, kami ingin mengajukan penawaran kerjasama dengan rincian sebagai berikut:`);
  
  const [items, setItems] = useState<Item[]>([{ description: '', qty: 1, period: '', price: 0, total: 0 }]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  useEffect(() => {
    if (!user) return;
    const fetchClients = async () => {
      const q = query(collection(db, 'clients'), where('ownerId', '==', user.uid));
      const snapshot = await getDocs(q);
      const clientsData: Client[] = [];
      snapshot.forEach((doc) => {
        clientsData.push({ id: doc.id, name: doc.data().name, address: doc.data().address || '' });
      });
      setClients(clientsData);
    };
    fetchClients();
  }, [user]);

  useEffect(() => {
    if (!user || !isEditMode || !id) return;

    const fetchLetter = async () => {
      try {
        const docRef = doc(db, 'letters', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().ownerId === user.uid) {
          const data = docSnap.data();
          setType(data.type);
          setSelectedClientId(data.clientId);
          setDate(data.date.split('T')[0]);
          setManualNumber(data.number);
          setItems(data.items || []);
          if (data.subject) setSubject(data.subject);
          if (data.content) setContent(data.content);
        } else {
          alert("Dokumen tidak ditemukan atau Anda tidak memiliki akses.");
          navigate('/letters');
        }
      } catch (error) {
        console.error("Error fetching letter:", error);
        alert("Gagal memuat dokumen.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLetter();
  }, [user, id, isEditMode, navigate]);

  const handleItemChange = (index: number, field: keyof Item, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'qty' || field === 'price') {
      newItems[index].total = Number(newItems[index].qty) * Number(newItems[index].price);
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', qty: 1, period: '', price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const subTotal = items.reduce((sum, item) => sum + item.total, 0);

  const generateNumber = async (currentDate: Date) => {
    if (!user) return '';
    
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const romanMonth = ROMAN_NUMERALS[month];
    
    let newNumber = '';
    
    try {
      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, 'counters', user.uid);
        const counterDoc = await transaction.get(counterRef);
        
        let currentCount = 0;
        let docMonth = month;
        let docYear = year;
        
        if (counterDoc.exists()) {
          const data = counterDoc.data();
          if (data.year === year) {
             currentCount = type === 'penawaran' ? (data.penawaranCount || 0) : (data.invoiceCount || 0);
          }
        }
        
        const nextCount = currentCount + 1;
        
        if (type === 'penawaran') {
          newNumber = `${nextCount}/METARA/${romanMonth}/${year}`;
        } else {
          newNumber = `${nextCount}/SPJ/METARA/${romanMonth}/${year}`;
        }
        
        const updateData: any = {
          month,
          year,
        };
        
        if (type === 'penawaran') {
          updateData.penawaranCount = nextCount;
          // Preserve invoice count if exists
          if (counterDoc.exists() && counterDoc.data().year === year && counterDoc.data().invoiceCount) {
             updateData.invoiceCount = counterDoc.data().invoiceCount;
          } else if (!counterDoc.exists() || counterDoc.data().year !== year) {
             updateData.invoiceCount = 0;
          }
        } else {
          updateData.invoiceCount = nextCount;
          // Preserve penawaran count if exists
          if (counterDoc.exists() && counterDoc.data().year === year && counterDoc.data().penawaranCount) {
             updateData.penawaranCount = counterDoc.data().penawaranCount;
          } else if (!counterDoc.exists() || counterDoc.data().year !== year) {
             updateData.penawaranCount = 0;
          }
        }
        
        transaction.set(counterRef, updateData, { merge: true });
      });
      
      return newNumber;
    } catch (e) {
      console.error("Transaction failed: ", e);
      throw e;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!selectedClientId) {
      alert("Silakan pilih klien.");
      return;
    }
    
    setIsSaving(true);
    
    try {
      const selectedClient = clients.find(c => c.id === selectedClientId);
      const letterDate = new Date(date);
      
      let generatedNumber = manualNumber.trim();
      if (!generatedNumber && !isEditMode) {
        generatedNumber = await generateNumber(letterDate);
      } else if (!generatedNumber && isEditMode && id) {
        // If editing and number is cleared, we should probably keep the old one or generate a new one.
        // For safety, let's just require it or keep the existing.
        const docRef = doc(db, 'letters', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          generatedNumber = docSnap.data().number;
        }
      }
      
      const letterData: any = {
        type,
        number: generatedNumber,
        date: letterDate.toISOString(),
        clientId: selectedClientId,
        clientName: selectedClient?.name || '',
        clientAddress: selectedClient?.address || '',
        items,
        subTotal,
        status: 'draft',
        ownerId: user.uid,
      };

      if (type === 'penawaran') {
        letterData.subject = subject;
        letterData.content = content;
      }
      
      if (isEditMode && id) {
        const docRef = doc(db, 'letters', id);
        await updateDoc(docRef, {
          ...letterData,
          updatedAt: serverTimestamp()
        });
        navigate(`/letters/${id}`);
      } else {
        const docRef = await addDoc(collection(db, 'letters'), {
          ...letterData,
          createdAt: serverTimestamp()
        });
        navigate(`/letters/${docRef.id}`);
      }
    } catch (error) {
      console.error("Error saving letter:", error);
      alert("Gagal menyimpan dokumen.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/letters')} className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEditMode ? 'Edit' : 'Buat'} {type === 'invoice' ? 'Invoice' : 'Surat Penawaran'} {isEditMode ? '' : 'Baru'}
        </h1>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="manualNumber" className="block text-sm font-medium text-gray-700">Nomor Surat (Opsional)</label>
              <input
                type="text"
                name="manualNumber"
                id="manualNumber"
                value={manualNumber}
                onChange={(e) => setManualNumber(e.target.value)}
                placeholder="Kosongkan untuk generate otomatis"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Jika diisi, nomor ini akan digunakan dan tidak akan menambah counter otomatis.</p>
            </div>

            <div>
              <label htmlFor="client" className="block text-sm font-medium text-gray-700">Klien *</label>
              <select
                id="client"
                name="client"
                required
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md border"
              >
                <option value="">Pilih Klien</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">Tanggal *</label>
              <input
                type="date"
                name="date"
                id="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              />
            </div>
            
            {type === 'penawaran' && (
              <div className="sm:col-span-2 space-y-6">
                 <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Perihal / Subjek</label>
                    <input
                      type="text"
                      name="subject"
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    />
                 </div>
                 <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">Isi Dokumen (Manual Edit)</label>
                    <textarea
                      id="content"
                      name="content"
                      rows={12}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm font-sans"
                    />
                 </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Item Layanan</h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Plus className="h-4 w-4 mr-1" /> Tambah Item
              </button>
            </div>
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Deskripsi</label>
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        placeholder="Contoh: Advertorial Banner Web uk. 300x85"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Qty</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.qty}
                          onChange={(e) => handleItemChange(index, 'qty', Number(e.target.value))}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Periode Tayang</label>
                        <input
                          type="text"
                          value={item.period}
                          onChange={(e) => handleItemChange(index, 'period', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                          placeholder="Contoh: April 2026"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Harga (Rp)</label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', Number(e.target.value))}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Total (Rp)</label>
                        <input
                          type="number"
                          readOnly
                          value={item.total}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="mt-6 text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex justify-end">
              <div className="text-right">
                <p className="text-sm text-gray-500">Sub Total</p>
                <p className="text-xl font-bold text-gray-900">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(subTotal)}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/letters')}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan & Buat Dokumen'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
