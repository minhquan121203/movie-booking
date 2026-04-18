import { Product } from '@/types/product'
import { PaymentDetails } from '@/types/booking'

// UI State Types
export type Step = {
  number: number
  label: string
}

// Item trong giỏ hàng
export interface CartItem {
  product: Product
  quantity: number
}

// Payment Method
export type PaymentMethodType = PaymentDetails['paymentMethod']

import { User } from '@/types/user'
export interface UserProfile extends User {
  dateOfBirth?: string
  preferences?: {
    emailNotification: boolean
    smsNotification: boolean
  }
}
