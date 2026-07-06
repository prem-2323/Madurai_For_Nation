import React from 'react';
import { Shield, Bell, Globe, Lock, Server } from 'lucide-react';

export const Settings: React.FC = () => {
  const sections = [
    {
      title: 'Platform Settings',
      icon: Server,
      items: [
        { label: 'Application Name', value: 'CleanAir AI' },
        { label: 'Environment', value: 'Production' },
        { label: 'API Version', value: 'v1.0.0' },
      ]
    },
    {
      title: 'Security',
      icon: Lock,
      items: [
        { label: 'JWT Expiry', value: '7 days' },
        { label: 'Password Policy', value: 'Minimum 8 characters' },
        { label: 'Session Management', value: 'Single session per user' },
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { label: 'Alert Channels', value: 'In-app, Email' },
        { label: 'Critical Alert Threshold', value: 'AQI > 200' },
        { label: 'Auto Dispatch', value: 'Enabled for Critical alerts' },
      ]
    },
    {
      title: 'Integration',
      icon: Globe,
      items: [
        { label: 'Gemini AI Model', value: 'gemini-2.5-flash' },
        { label: 'OpenWeather API', value: 'Connected' },
        { label: 'Map Provider', value: 'OpenStreetMap + Leaflet' },
      ]
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <div className="space-y-1">
        <span className="text-xs font-bold text-secondary uppercase tracking-widest block">Administration</span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-text">Platform configuration and environment preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sections.map((section) => (
          <div key={section.title} className="glass-panel rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <section.icon className="w-5 h-5 text-secondary" />
              </div>
              <h2 className="text-lg font-bold text-white">{section.title}</h2>
            </div>
            <div className="space-y-3">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-muted-text">{item.label}</span>
                  <span className="text-sm text-white font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};