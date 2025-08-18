"use client";

import { useState } from 'react';

interface ApiResponse {
  status: number;
  data: any;
  error?: string;
}

const ApiTestingBox = () => {
  // === DEVELOPMENT ONLY - Hide in production ===
  if (process.env.NEXT_PUBLIC_APP_ENV !== 'development') {
    return null;
  }

  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [claudeLoading, setClaudeLoading] = useState(false);
  const [directClaudeLoading, setDirectClaudeLoading] = useState(false);
  const [endpoint, setEndpoint] = useState('/api/test');
  const [claudeMessage, setClaudeMessage] = useState('Hello Claude! Tell me a brief fun fact about productivity.');

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
      const res = await fetch(`/api/mind-fuel`, {
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
      setClaudeLoading(false);
    }
  };

  const testDirectClaudeAPI = async () => {
    setDirectClaudeLoading(true);
    setResponse(null);
    
    try {
      const res = await fetch('/api/claude-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: claudeMessage,
          model: 'claude-3-5-sonnet-20241022'
        }),
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
      setDirectClaudeLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 w-full max-w-md mx-auto" style={{ minHeight: '400px', minWidth: '350px' }}>
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
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-md transition duration-200 mb-4"
      >
        {claudeLoading ? 'Generating Mind Fuel...' : 'Test Claude API - Mind Fuel'}
      </button>

      <div className="mb-4 border-t pt-4">
        <label htmlFor="claudeMessage" className="block text-sm font-medium text-gray-700 mb-2">
          Direct Claude API Message:
        </label>
        <textarea
          id="claudeMessage"
          value={claudeMessage}
          onChange={(e) => setClaudeMessage(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Enter your message for Claude..."
          rows={3}
        />
      </div>
      
      <button
        onClick={testDirectClaudeAPI}
        disabled={directClaudeLoading}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-medium py-2 px-4 rounded-md transition duration-200 mb-4"
      >
        {directClaudeLoading ? '🤖 Asking Claude...' : '🤖 Direct Claude API Call'}
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
                {/* Show just the response text for direct Claude API calls */}
                {response.data.success && response.data.response ? (
                  <div>
                    <span className="font-medium">Claude's Response:</span>
                    <div className="mt-1 text-sm bg-white p-3 rounded border leading-relaxed">
                      {response.data.response}
                    </div>
                    {response.data.usage && (
                      <div className="mt-2 text-xs text-gray-500">
                        Tokens: {response.data.usage.input_tokens} in, {response.data.usage.output_tokens} out
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <span className="font-medium">Response:</span>
                    <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiTestingBox; 