'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Palette, Image, Users, LogOut, Eye } from 'lucide-react';
import ContentEditor from '@/components/admin/ContentEditor';
import RegistrationsTable from '@/components/admin/RegistrationsTable';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">FDP Certificate Management System</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="registrations" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Registrations</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </TabsTrigger>
          </TabsList>

          {/* Content Editor Tab */}
          <TabsContent value="content" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Certificate Content Editor</h2>
              <ContentEditor />
            </Card>
          </TabsContent>

          {/* Registrations Table Tab */}
          <TabsContent value="registrations" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">View Registrations</h2>
              <RegistrationsTable />
            </Card>
          </TabsContent>

          {/* Certificate Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Certificate Preview</h2>
              <CertificatePreview />
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function CertificatePreview() {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">Preview coming soon...</p>
      <p className="text-sm">This will show a live preview of the certificate with current settings.</p>
    </div>
  );
}
