import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
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
}

export default function LetterView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [letter, setLetter] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(true);
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

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: letter ? `${letter.type === 'invoice' ? 'Invoice' : 'Penawaran'}_${letter.number.replace(/\//g, '_')}` : 'Document',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>;
  }

  if (!letter) {
    return <div className="text-center p-8">Dokumen tidak ditemukan.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button onClick={() => navigate('/letters')} className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            Detail {letter.type === 'invoice' ? 'Invoice' : 'Surat Penawaran'}
          </h1>
        </div>
        <button
          onClick={() => handlePrint()}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <Printer className="h-4 w-4 mr-2" />
          Cetak / PDF
        </button>
      </div>

      <div className="bg-white shadow-lg overflow-hidden sm:rounded-lg p-8 overflow-x-auto">
        <div 
          ref={componentRef} 
          className="print-container bg-white p-8 mx-auto" 
          style={{ width: '210mm', minHeight: '297mm', color: '#000', fontFamily: 'Arial, sans-serif' }}
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-red-600 pb-4 mb-8">
            <div className="w-1/3">
              {/* Placeholder for Logo */}
              <div className="flex flex-col items-center w-32">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-red-600 font-bold text-6xl">M</div>
                </div>
                <div className="text-red-600 font-bold text-xl mt-2">Metara</div>
                <div className="text-red-600 text-[10px]">Setara Bercerita</div>
              </div>
            </div>
            <div className="w-2/3 text-right">
              <h1 className="text-2xl font-bold text-red-600">PT. PORTAL DIGITAL MEDIA<br/>NUSANTARA</h1>
              <p className="text-sm mt-1">Jl. Raya Kediri - Pare No. 30<br/>Dsn. Ngrancangan Ds. Wonojoyo Kec. Gurah Kab. Kediri<br/>Telp. 0354-4545845 - +62 811-3500-466</p>
            </div>
          </div>

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

              <table className="w-full mb-8 border-collapse">
                <thead>
                  <tr className="bg-[#7a1c1c] text-white">
                    <th className="py-3 px-4 text-left font-bold">DESKRIPSI</th>
                    <th className="py-3 px-4 text-center font-bold">QTY</th>
                    <th className="py-3 px-4 text-center font-bold">PERIODE<br/>TAYANG</th>
                    <th className="py-3 px-4 text-right font-bold">HARGA</th>
                    <th className="py-3 px-4 text-right font-bold">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {letter.items.map((item, index) => (
                    <tr key={index} className="bg-[#e6e6e6]">
                      <td className="py-4 px-4 text-sm">{item.description}</td>
                      <td className="py-4 px-4 text-center text-sm">{item.qty}</td>
                      <td className="py-4 px-4 text-center text-sm">{item.period}</td>
                      <td className="py-4 px-4 text-right text-sm">{formatCurrency(item.price)}</td>
                      <td className="py-4 px-4 text-right text-sm">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                  {/* Fill empty space if items are few */}
                  {Array.from({ length: Math.max(0, 3 - letter.items.length) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="bg-[#e6e6e6]">
                      <td className="py-4 px-4">&nbsp;</td>
                      <td className="py-4 px-4">&nbsp;</td>
                      <td className="py-4 px-4">&nbsp;</td>
                      <td className="py-4 px-4">&nbsp;</td>
                      <td className="py-4 px-4">&nbsp;</td>
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
                    {formatCurrency(letter.subTotal).replace(',00', '')}
                  </div>
                </div>
              </div>

              <div className="mt-16 text-center">
                <p className="text-sm mb-16">HORMAT KAMI,<br/>PT. PORTAL DIGITAL MEDIA NUSANTARA</p>
                <p className="text-sm font-bold">IMAM MUBAROQ, S.SOS.I<br/>PIMPINAN REDAKSI</p>
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
                      <td className="py-1">: Penawaran iklan di metaranews.co</td>
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

              <div className="text-sm space-y-4 text-justify mb-6">
                <p>Dengan hormat,</p>
                <p>Salam silaturrahim kami sampaikan, semoga Bapak/Ibu beserta seluruh staf senantiasa mendapat limpahan rahmat dari Tuhan Yang Maha Esa. Amin.</p>
                <p><strong>Metaranews.co</strong> merupakan media online yang menyajikan berita-berita aktual secara cepat, akurat, terpercaya dan dikaji secara mendalam dan merupakan media efektif untuk menyebarkan informasi tanpa batas teritorial. Media ini bernaung di bawah <strong>PT Portal Digital Media Nusantara</strong>.</p>
                <p>Metaranews.co yang menyajikan berita-berita khas dan khusus Jawa Timur hadir menjawab kebutuhan zaman, dengan semangat mengusung misi building, inspiring, dan positive thinking melalui portal berita <strong>metaranews.co</strong>. Dengan menggunakan <strong>metaranews.co</strong>, maka berita-berita lokal yang tersaji bisa dibaca dan dinikmati secara lokal, regional, nasional, maupun internasional.</p>
                <p>Pada kesempatan ini, kami ingin mengajukan penawaran kerjasama dengan rincian sebagai berikut:</p>
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
                    <div className="absolute opacity-20 text-red-600 text-6xl">M</div>
                  </div>
                  <p className="font-bold underline">Moh. Muhson Agil S.</p>
                  <p>Direktur</p>
                </div>
              </div>
            </>
          )}
          
          {/* Footer for both */}
          <div className="mt-16 border-t-8 border-red-600 pt-2 flex items-center text-xs text-white bg-red-600 px-4 py-2">
             <span className="mr-4">METARANEWS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
