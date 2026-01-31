'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import RegistrationCard from './RegistrationCard'
import { registrationSchema, RegistrationSchema } from './schema'

type MessageState = {
  type: 'success' | 'error' | ''
  text: string
}

export default function RegistrationForm() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<MessageState>({
    type: '',
    text: '',
  })

  const form = useForm<RegistrationSchema>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      title: 'Mr.',
      name: '',
      email: '',
      phone: '',
      organization: '',
    },
    mode: 'onBlur',
  })

  const onSubmit = async (values: RegistrationSchema) => {
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await res.json()

      // ✅ SUCCESS
      if (res.ok) {
        setMessage({
          type: 'success',
          text: 'Registration successful! Your certificate has been sent to your email.',
        })
        form.reset()
        return
      }

      // 🔴 SERVER-SIDE VALIDATION ERRORS (Zod)
      if (res.status === 400 && data?.type === 'validation') {
        const fieldErrors = data.errors || {}

        Object.entries(fieldErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            form.setError(field as keyof RegistrationSchema, {
              type: 'server',
              message: messages[0],
            })
          }
        })

        return
      }

      // 🟡 DUPLICATE REGISTRATION
      if (res.status === 409) {
        setMessage({
          type: 'error',
          text: data?.message || 'This email is already registered.',
        })
        return
      }

      // 🔴 GENERIC FAILURE
      setMessage({
        type: 'error',
        text: data?.message || 'Registration failed. Please try again.',
      })
    } catch (error) {
      console.error('Registration error:', error)
      setMessage({
        type: 'error',
        text: 'Something went wrong. Please try again later.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <RegistrationCard
      form={form}
      loading={loading}
      message={message}
      onSubmit={onSubmit}
    />
  )
}
