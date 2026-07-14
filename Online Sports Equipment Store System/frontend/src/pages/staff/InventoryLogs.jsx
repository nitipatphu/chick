import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History, ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';

export default function InventoryLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getLogs();
      setLogs(data);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    (log.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.reason || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-sports-dark flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sports-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sports-dark text-white pt-20 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
            <History className="text-sports-red" />
            ประวัติความเคลื่อนไหวสต็อก (Inventory Logs)
          </h1>
          <Link to="/staff" className="text-sports-red hover:text-red-400 text-sm">
            &larr; กลับหน้าหลัก Staff
          </Link>
        </div>

        {/* Search */}
        <div className="glass-card mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหาประวัติด้วยชื่อสินค้า หรือ สาเหตุ..."
              className="w-full bg-gray-900 border border-gray-800 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-sports-red transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Logs List */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/40 border-b border-gray-800">
                  <th className="p-4 font-bold text-gray-400">วันที่ / เวลา</th>
                  <th className="p-4 font-bold text-gray-400">สินค้า</th>
                  <th className="p-4 font-bold text-gray-400">การเปลี่ยนแปลง</th>
                  <th className="p-4 font-bold text-gray-400">สาเหตุ / ออเดอร์</th>
                  <th className="p-4 font-bold text-gray-400">อัปเดตโดย</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-gray-300">
                      {new Date(log.timestamp).toLocaleString('th-TH')}
                    </td>
                    <td className="p-4 font-medium">{log.productName}</td>
                    <td className="p-4">
                      {log.change > 0 ? (
                        <span className="text-green-500 font-bold flex items-center gap-1">
                          <ArrowUpRight size={16} /> +{log.change}
                        </span>
                      ) : log.change < 0 ? (
                        <span className="text-red-500 font-bold flex items-center gap-1">
                          <ArrowDownRight size={16} /> {log.change}
                        </span>
                      ) : (
                        <span className="text-gray-500 font-bold">0</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-300">{log.reason}</td>
                    <td className="p-4 text-gray-400">{log.updatedBy || 'ระบบ (System)'}</td>
                  </tr>
                ))}
                
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      ไม่พบประวัติการเคลื่อนไหวของสต็อก
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
