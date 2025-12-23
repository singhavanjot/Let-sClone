/**
 * Settings Page
 * User and device settings
 */

import { useState, useEffect } from 'react';
import { 
  FiUser, 
  FiMail, 
  FiLock, 
  FiMonitor, 
  FiTrash2,
  FiPlus,
  FiSave
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { Card, Button, Input, DeviceCard, LoadingSpinner } from '../components';
import { useAuthStore, useDeviceStore } from '../store';

function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');

  const { user, updateProfile, changePassword } = useAuthStore();
  const { 
    devices, 
    isLoading: devicesLoading, 
    fetchDevices, 
    registerDevice, 
    deleteDevice 
  } = useDeviceStore();

  // Load user data
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  // Load devices
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await updateProfile(profileData);
    
    if (result.success) {
      toast.success('Profile updated successfully');
    } else {
      toast.error(result.error);
    }

    setIsSubmitting(false);
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);

    const result = await changePassword(
      passwordData.currentPassword,
      passwordData.newPassword
    );
    
    if (result.success) {
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } else {
      toast.error(result.error);
    }

    setIsSubmitting(false);
  };

  // Handle add device
  const handleAddDevice = async (e) => {
    e.preventDefault();
    
    if (!newDeviceName.trim()) {
      toast.error('Please enter a device name');
      return;
    }

    const result = await registerDevice({
      name: newDeviceName.trim(),
      type: 'desktop'
    });

    if (result.success) {
      toast.success('Device added successfully');
      setNewDeviceName('');
    } else {
      toast.error(result.error);
    }
  };

  // Handle delete device
  const handleDeleteDevice = async (device) => {
    if (!window.confirm(`Delete device "${device.name}"?`)) {
      return;
    }

    const result = await deleteDevice(device.deviceId);
    
    if (result.success) {
      toast.success('Device deleted');
    } else {
      toast.error(result.error);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'security', label: 'Security', icon: FiLock },
    { id: 'devices', label: 'Devices', icon: FiMonitor }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-dark-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center px-4 py-3 font-medium transition-colors
                border-b-2 -mb-px
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-gray-400 hover:text-white'
                }
              `}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <h2 className="text-lg font-medium text-white mb-6">Profile Information</h2>
          
          <form onSubmit={handleProfileUpdate} className="space-y-5 max-w-md">
            <Input
              label="Full Name"
              type="text"
              icon={FiUser}
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              placeholder="Your name"
            />

            <Input
              label="Email Address"
              type="email"
              icon={FiMail}
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              placeholder="you@example.com"
            />

            <Button
              type="submit"
              icon={FiSave}
              loading={isSubmitting}
            >
              Save Changes
            </Button>
          </form>
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card>
          <h2 className="text-lg font-medium text-white mb-6">Change Password</h2>
          
          <form onSubmit={handlePasswordChange} className="space-y-5 max-w-md">
            <Input
              label="Current Password"
              type="password"
              icon={FiLock}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              placeholder="••••••••"
            />

            <Input
              label="New Password"
              type="password"
              icon={FiLock}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              placeholder="••••••••"
            />

            <Input
              label="Confirm New Password"
              type="password"
              icon={FiLock}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="••••••••"
            />

            <Button
              type="submit"
              icon={FiSave}
              loading={isSubmitting}
            >
              Change Password
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-dark-700">
            <h3 className="text-lg font-medium text-white mb-4">Account Security</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>• Use a strong password with at least 8 characters</li>
              <li>• Include uppercase, lowercase, and numbers</li>
              <li>• Don't reuse passwords from other accounts</li>
              <li>• Keep your session codes private</li>
            </ul>
          </div>
        </Card>
      )}

      {/* Devices Tab */}
      {activeTab === 'devices' && (
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-medium text-white mb-4">Add New Device</h2>
            
            <form onSubmit={handleAddDevice} className="flex space-x-4">
              <Input
                type="text"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="Device name (e.g., My Work PC)"
                className="flex-1"
              />
              <Button type="submit" icon={FiPlus}>
                Add Device
              </Button>
            </form>
          </Card>

          <Card>
            <h2 className="text-lg font-medium text-white mb-4">Your Devices</h2>
            
            {devicesLoading ? (
              <LoadingSpinner className="py-8" />
            ) : devices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {devices.map((device) => (
                  <DeviceCard
                    key={device.deviceId}
                    device={device}
                    onDelete={handleDeleteDevice}
                    showActions={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiMonitor className="w-12 h-12 mx-auto text-gray-500 mb-4" />
                <p className="text-gray-400">No devices registered</p>
                <p className="text-sm text-gray-500 mt-1">
                  Add a device to start hosting sessions
                </p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export default Settings;
