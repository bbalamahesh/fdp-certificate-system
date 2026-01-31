'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Download, Mail } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Registration {
  id: number;
  timestamp: string;
  title: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
}

export default function RegistrationsTable() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredData, setFilteredData] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRegistrations();
  }, []);

  useEffect(() => {
    // Filter data based on search term
    const filtered = registrations.filter(
      (reg) =>
        reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.organization.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchTerm, registrations]);

  const loadRegistrations = async () => {
    try {
      const response = await fetch('/api/admin/registrations');
      const data = await response.json();
      if (data.success) {
        setRegistrations(data.registrations);
        setFilteredData(data.registrations);
      }
    } catch (error) {
      console.error('Failed to load registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Title', 'Name', 'Email', 'Phone', 'Organization'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map((reg) =>
        [
          reg.timestamp,
          reg.title,
          reg.name,
          reg.email,
          reg.phone,
          reg.organization,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fdp-registrations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatDate = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Search and Export */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, or organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={loadRegistrations} variant="outline">
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Total Registrations</p>
          <p className="text-2xl font-bold text-blue-900">{registrations.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Showing</p>
          <p className="text-2xl font-bold text-green-900">{filteredData.length}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-600 font-medium">Latest Registration</p>
          <p className="text-sm font-medium text-purple-900">
            {registrations[0]?.name || 'No registrations yet'}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Organization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No registrations found
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">{reg.id}</TableCell>
                    <TableCell className="text-sm">{formatDate(reg.timestamp)}</TableCell>
                    <TableCell>{reg.title}</TableCell>
                    <TableCell className="font-medium">{reg.name}</TableCell>
                    <TableCell>{reg.email}</TableCell>
                    <TableCell>{reg.phone}</TableCell>
                    <TableCell>{reg.organization}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
