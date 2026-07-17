import { Navigate, useParams } from 'react-router-dom';

/** SCR-49 — redirect về form edit (đã gộp gán Manager). */
export function ManagerAssignmentPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/admin/properties" replace />;
  return <Navigate to={`/admin/properties/${id}/edit`} replace />;
}
