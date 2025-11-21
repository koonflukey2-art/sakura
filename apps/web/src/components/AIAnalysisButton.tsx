'use client';

import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';

interface AIAnalysisButtonProps {
  page: string;
  action: string;
  data: any;
  buttonText: string;
  onSuccess?: (response: string) => void;
}

export function AIAnalysisButton({
  page,
  action,
  data,
  buttonText,
  onSuccess
}: AIAnalysisButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setResult('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/ai/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          provider: 'gemini',
          page,
          action,
          payload: data
        })
      });

      const result = await response.json();
      if (response.ok) {
        setResult(result.response);
        setShowModal(true);
        onSuccess?.(result.response);
      } else {
        setResult(`Error: ${result.error || 'เกิดข้อผิดพลาด'}`);
        setShowModal(true);
      }
    } catch (error) {
      setResult('ไม่สามารถเชื่อมต่อ AI ได้');
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
      >
        <Sparkles className="w-4 h-4" />
        {loading ? 'กำลังวิเคราะห์...' : buttonText}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                ผลการวิเคราะห์จาก AI
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {result}
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
