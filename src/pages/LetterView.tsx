import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Letter {
  id: string;
  type: 'penawaran' | 'invoice';
  number: string;
  date: string;
  clientName: string;
  clientAddress: string;
  items: any[];
  subTotal: number;
  content?: string;
  subject?: string;
}

export default function LetterView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [letter, setLetter] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrintWarning, setShowPrintWarning] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLetter = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'letters', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLetter({ id: docSnap.id, ...docSnap.data() } as Letter);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching letter:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLetter();
  }, [id]);

  const handlePrint = () => {
    if (window !== window.top) {
      setShowPrintWarning(true);
    }
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>;
  }

  if (!letter) {
    return <div className="text-center p-8">Dokumen tidak ditemukan.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto print:max-w-none print:w-full">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center">
          <button onClick={() => navigate('/letters')} className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            Detail {letter.type === 'invoice' ? 'Invoice' : 'Surat Penawaran'}
          </h1>
        </div>
        <button
          onClick={handlePrint}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <Printer className="h-4 w-4 mr-2" />
          Cetak / PDF
        </button>
      </div>

      {showPrintWarning && (
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md print:hidden">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Perhatian: Fitur Cetak Diblokir di Preview</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Browser memblokir fitur cetak saat aplikasi berjalan di dalam mode preview. 
                  Untuk mencetak atau menyimpan sebagai PDF, silakan buka aplikasi ini di <strong>tab baru</strong> dengan mengklik ikon panah (<span className="inline-block border border-gray-400 rounded px-1">↗</span>) di pojok kanan atas layar Anda.
                </p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowPrintWarning(false)}
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-700 underline"
                >
                  Tutup pesan ini
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-lg overflow-hidden sm:rounded-lg p-8 overflow-x-auto print:shadow-none print:p-0 print:overflow-visible print:block">
        <div 
          ref={componentRef} 
          className="print-container bg-white p-8 mx-auto relative print:p-0 print:block" 
          style={{ width: '210mm', minHeight: '330mm', color: '#000', fontFamily: 'Calibri, Arial, sans-serif' }}
        >
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
            <img 
              src="https://lh3.googleusercontent.com/d/1kwvd_i_n0IWw59fxQEnVD36mqEp7n1iA" 
              alt="Watermark" 
              className="w-[600px] h-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Header */}
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="w-1/3">
              <img 
                src="https://lh3.googleusercontent.com/d/1kwvd_i_n0IWw59fxQEnVD36mqEp7n1iA" 
                alt="Metaranews Logo" 
                className="h-32 w-auto object-contain mt-2"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="w-2/3 text-right pr-6 mt-4">
              <h1 className="text-2xl font-bold text-[#b31b1b]">PT. PORTAL DIGITAL MEDIA<br/>NUSANTARA</h1>
              <p className="text-sm mt-1 font-medium text-gray-800">Jl. Raya Kediri - Pare No. 30<br/>Dsn. Ngrancangan Ds. Wonojoyo Kec. Gurah Kab. Kediri<br/>Telp. 0354-4545845 - +62 811-3500-466</p>
            </div>
            {/* Red shape on the right edge */}
            <div className="absolute top-0 right-[-2rem] w-8 h-28 bg-[#b31b1b] rounded-l-2xl"></div>
          </div>

          <div className="relative z-10">
            {letter.type === 'invoice' ? (
            /* INVOICE TEMPLATE */
            <>
              <div className="text-right mb-8">
                <h2 className="text-4xl font-bold italic tracking-wider">INVOICE</h2>
              </div>
              
              <div className="flex justify-between mb-8">
                <div>
                  <p className="text-sm">KEPADA YTH:</p>
                  <h3 className="font-bold text-lg uppercase">{letter.clientName}</h3>
                  <p className="text-sm max-w-xs whitespace-pre-wrap">{letter.clientAddress}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">INVOICE #:<br/>{letter.number}</p>
                  <p className="text-sm mt-4">TANGGAL :<br/>{format(new Date(letter.date), 'd MMMM yyyy', { locale: idLocale }).toUpperCase()}</p>
                </div>
              </div>

              <table className="w-full mb-8 border-collapse border border-gray-800">
                <thead>
                  <tr className="bg-[#7a1c1c] text-white">
                    <th className="py-3 px-4 text-left font-bold border border-gray-800">DESKRIPSI</th>
                    <th className="py-3 px-4 text-center font-bold border border-gray-800">QTY</th>
                    <th className="py-3 px-4 text-center font-bold border border-gray-800">PERIODE<br/>TAYANG</th>
                    <th className="py-3 px-4 text-right font-bold border border-gray-800">HARGA</th>
                    <th className="py-3 px-4 text-right font-bold border border-gray-800">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {letter.items.map((item, index) => (
                    <tr key={index} className="bg-[#e6e6e6]">
                      <td className="py-4 px-4 text-sm border border-gray-800">{item.description}</td>
                      <td className="py-4 px-4 text-center text-sm border border-gray-800">{item.qty}</td>
                      <td className="py-4 px-4 text-center text-sm border border-gray-800">{item.period}</td>
                      <td className="py-4 px-4 text-right text-sm border border-gray-800">{formatCurrency(item.price)}</td>
                      <td className="py-4 px-4 text-right text-sm border border-gray-800">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                  {/* Fill empty space if items are few */}
                  {Array.from({ length: Math.max(0, 3 - letter.items.length) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="bg-[#e6e6e6]">
                      <td className="py-4 px-4 border border-gray-800">&nbsp;</td>
                      <td className="py-4 px-4 border border-gray-800">&nbsp;</td>
                      <td className="py-4 px-4 border border-gray-800">&nbsp;</td>
                      <td className="py-4 px-4 border border-gray-800">&nbsp;</td>
                      <td className="py-4 px-4 border border-gray-800">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-start">
                <div className="text-sm">
                  <p>PAYMENT:</p>
                  <p>BANK MANDIRI KC KEDIRI</p>
                  <p>Account No.: 171-00-1236940-4</p>
                  <p>PT. Portal Digital Media Nusantara</p>
                </div>
                <div className="w-1/2">
                  <div className="flex justify-between font-bold text-lg mb-2">
                    <span>SUB-TOTAL</span>
                    <span>: {formatCurrency(letter.subTotal)}</span>
                  </div>
                  <div className="bg-[#b31b1b] text-white text-center py-3 text-2xl font-bold rounded-l-full rounded-r-sm">
                    {formatCurrency(letter.subTotal)}
                  </div>
                </div>
              </div>

              <div className="mt-16 flex flex-col items-center">
                <p className="text-sm">HORMAT KAMI,</p>
                <p className="text-sm mb-4">PT. PORTAL DIGITAL MEDIA NUSANTARA</p>
                
                {/* Empty space for signature */}
                <div className="h-24 relative flex justify-center items-center mb-2">
                </div>
                
                <p className="text-sm font-bold">MOH. MUHSON AGIL SAPUTRA</p>
                <p className="text-sm font-bold">DIREKTUR</p>
              </div>
            </>
          ) : (
            /* PENAWARAN TEMPLATE */
            <>
              <div className="mb-8 text-sm">
                <table className="w-auto">
                  <tbody>
                    <tr>
                      <td className="pr-4 py-1">Nomor</td>
                      <td className="py-1">: {letter.number}</td>
                    </tr>
                    <tr>
                      <td className="pr-4 py-1">Lampiran</td>
                      <td className="py-1">: 1 (satu) berkas</td>
                    </tr>
                    <tr>
                      <td className="pr-4 py-1">Perihal</td>
                      <td className="py-1">: {letter.subject || 'Penawaran iklan di metaranews.co'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mb-6 text-sm">
                <p className="font-bold">Kepada</p>
                <p className="font-bold">Yth. {letter.clientName}</p>
                <p className="font-bold whitespace-pre-wrap">{letter.clientAddress}</p>
                <p className="mt-4">di Tempat</p>
              </div>

              <div className="text-sm space-y-4 text-justify mb-6 whitespace-pre-wrap">
                {letter.content ? (
                  <p>{letter.content}</p>
                ) : (
                  <>
                    <p>Dengan hormat,</p>
                    <p>Salam silaturrahim kami sampaikan, semoga Bapak/Ibu beserta seluruh staf senantiasa mendapat limpahan rahmat dari Tuhan Yang Maha Esa. Amin.</p>
                    <p><strong>Metaranews.co</strong> merupakan media online yang menyajikan berita-berita aktual secara cepat, akurat, terpercaya dan dikaji secara mendalam dan merupakan media efektif untuk menyebarkan informasi tanpa batas teritorial. Media ini bernaung di bawah <strong>PT Portal Digital Media Nusantara</strong>.</p>
                    <p>Metaranews.co yang menyajikan berita-berita khas dan khusus Jawa Timur hadir menjawab kebutuhan zaman, dengan semangat mengusung misi building, inspiring, dan positive thinking melalui portal berita <strong>metaranews.co</strong>. Dengan menggunakan <strong>metaranews.co</strong>, maka berita-berita lokal yang tersaji bisa dibaca dan dinikmati secara lokal, regional, nasional, maupun internasional.</p>
                    <p>Pada kesempatan ini, kami ingin mengajukan penawaran kerjasama dengan rincian sebagai berikut:</p>
                  </>
                )}
              </div>

              <table className="w-full mb-6 border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-red-600 text-white">
                    <th className="border border-black py-2 px-3 text-left">Paket Iklan</th>
                    <th className="border border-black py-2 px-3 text-left">Jenis Jasa</th>
                    <th className="border border-black py-2 px-3 text-left">Jumlah Tayang</th>
                    <th className="border border-black py-2 px-3 text-left">Harga</th>
                  </tr>
                </thead>
                <tbody>
                  {letter.items.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-black py-2 px-3">{item.description.split(' ')[0] || 'Advertorial'}</td>
                      <td className="border border-black py-2 px-3">{item.description}</td>
                      <td className="border border-black py-2 px-3">{item.qty}x tayang/{item.period}</td>
                      <td className="border border-black py-2 px-3">{formatCurrency(item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="text-sm mb-12">Demikian penawaran ini, atas kerjasamanya disampaikan terima kasih.</p>

              <div className="flex justify-end text-sm text-center">
                <div>
                  <p>Kediri, {format(new Date(letter.date), 'd MMMM yyyy', { locale: idLocale })}</p>
                  <p>Hormat kami,</p>
                  <p>PT Portal Digital Media Nusantara</p>
                  <div className="h-24 relative flex justify-center items-center">
                    {/* Placeholder for Signature/Stamp */}
                  </div>
                  <p className="font-bold underline">Moh. Muhson Agil S.</p>
                  <p>Direktur</p>
                </div>
              </div>
            </>
          )}
          </div>

          {/* Footer for both */}
          <div className="absolute bottom-0 left-0 right-0 z-10">
            <div className="relative">
              <div className="h-12 bg-[#b31b1b] w-full flex items-center px-8 text-white">
                <div className="flex items-center space-x-3">
                  {/* Instagram */}
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                  {/* Facebook */}
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                  {/* TikTok (Custom SVG) */}
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.23-1.13 4.4-2.86 5.8-1.74 1.4-4.14 2.05-6.38 1.7-2.22-.34-4.22-1.6-5.46-3.41-1.24-1.8-1.6-4.1-1.02-6.19.58-2.1 2.07-3.88 4.02-4.83 1.95-.94 4.27-1.1 6.34-.43v4.18c-1.07-.38-2.26-.35-3.3.16-1.04.5-1.86 1.4-2.25 2.47-.39 1.07-.3 2.29.25 3.3.56 1.01 1.55 1.75 2.68 2.01 1.13.26 2.34.04 3.32-.59.98-.63 1.63-1.66 1.83-2.8.06-.34.09-.69.09-1.04V.02h-1.32z"/>
                  </svg>
                  {/* YouTube */}
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-2 font-medium tracking-wider">METARANEWS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
