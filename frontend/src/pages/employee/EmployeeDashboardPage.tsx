import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBroom,
  faWrench,
  faClipboardCheck,
  faTriangleExclamation,
  faDoorOpen,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import { getEmployeeKpis, type EmployeeKpis } from '../../api/employeeApi';
import { KpiCard } from '../../components/ui/KpiCard';
import Alert from '../../components/ui/Alert';
import { useAuthStore } from '../../store/authStore';

export default function EmployeeDashboardPage() {
  const navigate = useNavigate();
  const { fullName } = useAuthStore();
  const [kpis, setKpis] = useState<EmployeeKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await getEmployeeKpis();
        if (!cancelled && res.success) setKpis(res.data);
      } catch {
        if (!cancelled) setError('Không tải được KPI. Vui lòng thử lại.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <EmployeeLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-[28px] font-bold text-[#1E293B]">
            Xin chào, {fullName || 'Nhân viên'}
          </h1>
          <p className="body-sm text-charcoal mt-1 capitalize">{today}</p>
        </div>

        {error && (
          <Alert variant="error" message={error} closeable onClose={() => setError(null)} />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {loading && !kpis ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[120px] bg-[#F1F5F9] rounded-[16px] animate-pulse" />
            ))
          ) : (
            <>
              <button type="button" onClick={() => navigate('/employee/housekeeping')} className="text-left">
                <KpiCard title="Dọn phòng chờ" value={kpis?.pendingHousekeeping ?? 0} icon={faBroom} />
              </button>
              <button type="button" onClick={() => navigate('/employee/maintenance')} className="text-left">
                <KpiCard title="Bảo trì chờ" value={kpis?.pendingMaintenance ?? 0} icon={faWrench} />
              </button>
              <button type="button" onClick={() => navigate('/employee/inspections')} className="text-left">
                <KpiCard title="Kiểm tra phòng" value={kpis?.pendingInspections ?? 0} icon={faClipboardCheck} />
              </button>
            </>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-[#1E293B] mb-3">Thao tác nhanh</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { to: '/employee/housekeeping', icon: faBroom, label: 'Housekeeping', desc: 'Danh sách tác vụ dọn phòng' },
              { to: '/employee/maintenance', icon: faWrench, label: 'Maintenance', desc: 'Yêu cầu sửa chữa được giao' },
              { to: '/employee/inspections', icon: faClipboardCheck, label: 'Inspections', desc: 'Kiểm tra phòng trước check-out' },
              { to: '/employee/damage', icon: faTriangleExclamation, label: 'Damage Reports', desc: 'Xem báo cáo hư hại của bạn' },
              { to: '/employee/damage/create', icon: faPlus, label: 'Tạo báo cáo hư hại', desc: 'Ghi nhận hư hại mới' },
              { to: '/employee/rooms', icon: faDoorOpen, label: 'Danh sách phòng', desc: 'Xem trạng thái phòng' },
            ].map(link => (
              <Link key={link.to} to={link.to} className="no-underline">
                <div
                  className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 h-full transition-all duration-150 hover:border-[#0F766E] hover:shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center mb-3">
                    <FontAwesomeIcon icon={link.icon} />
                  </div>
                  <p className="font-semibold text-[15px] text-[#1E293B] mb-1">{link.label}</p>
                  <p className="body-sm text-charcoal">{link.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
