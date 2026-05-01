'use client'

import { useState } from 'react'
import { useVouchers, Voucher } from './hooks/useVouchers'
import { VoucherToolbar } from './components/VoucherToolbar'
import { VoucherTable } from './components/VoucherTable'
import { VoucherDialog } from './components/VoucherDialog'

export default function VouchersPage() {
  const {
    vouchers, loading, searchTerm, setSearchTerm, page, setPage, totalPages,
    deleteVoucher, saveVoucher
  } = useVouchers()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)

  const handleOpenModal = (mode: 'create' | 'edit', voucher: Voucher | null = null) => {
    setModalMode(mode)
    setSelectedVoucher(voucher)
    setIsModalOpen(true)
  }

  return (
    <div className="p-8 w-full max-w-[1600px] mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Quản Lý Voucher</h1>
      
      <VoucherToolbar 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        onAdd={() => handleOpenModal('create')} 
      />

      <VoucherTable 
        vouchers={vouchers} 
        loading={loading} 
        page={page} 
        totalPages={totalPages} 
        setPage={setPage} 
        onEdit={(v) => handleOpenModal('edit', v)} 
        onDelete={deleteVoucher} 
      />

      <VoucherDialog 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        mode={modalMode} 
        initialData={selectedVoucher} 
        onSave={saveVoucher} 
      />
    </div>
  )
}