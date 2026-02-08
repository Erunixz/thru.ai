import { Eye, Clock, ChefHat, CheckCircle } from 'lucide-react';

export default function KitchenBottomBar({ orderStats, revenue, onViewOrders }) {
  return (
    <div className="h-20 bg-white border-t border-slate-200 flex items-center px-6 gap-6 shadow-lg">
      {/* Order Stats Badges */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg">
          <Clock size={18} />
          <div>
            <div className="text-xs font-medium text-blue-600">Waiting</div>
            <div className="text-lg font-bold">{orderStats.waiting}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg">
          <ChefHat size={18} />
          <div>
            <div className="text-xs font-medium text-yellow-600">Preparing</div>
            <div className="text-lg font-bold">{orderStats.preparing}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
          <CheckCircle size={18} />
          <div>
            <div className="text-xs font-medium text-green-600">Ready</div>
            <div className="text-lg font-bold">{orderStats.ready}</div>
          </div>
        </div>
      </div>

      {/* Revenue */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm font-medium text-slate-600">Total Revenue</div>
          <div className="text-2xl font-bold text-orange-500">
            ${revenue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* View Orders Button */}
      <button
        onClick={onViewOrders}
        className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors shadow-md"
      >
        <Eye size={20} />
        View All Orders
        {(orderStats.waiting + orderStats.preparing + orderStats.ready) > 0 && (
          <span className="ml-2 px-2 py-1 bg-white text-orange-500 rounded-full text-sm font-bold">
            {orderStats.waiting + orderStats.preparing + orderStats.ready}
          </span>
        )}
      </button>
    </div>
  );
}
