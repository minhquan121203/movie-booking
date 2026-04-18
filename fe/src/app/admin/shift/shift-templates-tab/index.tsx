'use client'

import { useState } from 'react'
import { ShiftTemplate } from '@/types/shift'
import {
  useShiftTemplates,
  useShiftTemplateMutations,
  ShiftTemplateCreateDTO,
} from '@/lib/api/shift-templates'

// Imports Components con
import TemplatesHeader from './templates-header'
import TemplatesTable from './templates-table'

// Imports Modals (Lưu ý: chỉnh lại đường dẫn nếu cần thiết, ví dụ lên 1 cấp thư mục)
import CreateTemplateModal from '../components/modals/create-template-modal'
import UpdateTemplateModal from '../components/modals/update-template-modal'
import ConfirmDeleteAlert from '../components/modals/confirm-delete-alert'

export default function ShiftTemplatesTab() {
  // 1. Quản lý State Modal
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [isUpdateOpen, setUpdateOpen] = useState(false)
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active')

  // 2. State dữ liệu đang chọn
  const [selectedTemplate, setSelectedTemplate] = useState<ShiftTemplate | null>(null)

  // 3. API Hooks (React Query)
  const { data: templates = [], isLoading } = useShiftTemplates({
    active: activeTab === 'active' ? true : false,
  })
  const { create, update, remove, activate } = useShiftTemplateMutations()

  const isCreating = create.isPending
  // const isUpdating = update.isPending; // Nếu cần dùng loading cho update
  // const isDeleting = remove.isPending; // Nếu cần dùng loading cho delete

  // --- Handlers ---
  const handleOpenEdit = (t: ShiftTemplate) => {
    setSelectedTemplate(t)
    setUpdateOpen(true)
  }

  const handleOpenDelete = (t: ShiftTemplate) => {
    setSelectedTemplate(t)
    setDeleteAlertOpen(true)
  }

  const handleCreateSubmit = async (formData: ShiftTemplateCreateDTO) => {
    await create.mutateAsync(formData)
    setCreateOpen(false) // Đóng modal sau khi thành công
  }

  const handleUpdateSubmit = async (formData: ShiftTemplateCreateDTO) => {
    if (!selectedTemplate) return
    await update.mutateAsync({
      id: selectedTemplate._id,
      data: formData,
    })
    setUpdateOpen(false)
  }

  const handleConfirmDelete = async () => {
    if (!selectedTemplate) return
    await remove.mutateAsync(selectedTemplate._id)
    setDeleteAlertOpen(false)
  }
  const handleActivate = async (t: ShiftTemplate) => {
    await activate.mutateAsync(t._id)
  }
  return (
    <div className="space-y-6">
      {/* Header Component */}
      <TemplatesHeader onCreate={() => setCreateOpen(true)} />

      {/* Table Component */}
      <TemplatesTable
        data={templates}
        isLoading={isLoading}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        onActivate={handleActivate}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Modals Area - Giữ logic popup tại container này */}
      <CreateTemplateModal
        open={isCreateOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreateSubmit}
        isLoading={isCreating}
      />

      <UpdateTemplateModal
        open={isUpdateOpen}
        onOpenChange={setUpdateOpen}
        initialData={selectedTemplate}
        onSubmit={handleUpdateSubmit}
      />

      <ConfirmDeleteAlert
        open={isDeleteAlertOpen}
        onOpenChange={setDeleteAlertOpen}
        onConfirm={handleConfirmDelete}
        title="Xóa Ca Mẫu?"
        description={`Bạn có chắc chắn muốn xóa ca "${selectedTemplate?.name}"? Các lịch làm việc trong quá khứ liên quan đến ca này vẫn sẽ được giữ lại.`}
      />
    </div>
  )
}
