import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Trash2, X, Download, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface AppDocument {
  id: string;
  title: string;
  description: string;
  url: string;
  createdAt: any;
}

export default function Documents() {
  const { user, role } = useAuth();
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<AppDocument | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: ''
  });

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
      
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData: AppDocument[] = [];
      snapshot.forEach((doc) => {
        docsData.push({ id: doc.id, ...doc.data() } as AppDocument);
      });
      setDocuments(docsData);
    }, (error) => {
      console.error("Error fetching documents:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleOpenModal = (appDoc?: AppDocument) => {
    if (appDoc) {
      setEditingDoc(appDoc);
      setFormData({
        title: appDoc.title || '',
        description: appDoc.description || '',
        url: appDoc.url || ''
      });
    } else {
      setEditingDoc(null);
      setFormData({ title: '', description: '', url: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDoc(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let finalUrl = formData.url;
    if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    try {
      if (editingDoc) {
        await updateDoc(doc(db, 'documents', editingDoc.id), {
          title: formData.title,
          description: formData.description,
          url: finalUrl,
        });
      } else {
        await addDoc(collection(db, 'documents'), {
          title: formData.title,
          description: formData.description,
          url: finalUrl,
          ownerId: user.uid,
          createdAt: serverTimestamp()
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving document:", error);
      alert("Gagal menyimpan dokumen.");
    }
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, 'documents', deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Gagal menghapus dokumen.");
    }
  };

  const isAdmin = role === 'admin';

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Dokumen Pendukung</h1>
          <p className="mt-2 text-sm text-gray-700">
            Kumpulan dokumen, panduan, atau berkas pendukung lainnya yang dapat diunduh.
          </p>
        </div>
        {isAdmin && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Dokumen
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Judul Dokumen</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Deskripsi</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tanggal Ditambahkan</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {documents.map((doc) => {
                    const dateAdded = doc.createdAt?.toDate ? doc.createdAt.toDate() : new Date();
                    return (
                      <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <div className="flex items-center gap-2">
                            {doc.title}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate" title={doc.description}>{doc.description || '-'}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {format(dateAdded, 'dd MMM yyyy', { locale: idLocale })}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex items-center justify-end gap-3">
                            <a 
                              href={doc.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <ExternalLink className="h-3.5 w-3.5 mr-1" />
                              Buka / Unduh
                            </a>
                            {isAdmin && (
                              <>
                                <button onClick={() => handleOpenModal(doc)} className="text-indigo-600 hover:text-indigo-900 p-1" title="Edit">
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button onClick={() => setDeleteId(doc.id)} className="text-red-600 hover:text-red-900 p-1" title="Hapus">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {documents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm text-gray-500">
                        Belum ada dokumen yang ditambahkan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" aria-hidden="true" onClick={() => setDeleteId(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <Trash2 className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Hapus Dokumen
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Apakah Anda yakin ingin menghapus dokumen ini? Tautan tidak akan tersedia lagi.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Hapus
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" aria-hidden="true" onClick={handleCloseModal}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={handleCloseModal}
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    {editingDoc ? 'Edit Dokumen' : 'Tambah Dokumen Baru'}
                  </h3>
                  <div className="mt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Judul Dokumen *</label>
                        <input
                          type="text"
                          name="title"
                          id="title"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          placeholder="Misal: Form Pemesanan Iklan"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Deskripsi Singkat</label>
                        <textarea
                          name="description"
                          id="description"
                          rows={2}
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          placeholder="Penjelasan singkat mengenai dokumen"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="url" className="block text-sm font-medium text-gray-700">Tautan Berkas (Link Google Drive / Dropbox / dll) *</label>
                        <input
                          type="text"
                          name="url"
                          id="url"
                          required
                          value={formData.url}
                          onChange={(e) => setFormData({...formData, url: e.target.value})}
                          placeholder="https://drive.google.com/..."
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        />
                      </div>
                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={handleCloseModal}
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:w-auto sm:text-sm"
                        >
                          Batal
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
