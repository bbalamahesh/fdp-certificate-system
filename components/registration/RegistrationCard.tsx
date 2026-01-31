import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'

import { UseFormReturn } from 'react-hook-form'
import { RegistrationSchema } from './schema'

type Props = {
  form: UseFormReturn<RegistrationSchema>
  loading: boolean
  message: { type: string; text: string }
  onSubmit: (values: RegistrationSchema) => void
}

export default function RegistrationCard({
  form,
  loading,
  message,
  onSubmit,
}: Props) {
  return (
    <Card className="w-full max-w-2xl rounded-2xl shadow-xl">
      {/* Header */}
      <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl text-white">
        <CardTitle className="text-3xl font-bold">FDP Registration</CardTitle>
        <CardDescription className="text-blue-100">
          - Mastering Data Analysis Using R Studio - 
        </CardDescription>
        <p className="text-sm text-blue-100">
          25-03-2025 & 26-03-2025
        </p>
      </CardHeader>

      <CardContent className="p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Prof.">Prof.</SelectItem>
                      <SelectItem value="Dr.">Dr.</SelectItem>
                      <SelectItem value="Mr.">Mr.</SelectItem>
                      <SelectItem value="Ms.">Ms.</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your.email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="10-digit mobile number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Organization */}
            <FormField
              control={form.control}
              name="organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization / Institution</FormLabel>
                  <FormControl>
                    <Input placeholder="Your institution name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* API Message */}
            {message.text && (
              <Alert
                className={
                  message.type === 'success'
                    ? 'border-green-300 bg-green-50 text-green-800'
                    : 'border-red-300 bg-red-50 text-red-800'
                }
              >
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processing…' : 'Register & Get Certificate'}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex flex-col text-center text-sm text-gray-600 bg-gray-50 rounded-b-2xl">
        <p>Department of Business Administration</p>
        <p>SRM Institute of Science and Technology, Ramapuram</p>
      </CardFooter>
    </Card>
  )
}
