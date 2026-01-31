import * as z from 'zod'

export const registrationSchema = z.object({
  title: z.string().min(1, 'Please select a title'),

  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .regex(/^[a-zA-Z\s.]+$/, 'Name can only contain letters and spaces'),

  email: z
    .string()
    .email('Please enter a valid email address'),

  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),

  organization: z
    .string()
    .min(3, 'Organization name is required'),
})

export type RegistrationSchema = z.infer<typeof registrationSchema>
