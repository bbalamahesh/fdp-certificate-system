'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Settings {
  program_name: string;
  program_dates: string;
  department: string;
  faculty: string;
  institution: string;
  location: string;
  coordinator_name: string;
  hod_name: string;
}

export default function ContentEditor() {
  const [settings, setSettings] = useState<Settings>({
    program_name: '',
    program_dates: '',
    department: '',
    faculty: '',
    institution: '',
    location: '',
    coordinator_name: '',
    hod_name: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    loadSettings();
    setMessage({ type: 'info', text: 'Settings reset to last saved version' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Program Name */}
        <div className="space-y-2">
          <Label htmlFor="program_name">Program Name</Label>
          <Input
            id="program_name"
            value={settings.program_name}
            onChange={(e) =>
              setSettings({ ...settings, program_name: e.target.value })
            }
            placeholder="MASTERING DATA ANALYSIS USING R STUDIO"
          />
        </div>

        {/* Program Dates */}
        <div className="space-y-2">
          <Label htmlFor="program_dates">Program Dates</Label>
          <Input
            id="program_dates"
            value={settings.program_dates}
            onChange={(e) =>
              setSettings({ ...settings, program_dates: e.target.value })
            }
            placeholder="25-03-2025 and 26-03-2025"
          />
        </div>

        {/* Department */}
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={settings.department}
            onChange={(e) =>
              setSettings({ ...settings, department: e.target.value })
            }
            placeholder="Department of Business Administration"
          />
        </div>

        {/* Faculty */}
        <div className="space-y-2">
          <Label htmlFor="faculty">Faculty</Label>
          <Input
            id="faculty"
            value={settings.faculty}
            onChange={(e) =>
              setSettings({ ...settings, faculty: e.target.value })
            }
            placeholder="Faculty of Management"
          />
        </div>

        {/* Institution */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="institution">Institution</Label>
          <Input
            id="institution"
            value={settings.institution}
            onChange={(e) =>
              setSettings({ ...settings, institution: e.target.value })
            }
            placeholder="SRM Institute Of Science And Technology"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={settings.location}
            onChange={(e) =>
              setSettings({ ...settings, location: e.target.value })
            }
            placeholder="Ramapuram, Chennai"
          />
        </div>

        {/* Coordinator Name */}
        <div className="space-y-2">
          <Label htmlFor="coordinator_name">Coordinator Name (Optional)</Label>
          <Input
            id="coordinator_name"
            value={settings.coordinator_name}
            onChange={(e) =>
              setSettings({ ...settings, coordinator_name: e.target.value })
            }
            placeholder="Dr. John Doe"
          />
        </div>

        {/* HOD Name */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="hod_name">Head of Department Name (Optional)</Label>
          <Input
            id="hod_name"
            value={settings.hod_name}
            onChange={(e) =>
              setSettings({ ...settings, hod_name: e.target.value })
            }
            placeholder="Dr. Jane Smith"
          />
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : message.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> These changes will apply to all new certificates generated after saving.
          Existing certificates will not be affected.
        </p>
      </Card>
    </div>
  );
}
