import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { Plus, Edit2, Trash2, X, Search } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface NewsArticle {
  id: string;
  title: string;
  area: string;
  reporter: string;
  writer: string;
  documentation: string;
  publishDate?: string;
  createdAt: any;
}

export default function News() {
  const { user, role } = useAuth();
  const [newsList, setNewsList] = useState<NewsArticle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    area: "",
    reporter: "",
    writer: "",
    documentation: "",
    publishDate: "",
  });

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newsData: NewsArticle[] = [];
      snapshot.forEach((doc) => {
        newsData.push({ id: doc.id, ...doc.data() } as NewsArticle);
      });
      setNewsList(newsData);
    });

    return () => unsubscribe();
  }, [user, role]);

  const handleOpenModal = (newsItem?: NewsArticle | null) => {
    if (newsItem && newsItem.id) {
      setEditingNews(newsItem);
      setFormData({
        title: newsItem.title || "",
        area: newsItem.area || "",
        reporter: newsItem.reporter || "",
        writer: newsItem.writer || "",
        documentation: newsItem.documentation || "",
        publishDate: newsItem.publishDate || "",
      });
    } else {
      setEditingNews(null);
      setFormData({
        title: "",
        area: "",
        reporter: "",
        writer: "",
        documentation: "",
        publishDate: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNews(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingNews) {
        await updateDoc(doc(db, "news", editingNews.id), {
          ...formData,
        });
      } else {
        await addDoc(collection(db, "news"), {
          ...formData,
          createdAt: serverTimestamp(),
          ownerId: user.uid,
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving news article:", error);
      alert("Gagal menyimpan data berita");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "news", deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting news article:", error);
      alert("Gagal menghapus data berita");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAndSortedNews = [...newsList]
    .filter(news => {
      const searchLower = searchQuery.toLowerCase();
      return (
        (news.title?.toLowerCase() || "").includes(searchLower) ||
        (news.reporter?.toLowerCase() || "").includes(searchLower) ||
        (news.writer?.toLowerCase() || "").includes(searchLower) ||
        (news.area?.toLowerCase() || "").includes(searchLower) ||
        (news.documentation?.toLowerCase() || "").includes(searchLower)
      );
    })
    .sort((a, b) => {
      const dateA = a.publishDate ? new Date(a.publishDate).getTime() : 0;
      const dateB = b.publishDate ? new Date(b.publishDate).getTime() : 0;
      return dateB - dateA; // Sort newest first
    });

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Publikasi Berita</h1>
          <p className="mt-1 text-sm text-gray-500">
            Daftar liputan artikel berita, wartawan, penulis, dan staf dokumentasi.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          {role !== "supervisor" && (
            <button
              onClick={(e) => { e.preventDefault(); handleOpenModal(); }}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Berita
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-red-500 focus:text-gray-900 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 sm:text-sm"
            placeholder="Cari berita..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col mobile-cards">
        <div className="-my-2 sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-[#FAFAFA]">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Judul Artikel</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Daerah Liputan</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Wartawan</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Penulis</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Dokumentasi</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tanggal Tayang</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Aksi</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredAndSortedNews.map((news) => {
                    return (
                      <tr key={news.id} className="hover:bg-gray-50 transition-colors">
                        <td data-label="Judul Artikel" className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {news.title}
                        </td>
                        <td data-label="Daerah Liputan" className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {news.area || "-"}
                        </td>
                        <td data-label="Wartawan" className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {news.reporter || "-"}
                        </td>
                        <td data-label="Penulis" className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {news.writer || "-"}
                        </td>
                        <td data-label="Dokumentasi" className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {news.documentation || "-"}
                        </td>
                        <td data-label="Tanggal Tayang" className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {news.publishDate ? format(new Date(news.publishDate), "dd MMM yyyy", { locale: idLocale }) : "-"}
                        </td>
                        <td data-label="Aksi" className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {role !== "supervisor" && (
                            <>
                              <button
                                onClick={(e) => { e.preventDefault(); handleOpenModal(news); }}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteId(news.id); }}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAndSortedNews.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-sm text-gray-500">
                        Belum ada data berita
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed z-[100] inset-0 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500/75 transition-opacity"
              aria-hidden="true"
              onClick={handleCloseModal}
            ></div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
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
                  <h3
                    className="text-lg leading-6 font-medium text-gray-900"
                    id="modal-title"
                  >
                    {editingNews ? "Edit Berita" : "Tambah Berita"}
                  </h3>
                  <div className="mt-4">
                    <form id="news-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Judul Artikel *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 sm:text-sm"
                      placeholder="Masukkan judul berita"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Daerah Liputan *</label>
                    <input
                      type="text"
                      required
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 sm:text-sm"
                      placeholder="Masukkan daerah liputan (misal: Jakarta)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Wartawan *</label>
                    <input
                      type="text"
                      required
                      value={formData.reporter}
                      onChange={(e) => setFormData({ ...formData, reporter: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 sm:text-sm"
                      placeholder="Nama wartawan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Penulis *</label>
                    <input
                      type="text"
                      required
                      value={formData.writer}
                      onChange={(e) => setFormData({ ...formData, writer: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 sm:text-sm"
                      placeholder="Nama penulis"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal Tayang</label>
                    <input
                      type="date"
                      value={formData.publishDate}
                      onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dokumentasi (Fotografer dll) *</label>
                    <input
                      type="text"
                      required
                      value={formData.documentation}
                      onChange={(e) => setFormData({ ...formData, documentation: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 sm:text-sm"
                      placeholder="Nama staf dokumentasi"
                    />
                  </div>
                    </form>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  form="news-form"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed z-[100] inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500/75" 
              aria-hidden="true" 
              onClick={() => {
                if (!isDeleting) setDeleteId(null);
              }}
            ></div>
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
            <div className="relative inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">Hapus Berita</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Apakah Anda yakin ingin menghapus artikel berita ini? Data yang dihapus tidak dapat dikembalikan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Menghapus...' : 'Hapus'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(null)}
                  disabled={isDeleting}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
