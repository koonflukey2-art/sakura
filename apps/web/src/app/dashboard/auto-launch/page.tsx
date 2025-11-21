'use client';

import { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, TrendingUp, DollarSign, Rocket, Calculator, Target, Zap } from 'lucide-react';

export default function AutoLaunchPage() {
  // Campaign settings
  const [campaignData, setCampaignData] = useState({
    name: '',
    url: 'https://yourstore.co/product',
    budget: 1500,
    cpc: 12,
    conversionRate: 2.5,
    targetValue: 690,
    targetCost: 320
  });

  // Product data
  const [productData, setProductData] = useState({
    productName: '',
    category: 'Skincare',
    businessType: 'ecommerce',
    revenue: 690,
    vat: 7,
    cogs: 320,
    shippingCost: 50,
    packagingCost: 20,
    platformFee: 3
  });

  // Metrics (calculated)
  const [metrics, setMetrics] = useState({
    clicks: 0,
    orders: 0,
    grossRevenue: 0,
    totalCost: 0,
    profit: 0,
    roas: 0,
    breakEvenROAS: 0,
    maxCPC: 0,
    cpa: 0,
    profitPerOrder: 0
  });

  // Platform selection
  const [platform, setPlatform] = useState('FACEBOOK');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Auto-stop settings
  const [autoStop, setAutoStop] = useState({
    enabled: true,
    minROI: -10,
    checkInterval: 60
  });

  // Calculate metrics when inputs change
  useEffect(() => {
    const { budget, cpc, conversionRate, targetValue, targetCost } = campaignData;
    const { revenue, vat, cogs, shippingCost, packagingCost, platformFee } = productData;

    // Calculate
    const clicks = cpc > 0 ? budget / cpc : 0;
    const orders = clicks * (conversionRate / 100);
    const grossRevenue = orders * revenue;

    // Costs
    const vatAmount = grossRevenue * (vat / 100);
    const platformFeeAmount = grossRevenue * (platformFee / 100);
    const productCost = orders * cogs;
    const shipping = orders * shippingCost;
    const packaging = orders * packagingCost;
    const totalCost = budget + productCost + shipping + packaging + vatAmount + platformFeeAmount;

    // Profit
    const profit = grossRevenue - totalCost;
    const roas = budget > 0 ? grossRevenue / budget : 0;

    // Break-even calculations
    const profitPerOrder = revenue - cogs - shippingCost - packagingCost - (revenue * (vat + platformFee) / 100);
    const breakEvenROAS = profitPerOrder > 0 ? revenue / profitPerOrder : 0;
    const maxCPC = orders > 0 && conversionRate > 0 ? (profitPerOrder * conversionRate / 100) : 0;
    const cpa = orders > 0 ? budget / orders : 0;

    setMetrics({
      clicks: Math.round(clicks),
      orders: parseFloat(orders.toFixed(1)),
      grossRevenue,
      totalCost,
      profit,
      roas: parseFloat(roas.toFixed(2)),
      breakEvenROAS: parseFloat(breakEvenROAS.toFixed(2)),
      maxCPC: parseFloat(maxCPC.toFixed(2)),
      cpa: parseFloat(cpa.toFixed(2)),
      profitPerOrder: parseFloat(profitPerOrder.toFixed(2))
    });
  }, [campaignData, productData]);

  const handleLaunch = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/campaigns/auto-launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: campaignData.name || `Auto Launch - ${new Date().toLocaleDateString('th-TH')}`,
          ...campaignData,
          ...productData,
          platform,
          autoStop,
          estimatedMetrics: metrics
        })
      });

      const data = await response.json();
      setResult(data);

      if (response.ok) {
        alert('ยิงแอดสำเร็จ! แคมเปญกำลังทำงาน');
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      alert('ไม่สามารถยิงแอดได้');
    } finally {
      setLoading(false);
    }
  };

  const isProfitable = metrics.profit >= 0;
  const isGoodROAS = metrics.roas >= metrics.breakEvenROAS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Rocket className="w-8 h-8 text-blue-500" />
            ยิงแอดอัตโนมัติ
          </h1>
          <p className="text-gray-600 mt-2">กรอกข้อมูลและสั่งยิงแอด Facebook ได้ในคลิกเดียว</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Campaign Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold">
              1
            </div>
            <h2 className="text-xl font-bold">ตั้งค่าแคมเปญ</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">ชื่อแคมเปญ</label>
              <input
                type="text"
                value={campaignData.name}
                onChange={(e) => setCampaignData({...campaignData, name: e.target.value})}
                placeholder="เช่น โปรโมทสินค้าใหม่"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">URL หน้าขาย</label>
              <input
                type="url"
                value={campaignData.url}
                onChange={(e) => setCampaignData({...campaignData, url: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">งบประมาณต่อวัน (฿)</label>
              <input
                type="number"
                value={campaignData.budget}
                onChange={(e) => setCampaignData({...campaignData, budget: Number(e.target.value)})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">CPC เฉลี่ย (฿)</label>
                <input
                  type="number"
                  value={campaignData.cpc}
                  onChange={(e) => setCampaignData({...campaignData, cpc: Number(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Conversion Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={campaignData.conversionRate}
                  onChange={(e) => setCampaignData({...campaignData, conversionRate: Number(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="FACEBOOK">Facebook Ads</option>
                <option value="GOOGLE">Google Ads</option>
                <option value="TIKTOK">TikTok Ads</option>
                <option value="LINE">LINE Ads</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Product Data */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold">
              2
            </div>
            <h2 className="text-xl font-bold">ข้อมูลสินค้า</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">ชื่อสินค้า</label>
              <input
                type="text"
                value={productData.productName}
                onChange={(e) => setProductData({...productData, productName: e.target.value})}
                placeholder="เช่น ครีมกันแดด SPF50+"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">ราคาขาย (฿)</label>
                <input
                  type="number"
                  value={productData.revenue}
                  onChange={(e) => setProductData({...productData, revenue: Number(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">ต้นทุนสินค้า (฿)</label>
                <input
                  type="number"
                  value={productData.cogs}
                  onChange={(e) => setProductData({...productData, cogs: Number(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">VAT (%)</label>
                <input
                  type="number"
                  value={productData.vat}
                  onChange={(e) => setProductData({...productData, vat: Number(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">ค่าส่ง (฿)</label>
                <input
                  type="number"
                  value={productData.shippingCost}
                  onChange={(e) => setProductData({...productData, shippingCost: Number(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">ค่าแพ็ค (฿)</label>
                <input
                  type="number"
                  value={productData.packagingCost}
                  onChange={(e) => setProductData({...productData, packagingCost: Number(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">ค่าธรรมเนียม Platform (%)</label>
              <input
                type="number"
                value={productData.platformFee}
                onChange={(e) => setProductData({...productData, platformFee: Number(e.target.value)})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Auto-Stop Settings */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">Auto-Stop เมื่อขาดทุน</label>
                <input
                  type="checkbox"
                  checked={autoStop.enabled}
                  onChange={(e) => setAutoStop({...autoStop, enabled: e.target.checked})}
                  className="w-5 h-5 text-blue-500"
                />
              </div>
              {autoStop.enabled && (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">หยุดเมื่อ ROI ต่ำกว่า (%)</label>
                  <input
                    type="number"
                    value={autoStop.minROI}
                    onChange={(e) => setAutoStop({...autoStop, minROI: Number(e.target.value)})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Results & Launch */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold">
              3
            </div>
            <h2 className="text-xl font-bold">ผลลัพธ์ที่คาดการณ์</h2>
          </div>

          {/* Profit/Loss Banner */}
          <div className={`rounded-lg p-4 mb-6 ${isProfitable ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {isProfitable ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${isProfitable ? 'text-green-900' : 'text-red-900'}`}>
                {isProfitable ? 'คาดว่าจะกำไร' : 'คาดว่าจะขาดทุน'}
              </span>
            </div>
            <p className={`text-3xl font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.profit >= 0 ? '+' : ''}{metrics.profit.toLocaleString()} ฿
            </p>
            <p className={`text-sm mt-1 ${isProfitable ? 'text-green-700' : 'text-red-700'}`}>
              {metrics.orders} ออเดอร์ • กำไร/ออเดอร์ {metrics.profitPerOrder} ฿
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">คลิกที่คาด</p>
              <p className="text-xl font-bold">{metrics.clicks.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">ออเดอร์ที่คาด</p>
              <p className="text-xl font-bold">{metrics.orders}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">รายได้ที่คาด</p>
              <p className="text-xl font-bold text-green-600">{metrics.grossRevenue.toLocaleString()} ฿</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">ROAS</p>
              <p className={`text-xl font-bold ${isGoodROAS ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.roas}x
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">CPA</p>
              <p className="text-xl font-bold">{metrics.cpa} ฿</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Break-even ROAS</p>
              <p className="text-xl font-bold">{metrics.breakEvenROAS}x</p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              คำแนะนำ
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• CPC สูงสุดที่ควรจ่าย: <strong>{metrics.maxCPC} ฿</strong></li>
              <li>• ROAS ขั้นต่ำเพื่อคุ้มทุน: <strong>{metrics.breakEvenROAS}x</strong></li>
              {!isProfitable && <li className="text-red-600">• ⚠️ ควรลด CPC หรือเพิ่ม Conversion Rate</li>}
            </ul>
          </div>

          {/* Launch Button */}
          <button
            onClick={handleLaunch}
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>กำลังสร้างแคมเปญ...</>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                ยิงแอดเลย!
              </>
            )}
          </button>

          {autoStop.enabled && (
            <p className="text-xs text-center text-gray-500 mt-4">
              ระบบจะหยุดอัตโนมัติเมื่อ ROI ต่ำกว่า {autoStop.minROI}%
            </p>
          )}
        </div>
      </div>

      {/* Result Modal */}
      {result && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              ผลการสร้างแคมเปญ
            </h3>
            {result.success ? (
              <div className="bg-green-50 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-medium">สร้างแคมเปญสำเร็จ!</p>
                <p className="text-sm text-green-600 mt-1">Campaign ID: {result.campaign?.id}</p>
              </div>
            ) : (
              <div className="bg-red-50 rounded-lg p-4 mb-4">
                <p className="text-red-800">{result.error}</p>
              </div>
            )}
            <button
              onClick={() => setResult(null)}
              className="w-full bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
