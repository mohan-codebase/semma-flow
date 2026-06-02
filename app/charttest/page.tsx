'use client';

// TEMPORARY verification page — delete after confirming the weekly chart renders.
import { motion } from 'framer-motion';
import WeeklyReportChart from '@/components/dashboard/WeeklyReportChart';

const data = [
  { date: '2026-05-25', label: 'Mon', dayNum: 25, pct: 0,  isToday: false },
  { date: '2026-05-26', label: 'Tue', dayNum: 26, pct: 0,  isToday: false },
  { date: '2026-05-27', label: 'Wed', dayNum: 27, pct: 0,  isToday: false },
  { date: '2026-05-28', label: 'Thu', dayNum: 28, pct: 0,  isToday: false },
  { date: '2026-05-29', label: 'Fri', dayNum: 29, pct: 0,  isToday: false },
  { date: '2026-05-30', label: 'Sat', dayNum: 30, pct: 50, isToday: false },
  { date: '2026-05-31', label: 'Sun', dayNum: 31, pct: 0,  isToday: true  },
];

export default function ChartTest() {
  return (
    <div style={{ padding: 24, background: '#f2f2f2', minHeight: '100vh' }}>
      {/* Replicate the dashboard's animating wrapper */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 480 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800 }}>Weekly report</h2>
        <div style={{ background: '#fff', borderRadius: 20, padding: '18px 12px 12px', marginTop: 8 }}>
          <WeeklyReportChart data={data} avg={7} color="#555555" />
        </div>
        <div style={{ background: '#fff', borderRadius: 20, padding: '18px 12px 12px', marginTop: 16 }}>
          <WeeklyReportChart data={data} avg={7} color="#747474" />
        </div>
      </motion.div>
    </div>
  );
}
