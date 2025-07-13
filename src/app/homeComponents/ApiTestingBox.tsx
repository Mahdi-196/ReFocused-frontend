"use client";

import { useState } from 'react';

interface ApiResponse {
  status: number;
  data: any;
  error?: string;
}

const ApiTestingBox = () => {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [claudeLoading, setClaudeLoading] = useState(false);
  const [endpoint, setEndpoint] = useState('/api/test');

  const testApiCall = async () => {
    setLoading(true);
    setResponse(null);
    
    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await res.json();
      
      setResponse({
        status: res.status,
        data: data,
      });
    } catch (error) {
      setResponse({
        status: 500,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const testClaudeAPI = async () => {
    setClaudeLoading(true);
    setResponse(null);
    
    try {
      const res = await fetch('/api/claude/mind-fuel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await res.json();
      
      setResponse({
        status: res.status,
        data: data,
      });
    } catch (error) {
      setResponse({
        status: 500,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setClaudeLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 w-full max-w-md mx-auto" style={{ minHeight: '300px', minWidth: '300px' }}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">API Testing Box</h3>
      
      <div className="mb-4">
        <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700 mb-2">
          API Endpoint:
        </label>
        <input
          id="endpoint"
          type="text"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="/api/test"
        />
      </div>
      
      <button
        onClick={testApiCall}
        disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-md transition duration-200 mb-2"
      >
        {loading ? 'Testing...' : 'Test API Call'}
      </button>
      
      <button
        onClick={testClaudeAPI}
        disabled={claudeLoading}
        className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white font-medium py-2 px-4 rounded-md transition duration-200 mb-4"
      >
        {claudeLoading ? 'Generating Mind Fuel...' : 'Test Claude API - Mind Fuel'}
      </button>
      
      {response && (
        <div className="bg-gray-50 rounded-md p-3 max-h-40 overflow-y-auto">
          <div className="text-sm">
            <div className="mb-2">
              <span className="font-medium">Status:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                response.status >= 200 && response.status < 300 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {response.status}
              </span>
            </div>
            
            {response.error && (
              <div className="mb-2 text-red-600">
                <span className="font-medium">Error:</span> {response.error}
              </div>
            )}
            
            {response.data && (
              <div>
                <span className="font-medium">Response:</span>
                <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiTestingBox; 