'use client'

import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function AppNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    const name = localStorage.getItem('adminUsername') || ''
    const userRole = localStorage.getItem('adminRole') || ''
    setIsAdmin(!!token)
    setUsername(name)
    setRole(userRole)
  }, [pathname])

  const links = useMemo(() => {
    const base = [{ href: '/', label: 'Home' }]

    if (isAdmin) {
      const authLinks = [
        { href: '/admin/dashboard', label: 'Dashboard' },
        { href: '/admin/events/new', label: 'Create Event' },
      ]
      return [...base, ...authLinks]
    }

    return [...base, { href: '/admin/login', label: 'Admin Login' }]
  }, [isAdmin])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUsername')
    localStorage.removeItem('adminRole')
    setIsAdmin(false)
    setUsername('')
    setRole('')
    router.push('/admin/login')
  }

  if (pathname?.startsWith('/api')) return null

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-bold tracking-wide">
            Certifyed
          </Link>

          <nav className="flex items-center gap-2">
            {links.map((item) => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant={active ? 'default' : 'ghost'} size="sm">
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {isAdmin ? (
            <>
              <span className="text-muted-foreground">
                {username ? `${username} (${role || 'ADMIN'})` : 'Admin'}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  )
}
