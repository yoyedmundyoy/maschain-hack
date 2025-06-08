'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Activity, Hash, Clock } from 'lucide-react';

const API_BASE = 'http://localhost:3000/api';

export default function Home() {
  const [contracts, setContracts] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    abi: ''
  });

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    if (selectedContract) {
      loadEvents(selectedContract.id);
      // Refresh events every 5 seconds
      const interval = setInterval(() => loadEvents(selectedContract.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedContract]);

  const loadContracts = async () => {
    try {
      const response = await fetch(`${API_BASE}/contracts`);
      const data = await response.json();
      setContracts(data);
    } catch (error) {
      console.error('Error loading contracts:', error);
    }
  };

  const loadEvents = async (contractId) => {
    try {
      const response = await fetch(`${API_BASE}/contracts/${contractId}/events`);
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const addContract = async () => {
    try {
      let abi;
      try {
        abi = JSON.parse(formData.abi);
      } catch {
        alert('Invalid ABI JSON');
        return;
      }

      const response = await fetch(`${API_BASE}/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: formData.address,
          abi: abi
        })
      });

      if (response.ok) {
        setFormData({ address: '', abi: '' });
        setShowAddForm(false);
        loadContracts();
      } else {
        alert('Error adding contract');
      }
    } catch (error) {
      console.error('Error adding contract:', error);
      alert('Error adding contract');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            MasChain Contract Analytics
          </h1>
          <p className="text-gray-600">
            Monitor your smart contracts in real-time
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contracts List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Contracts</h2>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="space-y-3">
                {contracts.map((contract) => (
                  <div
                    key={contract.id}
                    onClick={() => setSelectedContract(contract)}
                    className={`p-3 rounded-lg cursor-pointer border-2 transition-colors ${
                      selectedContract?.id === contract.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-mono text-sm text-gray-800 truncate">
                      {contract.address}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Added {new Date(contract.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

              {contracts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Activity size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No contracts added yet</p>
                  <p className="text-sm">Add your first contract to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Events Display */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                {selectedContract ? 'Live Events' : 'Select a Contract'}
              </h2>

              {selectedContract ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Monitoring: <span className="font-mono">{selectedContract.address}</span>
                  </div>

                  {events.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {events.map((event) => (
                        <div key={event.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Activity size={16} className="text-green-500" />
                              <span className="font-semibold text-gray-900">
                                {event.event_name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Clock size={14} />
                              <span>
                                {new Date(event.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>

                          <div className="text-sm text-gray-600 mb-2">
                            <div className="flex items-center space-x-2">
                              <Hash size={14} />
                              <span className="font-mono truncate">
                                {event.transaction_hash}
                              </span>
                            </div>
                          </div>

                          {event.event_data && Object.keys(event.event_data).length > 0 && (
                            <div className="bg-gray-50 rounded p-3 mt-2">
                              <div className="text-xs font-semibold text-gray-700 mb-1">
                                Event Data:
                              </div>
                              <pre className="text-xs text-gray-600 overflow-x-auto">
                                {JSON.stringify(event.event_data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Activity size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No events detected yet</p>
                      <p className="text-sm">Events will appear here in real-time</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Hash size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Select a contract from the left to view its events</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Contract Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h3 className="text-lg font-semibold mb-4">Add Contract</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contract Address
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="0x..."
                    className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contract ABI (JSON)
                  </label>
                  <textarea
                    required
                    value={formData.abi}
                    onChange={(e) => setFormData({...formData, abi: e.target.value})}
                    placeholder='[{"type": "event", "name": "Transfer", ...}]'
                    rows={10}
                    className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={addContract}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
                  >
                    Add Contract
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}