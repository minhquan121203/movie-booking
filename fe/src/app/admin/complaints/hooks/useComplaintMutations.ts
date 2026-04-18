import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createComplaint,
  updateComplaintStatus,
  updateComplaint,
  deleteComplaint,
  uploadComplaintAttachment,
  assignComplaint,
  escalateComplaint,
} from '@/lib/api/complaints'
import { ComplaintCreateDTO, ComplaintUpdateStatusDTO, ComplaintUpdateDTO } from '@/types/complaint'
import { useNotification } from '@/providers/NotificationProvider'

export function useComplaintMutations() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  // Create complaint (POST /staff/complaints)
  const createMutation = useMutation({
    mutationFn: (data: ComplaintCreateDTO) => createComplaint(data),
    onSuccess: () => {
      showSuccess('Tạo khiếu nại thành công!')
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
    },
    onError: (error: any) => {
      showError('Lỗi!', error.response?.data?.message || 'Không thể tạo khiếu nại')
    },
  })

  // Update complaint status (PUT /staff/complaints/{id}/status)
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ComplaintUpdateStatusDTO }) =>
      updateComplaintStatus(id, data),
    onSuccess: () => {
      showSuccess('Cập nhật trạng thái thành công!')
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      queryClient.invalidateQueries({ queryKey: ['complaintDetail'] })
    },
    onError: (error: any) => {
      showError('Lỗi!', error.response?.data?.message || 'Không thể cập nhật trạng thái')
    },
  })

  // Update complaint info (PUT /staff/complaints/{id})
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ComplaintUpdateDTO }) =>
      updateComplaint(id, data),
    onSuccess: () => {
      showSuccess('Cập nhật khiếu nại thành công!')
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      queryClient.invalidateQueries({ queryKey: ['complaintDetail'] })
    },
    onError: (error: any) => {
      showError('Lỗi!', error.response?.data?.message || 'Không thể cập nhật khiếu nại')
    },
  })

  // Delete complaint
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteComplaint(id),
    onSuccess: () => {
      showSuccess('Xoá khiếu nại thành công!')
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
    },
    onError: (error: any) => {
      showError('Lỗi!', error.response?.data?.message || 'Không thể xoá khiếu nại')
    },
  })

  // Upload attachment
  const uploadAttachmentMutation = useMutation({
    mutationFn: ({ complaintId, file }: { complaintId: string; file: File }) =>
      uploadComplaintAttachment(complaintId, file),
    onSuccess: () => {
      showSuccess('Upload file thành công!')
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      queryClient.invalidateQueries({ queryKey: ['complaintDetail'] })
    },
    onError: (error: any) => {
      showError('Lỗi upload!', error.response?.data?.message || 'Không thể upload file')
    },
  })

  // Assign complaint to staff
  const assignMutation = useMutation({
    mutationFn: ({ complaintId, staffId }: { complaintId: string; staffId: string }) =>
      assignComplaint(complaintId, staffId),
    onSuccess: () => {
      showSuccess('Phân công khiếu nại thành công!')
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      queryClient.invalidateQueries({ queryKey: ['complaintDetail'] })
    },
    onError: (error: any) => {
      showError('Lỗi!', error.response?.data?.message || 'Không thể phân công khiếu nại')
    },
  })

  // Escalate complaint
  const escalateMutation = useMutation({
    mutationFn: ({
      complaintId,
      data,
    }: {
      complaintId: string
      data: { escalatedTo: string; note: string }
    }) => escalateComplaint(complaintId, data),
    onSuccess: () => {
      showSuccess('Chuyển tiếp khiếu nại thành công!')
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      queryClient.invalidateQueries({ queryKey: ['complaintDetail'] })
    },
    onError: (error: any) => {
      showError('Lỗi!', error.response?.data?.message || 'Không thể chuyển tiếp khiếu nại')
    },
  })

  return {
    createMutation,
    updateStatusMutation,
    updateMutation,
    deleteMutation,
    uploadAttachmentMutation,
    assignMutation,
    escalateMutation,
  }
}
