"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminData } from "@/hooks/useAdminData";
import AdminSidebar from "@/components/organisms/AdminSidebar";
import AdminDashboard from "@/components/organisms/AdminDashboard";
import PayoutSection from "@/components/organisms/PayoutSection";
import CreatorSection from "@/components/organisms/CreatorSection";
import FeedbackSection from "@/components/organisms/FeedbackSection";
import PayoutNotesModal from "@/components/organisms/PayoutNotesModal";
import CreatorDetailModal from '../../components/organisms/CreatorDetailModal';
import ServiceFeeSettings from '@/components/organisms/ServiceFeeSettings';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const sectionTitles = {
  dashboard: 'Dashboard',
  creator: 'Kreator',
  payout: 'Payout',
  feedback: 'Feedback & Saran',
  settings: 'Biaya Layanan',
};

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthChecking } = useAdminAuth();
  const { data, loading, errors, refetch } = useAdminData();
  
  // UI state
  const [activeSection, setActiveSection] = useState('dashboard');
  const [search, setSearch] = useState("");
  const [ttsUpdatingId, setTtsUpdatingId] = useState(null);
  const [serviceFeeSaving, setServiceFeeSaving] = useState(false);
  const knownPayoutIdsRef = useRef(new Set());
  const payoutSnapshotReadyRef = useRef(false);

  const pendingPayoutCount = Array.isArray(data.payouts)
    ? data.payouts.filter((payout) => ['PENDING', 'APPROVED'].includes(payout.status)).length
    : 0;
  
  // Modal state
  const [modalState, setModalState] = useState({
    showNotes: false,
    notesType: '',
    notesId: null,
    notesInput: '',
    showCreatorDetail: false,
    selectedCreator: null
  });

  useEffect(() => {
    if (loading.payouts || errors.payouts) return;

    const payouts = Array.isArray(data.payouts) ? data.payouts : [];
    const payoutIds = new Set(payouts.map((payout) => String(payout._id || payout.id)));

    if (!payoutSnapshotReadyRef.current) {
      knownPayoutIdsRef.current = payoutIds;
      payoutSnapshotReadyRef.current = true;
      return;
    }

    const newPayout = payouts.find((payout) => {
      const payoutId = String(payout._id || payout.id);
      return payout.status === 'PENDING' && !knownPayoutIdsRef.current.has(payoutId);
    });

    knownPayoutIdsRef.current = payoutIds;

    if (newPayout) {
      toast.success(`Pengajuan payout baru dari @${newPayout.creatorUsername || 'kreator'}`, {
        duration: 6000,
      });
    }
  }, [data.payouts, loading.payouts, errors.payouts]);

  // Handlers
  const openNotesModal = (id, type) => {
    setModalState(prev => ({
      ...prev,
      showNotes: true,
      notesType: type,
      notesId: id,
      notesInput: ''
    }));
  };

  const handleSubmitNotes = async () => {
    if (!modalState.notesId) return;
    
    try {
      await axios.put(`/api/admin/payouts`, { 
        id: modalState.notesId, 
        status: modalState.notesType, 
        notes: modalState.notesInput 
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      toast.success(modalState.notesType === 'PROCESSED' ? 'Payout berhasil diproses!' : 'Payout ditolak!');
      setModalState(prev => ({ ...prev, showNotes: false, notesId: null, notesType: '', notesInput: '' }));
      refetch.payouts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal memproses payout!');
    }
  };
  const handleDelete = async (creatorId) => {
    // Custom toast confirmation
    const confirmDelete = () => {
      return new Promise((resolve) => {
        toast((t) => (
          <div className="flex flex-col gap-3">
            <div className="font-bold text-[#0F2A5F] dark:text-[#EFF6FF]">
              Hapus Creator?
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Akun creator ini akan dihapus permanen beserta semua data terkait
            </div>
            <div className="flex gap-2 justify-end">
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
              >
                Batal
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
              >
                Hapus
              </button>
            </div>
          </div>
        ), { 
          duration: Infinity,
          style: {
            background: '#fff',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }
        });
      });
    };

    const confirmed = await confirmDelete();
    if (!confirmed) return;
    
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/admin/creators/${creatorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Creator berhasil dihapus!');
      refetch.creators();
    } catch (err) {
      console.error('Delete creator error:', err);
      toast.error(err.response?.data?.error || 'Gagal menghapus creator!');
    }
  };

  const handleToggleTts = async (creator, enabled) => {
    setTtsUpdatingId(creator._id);

    try {
      const token = localStorage.getItem("token");
      await axios.patch(`/api/admin/creators/${creator._id}/tts`, { enabled }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Auto baca ${enabled ? 'diaktifkan' : 'dinonaktifkan'} untuk ${creator.username}`);
      await refetch.creators();
    } catch (err) {
      console.error('Update creator TTS error:', err);
      toast.error(err.response?.data?.message || 'Gagal mengubah pengaturan auto baca!');
    } finally {
      setTtsUpdatingId(null);
    }
  };

  const handleFeedbackStatusChange = async (id, status, adminNotes) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put('/api/admin/feedback', 
        { id, status, adminNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Status feedback berhasil diupdate!');
      refetch.feedbacks();
    } catch (err) {
      console.error('Update feedback error:', err);
      toast.error(err.response?.data?.error || 'Gagal mengupdate feedback!');
    }
  };

  const handleFeedbackDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/admin/feedback?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Feedback berhasil dihapus!');
      refetch.feedbacks();
    } catch (err) {
      console.error('Delete feedback error:', err);
      toast.error(err.response?.data?.error || 'Gagal menghapus feedback!');
    }
  };

  const handleSaveServiceFee = async (percentage) => {
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      toast.error('Masukkan persentase antara 0 sampai 100');
      return;
    }

    try {
      setServiceFeeSaving(true);
      await axios.put('/api/admin/settings/service-fee', { percentage }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      await refetch.settings();
      toast.success('Biaya layanan berhasil disimpan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan biaya layanan');
    } finally {
      setServiceFeeSaving(false);
    }
  };

  const handleLogout = () => {
    toast.dismiss();
    toast((t) => (
      <div className="flex flex-col space-y-2">
        <span className="font-medium">Yakin ingin keluar?</span>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              
              // Set manual logout flag FIRST to prevent "sesi berakhir" toast
              const { sessionManager } = await import('@/utils/sessionManager');
              sessionManager.isManualLogout = true;
              
              // Clear all auth data
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              sessionStorage.clear();
              
              toast.success('Berhasil logout!', { duration: 1000 });
              
              setTimeout(() => {
                router.replace('/login');
                sessionManager.isManualLogout = false; // Reset flag
                setTimeout(() => {
                  window.location.href = '/login';
                }, 100);
              }, 500);
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium"
          >
            Ya, Keluar
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium"
          >
            Batal
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  if (isAuthChecking || !user) {
    return null;
  }

  return (
    <div className="jd-app-shell jd-admin-shell flex text-[#10264D] font-sans">
      <AdminSidebar 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onLogout={handleLogout}
        user={user}
        payoutPendingCount={pendingPayoutCount}
      />
      
      <main className="min-w-0 flex-grow pt-16 lg:pl-[296px] lg:pt-0">
        <header className="flex h-24 items-center justify-between px-5 text-white sm:px-7 lg:h-28 lg:px-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-blue-100">
              <span>Admin</span>
              <span>/</span>
              <span>{sectionTitles[activeSection]}</span>
            </div>
            <h1 className="mt-1 text-xl font-bold tracking-tight">{sectionTitles[activeSection]}</h1>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-right">
              <p className="text-xs font-semibold text-white">{user?.displayName || user?.username || 'Administrator'}</p>
              <p className="mt-0.5 text-[11px] text-blue-100">Panel administrator</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-bold ring-1 ring-white/25">
              {(user?.displayName || user?.username || 'A').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="mx-auto min-h-[calc(100vh-7rem)] max-w-[1600px] px-4 pb-8 sm:px-7 lg:px-8">
          {activeSection === 'dashboard' && (
            <AdminDashboard 
              creators={data.creators}
              payouts={data.payouts}
              donations={data.donations}
            />
          )}
          
          {activeSection === 'payout' && (
            <PayoutSection 
              payouts={data.payouts}
              loading={loading.payouts}
              error={errors.payouts}
              onOpenNotesModal={openNotesModal}
            />
          )}
            {activeSection === 'creator' && (
            <CreatorSection 
              creators={data.creators}
              search={search}
              onSearchChange={(e) => setSearch(e.target.value)}
              onCreatorClick={(creator) => setModalState(prev => ({ 
                ...prev, 
                showCreatorDetail: true, 
                selectedCreator: creator 
              }))}
              onDelete={handleDelete}
              onToggleTts={handleToggleTts}
              ttsUpdatingId={ttsUpdatingId}
            />
          )}

          {activeSection === 'feedback' && (
            <FeedbackSection
              feedbacks={data.feedbacks}
              loading={loading.feedbacks}
              error={errors.feedbacks}
              counts={data.feedbackCounts}
              onStatusChange={handleFeedbackStatusChange}
              onDelete={handleFeedbackDelete}
              onRefresh={refetch.feedbacks}
            />
          )}

          {activeSection === 'settings' && (
            <ServiceFeeSettings
              percentage={data.serviceFeePercentage}
              saving={serviceFeeSaving}
              onSave={handleSaveServiceFee}
            />
          )}
        </div>
      </main>

      <PayoutNotesModal 
        isOpen={modalState.showNotes}
        type={modalState.notesType}
        notes={modalState.notesInput}
        onNotesChange={(e) => setModalState(prev => ({ ...prev, notesInput: e.target.value }))}
        onClose={() => setModalState(prev => ({ ...prev, showNotes: false }))}
        onSubmit={handleSubmitNotes}
      />

      {modalState.showCreatorDetail && modalState.selectedCreator && (
        <CreatorDetailModal
          creator={modalState.selectedCreator}
          onClose={() => setModalState(prev => ({ 
            ...prev, 
            showCreatorDetail: false, 
            selectedCreator: null 
          }))}
        />
      )}
    </div>
  );
}
