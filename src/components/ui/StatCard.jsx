export const StatCard = ({ label, value, icon, trend }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <p className="text-3xl font-bold text-brand-green">{value}</p>
      {trend && <p className="text-xs text-gray-500 mt-2">{trend}</p>}
    </div>
  );
};
