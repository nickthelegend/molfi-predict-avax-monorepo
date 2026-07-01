'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateAgentPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // MOCK: In a real app, this would call an API to save the agent metadata
      console.log('Registering agent:', { name, description, category });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      alert('Agent registration request submitted!');
      
      // Go to agents list
      router.push('/agents');
    } catch (error) {
      console.error('Error registering agent:', error);
      alert('Failed to register agent.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black text-white mb-8">Register New Agent</h1>
        
        <form onSubmit={handleRegister} className="bg-surface border border-outline/10 p-8 rounded-2xl shadow-xl flex flex-col gap-6">
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-2">Agent Name</label>
            <input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background border border-outline/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              placeholder="e.g. DeFi Assistant"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-2">Description</label>
            <textarea 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-background border border-outline/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors h-32 resize-none"
              placeholder="What does your agent do?"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-background border border-outline/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
            >
              <option value="general">General</option>
              <option value="trading">Trading</option>
              <option value="social">Social</option>
              <option value="development">Development</option>
            </select>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
                loading 
                  ? 'bg-outline-variant/30 cursor-not-allowed text-on-surface-variant' 
                  : 'bg-primary hover:bg-primary/90 hover:scale-[1.02] shadow-lg shadow-primary/20'
              }`}
            >
              {loading ? 'Submitting...' : 'Register Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
