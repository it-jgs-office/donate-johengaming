"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

export default function MessageFilterSettings() {
  const [filteredWords, setFilteredWords] = useState([]);
  const [newWord, setNewWord] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    fetchFilteredWords();
  }, []);

  const fetchFilteredWords = async () => {
    try {
      const res = await api.get('/api/creator/filtered-words');
      setFilteredWords(res.data.filteredWords || []);
    } catch (error) {
      console.error('Error fetching filtered words:', error);
      if (error.response?.status !== 401) {
        toast.error('Gagal memuat data filter');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = () => {
    const word = newWord.trim().toLowerCase();
    
    if (!word) {
      toast.error('Kata tidak boleh kosong');
      return;
    }

    if (word.length > 50) {
      toast.error('Kata maksimal 50 karakter');
      return;
    }

    if (filteredWords.includes(word)) {
      toast.error('Kata sudah ada dalam daftar');
      return;
    }

    if (filteredWords.length >= 100) {
      toast.error('Maksimal 100 kata yang bisa difilter');
      return;
    }

    setFilteredWords([...filteredWords, word]);
    setNewWord('');
  };

  const handleRemoveWord = (word) => {
    setFilteredWords(filteredWords.filter(w => w !== word));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/api/creator/filtered-words', { filteredWords });
      toast.success('Filter kata berhasil disimpan!');
    } catch (error) {
      console.error('Error saving filtered words:', error);
      if (error.response?.status !== 401) {
        toast.error('Gagal menyimpan filter kata');
      }
    } finally {
      setSaving(false);
    }
  };

  const getFilteredPreview = (message) => {
    if (!message) return '';
    let filtered = message;
    filteredWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      filtered = filtered.replace(regex, (match) => '*'.repeat(match.length));
    });
    return filtered;
  };

  if (loading) {
    return (
      <div className="jd-surface p-5">
        <div className="text-center text-xs font-bold text-[#607697]">Memuat filter...</div>
      </div>
    );
  }

  return (
    <div className="jd-surface p-5 sm:p-6 space-y-4">
      <div className="border-b-2 border-[#0F2A5F]/10 pb-3">
        <h3 className="font-black text-sm text-[#0F2A5F]">Sensor Kata</h3>
        <p className="text-xs font-medium text-[#526987] mt-0.5">
          Kata yang disensor akan diganti bintang (***) di overlay.
        </p>
      </div>

      {/* Input */}
      <div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddWord())}
            placeholder="Ketik kata..."
            className="flex-1 px-3.5 py-2 rounded-xl border-2 border-[#0F2A5F] bg-[#f7fcff] text-sm font-bold text-[#0F2A5F] placeholder:text-[#607697] outline-none focus:bg-white transition"
          />
          <button
            type="button"
            onClick={handleAddWord}
            className="px-4 py-2 rounded-xl border-2 border-[#0F2A5F] bg-[#0F2A5F] text-white text-xs font-extrabold shadow-[2px_2px_0px_#2563EB] hover:bg-black transition cursor-pointer active:translate-y-0.5"
          >
            Tambah
          </button>
        </div>
        <p className="text-[11px] font-bold text-[#607697] mt-1.5">{filteredWords.length}/100 kata terdaftar</p>
      </div>

      {/* Word List */}
      {filteredWords.length > 0 ? (
        <div className="bg-[#f7fcff] rounded-xl border-2 border-[#0F2A5F] p-3 max-h-40 overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {filteredWords.map((word, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 bg-[#ffffff] border-2 border-[#0F2A5F] rounded-lg px-2.5 py-1 text-xs font-extrabold text-[#0F2A5F] shadow-[1px_1px_0px_#0F2A5F]"
              >
                <span>{word}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveWord(word)}
                  className="text-red-500 hover:text-red-700 cursor-pointer font-black ml-0.5"
                  title="Hapus"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-4 rounded-xl border-2 border-dashed border-[#0F2A5F]/30 text-center text-xs font-bold text-[#607697]">
          Belum ada kata yang disensor.
        </div>
      )}

      {/* Test */}
      <div>
        <textarea
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          placeholder="Tes ketik pesan di sini..."
          rows="2"
          className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#0F2A5F] bg-[#f7fcff] text-sm font-medium text-[#0F2A5F] placeholder:text-[#607697] outline-none focus:bg-white resize-none transition"
        />
        {testMessage && (
          <div className="mt-2 p-3 rounded-xl border-2 border-[#0F2A5F] bg-emerald-100 text-xs shadow-[2px_2px_0px_#0F2A5F]">
            <span className="font-extrabold text-emerald-900 block mb-0.5">Hasil Preview:</span>
            <span className="text-emerald-950 font-medium">{getFilteredPreview(testMessage)}</span>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="pt-3 flex items-center justify-between border-t-2 border-[#0F2A5F]/10">
        <span className="text-[11px] font-bold text-[#607697]">Sensor kata utuh.</span>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-xl border-2 border-[#0F2A5F] bg-[#2563EB] text-[#0F2A5F] text-xs font-extrabold shadow-[2px_2px_0px_#0F2A5F] hover:bg-[#3B82F6] transition cursor-pointer disabled:opacity-50 active:translate-y-0.5"
        >
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </div>
  );
}
