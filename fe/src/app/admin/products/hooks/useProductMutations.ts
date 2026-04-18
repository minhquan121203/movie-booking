import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProduct, updateProduct, deleteProduct, uploadProductImage } from '@/lib/api/products'
import { ProductCreateDTO, ProductUpdateDTO } from '@/types/product'
import { useNotification } from '@/providers/NotificationProvider'

export function useProductMutations() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  const createMutation = useMutation({
    mutationFn: (data: ProductCreateDTO) => createProduct(data),
    onSuccess: () => {
      showSuccess('Thêm sản phẩm thành công!')
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductUpdateDTO }) => updateProduct(id, data),
    onSuccess: () => {
      showSuccess('Cập nhật sản phẩm thành công!')
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      showSuccess('Xoá sản phẩm thành công!')
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  const uploadImageMutation = useMutation({
    mutationFn: ({ productId, imageFile }: { productId: string; imageFile: File }) =>
      uploadProductImage(productId, imageFile),
    onSuccess: () => {
      showSuccess('Upload ảnh thành công!')
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (error: any) => showError('Lỗi upload ảnh!', error.response?.data?.message),
  })

  return { createMutation, updateMutation, deleteMutation, uploadImageMutation }
}
