import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Product, ProductCreateDTO } from '@/types/product'
import { useProductMutations } from '../hooks/useProductMutations'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback'

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productToEdit?: Product | null
}

export function ProductFormDialog({ open, onOpenChange, productToEdit }: ProductFormDialogProps) {
  const { createMutation, updateMutation, uploadImageMutation } = useProductMutations()
  const isEditMode = !!productToEdit

  const { register, handleSubmit, reset, setValue, watch } = useForm<ProductCreateDTO>({
    defaultValues: {
      name: '',
      slug: '',
      price: 0,
      originalPrice: 0,
      discount: 0,
      category: 'Popcorn',
      size: 'M',
      description: '',
      imageUrl: '',
      inStock: true,
      stockQuantity: 0,
      lowStockThreshold: 10,
      featured: false,
      isActive: true,
      calories: 0,
      allergens: [],
      tags: [],
    },
  })

  // State cho upload ảnh
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const imageUrl = watch('imageUrl')

  useEffect(() => {
    if (productToEdit) {
      setValue('name', productToEdit.name)
      setValue('slug', productToEdit.slug)
      setValue('price', productToEdit.price)
      setValue('originalPrice', productToEdit.originalPrice || 0)
      setValue('discount', productToEdit.discount || 0)
      setValue('category', productToEdit.category)
      setValue('size', productToEdit.size)
      setValue('description', productToEdit.description || '')
      setValue('imageUrl', productToEdit.imageUrl || '')
      setValue('inStock', productToEdit.inStock)
      setValue('stockQuantity', productToEdit.stockQuantity || 0)
      setValue('lowStockThreshold', productToEdit.lowStockThreshold || 10)
      setValue('featured', productToEdit.featured || false)
      setValue('isActive', productToEdit.isActive)
      setValue('calories', productToEdit.calories || 0)
      setPreviewUrl(productToEdit.imageUrl || '')
      setSelectedFile(null)
    } else {
      reset({
        name: '',
        slug: '',
        price: 0,
        originalPrice: 0,
        discount: 0,
        category: 'Popcorn',
        size: 'M',
        description: '',
        imageUrl: '',
        inStock: true,
        stockQuantity: 0,
        lowStockThreshold: 10,
        featured: false,
        isActive: true,
      })
      setPreviewUrl('')
      setSelectedFile(null)
    }
  }, [productToEdit, open, reset, setValue])

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh!')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 5MB!')
        return
      }

      setSelectedFile(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Clear selected file
  const clearFile = () => {
    setSelectedFile(null)
    setPreviewUrl(imageUrl || '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Upload image after creating/updating product
  const uploadImageIfNeeded = async (productId: string) => {
    if (selectedFile) {
      try {
        const result = await uploadImageMutation.mutateAsync({
          productId,
          imageFile: selectedFile,
        })
        // Update imageUrl with the uploaded URL
        if (result?.data?.url) {
          setValue('imageUrl', result.data.url)
        }
      } catch (error) {
        console.error('Upload image error:', error)
      }
    }
  }

  const onSubmit = async (data: ProductCreateDTO) => {
    try {
      if (isEditMode && productToEdit) {
        // Update product first
        await updateMutation.mutateAsync({ id: productToEdit._id, data })
        // Then upload image if file is selected
        await uploadImageIfNeeded(productToEdit._id)
        onOpenChange(false)
      } else {
        // Create product first
        const result = await createMutation.mutateAsync(data)
        // Then upload image if file is selected
        if (result?.data?._id) {
          await uploadImageIfNeeded(result.data._id)
        }
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  const isLoading =
    createMutation.isPending || updateMutation.isPending || uploadImageMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-50 text-gray-900">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Tên & Slug */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tên sản phẩm *</Label>
                <Input {...register('name', { required: true })} placeholder="Bắp rang bơ lớn" />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input {...register('slug', { required: true })} placeholder="bap-rang-bo-lon" />
              </div>
            </div>

            {/* Category & Size */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Danh mục *</Label>
                <Select
                  onValueChange={(val: any) => setValue('category', val)}
                  defaultValue={productToEdit?.category || 'Popcorn'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Popcorn">Bắp rang</SelectItem>
                    <SelectItem value="Drink">Nước uống</SelectItem>
                    <SelectItem value="Combo">Combo</SelectItem>
                    <SelectItem value="Snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Size</Label>
                <Select
                  onValueChange={(val: any) => setValue('size', val)}
                  defaultValue={productToEdit?.size || 'M'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S">S - Small</SelectItem>
                    <SelectItem value="M">M - Medium</SelectItem>
                    <SelectItem value="L">L - Large</SelectItem>
                    <SelectItem value="XL">XL - Extra Large</SelectItem>
                    <SelectItem value="N/A">N/A - Không áp dụng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Giá bán (VNĐ) *</Label>
                <Input
                  type="number"
                  {...register('price', { valueAsNumber: true, required: true })}
                  placeholder="50000"
                />
              </div>
              <div>
                <Label>Giá gốc (VNĐ)</Label>
                <Input
                  type="number"
                  {...register('originalPrice', { valueAsNumber: true })}
                  placeholder="60000"
                />
              </div>
              <div>
                <Label>Giảm giá (%)</Label>
                <Input
                  type="number"
                  {...register('discount', { valueAsNumber: true, min: 0, max: 100 })}
                  placeholder="20"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            {/* Stock */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Số lượng tồn kho *</Label>
                <Input
                  type="number"
                  {...register('stockQuantity', { valueAsNumber: true, required: true })}
                  placeholder="100"
                />
              </div>
              <div>
                <Label>Ngưỡng cảnh báo hết hàng</Label>
                <Input
                  type="number"
                  {...register('lowStockThreshold', { valueAsNumber: true })}
                  placeholder="10"
                />
              </div>
            </div>

            {/* Nutrition */}
            <div>
              <Label>Calories (kcal)</Label>
              <Input
                type="number"
                {...register('calories', { valueAsNumber: true })}
                placeholder="250"
              />
            </div>

            {/* Description */}
            <div>
              <Label>Mô tả</Label>
              <Textarea
                {...register('description')}
                placeholder="Nhập mô tả sản phẩm..."
                className="h-20"
              />
            </div>

            {/* ✨ NEW: Upload Image Section */}
            <div className="space-y-2">
              <Label>Hình ảnh sản phẩm</Label>

              {/* Preview */}
              {previewUrl && (
                <div className="relative w-40 h-40 rounded-lg overflow-hidden border-2 border-gray-300">
                  <ImageWithFallback
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={clearFile}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}

              {/* Upload Button */}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload size={16} />
                  {selectedFile ? 'Chọn ảnh khác' : 'Chọn ảnh từ máy'}
                </Button>
                {selectedFile && (
                  <span className="text-sm text-gray-600 self-center truncate max-w-xs">
                    {selectedFile.name}
                  </span>
                )}
              </div>

              {/* Manual URL Input (fallback) */}
              <div className="pt-2">
                <Label className="text-sm text-gray-500">Hoặc nhập URL hình ảnh</Label>
                <Input
                  {...register('imageUrl')}
                  placeholder="https://example.com/product.jpg"
                  onChange={e => {
                    setValue('imageUrl', e.target.value)
                    if (e.target.value && !selectedFile) {
                      setPreviewUrl(e.target.value)
                    }
                  }}
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inStock"
                  checked={watch('inStock')}
                  onCheckedChange={checked => setValue('inStock', checked as boolean)}
                />
                <Label htmlFor="inStock" className="cursor-pointer">
                  Còn hàng
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={watch('featured')}
                  onCheckedChange={checked => setValue('featured', checked as boolean)}
                />
                <Label htmlFor="featured" className="cursor-pointer">
                  Sản phẩm nổi bật
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={watch('isActive')}
                  onCheckedChange={checked => setValue('isActive', checked as boolean)}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Đang hoạt động
                </Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="default" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading} variant="default">
              {isLoading ? 'Đang lưu...' : isEditMode ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
