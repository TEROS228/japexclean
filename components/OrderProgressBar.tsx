import { ShoppingCart, CheckCircle, Package, Plane } from 'lucide-react';

interface OrderProgressBarProps {
  order: any;
}

export default function OrderProgressBar({ order }: OrderProgressBarProps) {
  // Определяем этапы
  const stages = [
    { id: 1, name: 'Order Placed', Icon: ShoppingCart },
    { id: 2, name: 'Confirmed', Icon: CheckCircle },
    { id: 3, name: 'At Warehouse', Icon: Package },
    { id: 4, name: 'Shipped', Icon: Plane }
  ];

  // Определяем текущий этап на основе данных заказа
  const getCurrentStage = () => {
    // Проверяем есть ли хотя бы один item с пакетом
    const hasPackage = order.items?.some((item: any) => item.package);
    const packageItem = order.items?.find((item: any) => item.package);
    const packageStatus = packageItem?.package?.status;

    if (packageStatus === 'shipped') {
      return 4; // Shipped - финальный этап
    }
    if (hasPackage) {
      return 3; // At Warehouse (package created with status 'ready')
    }
    if (order.confirmed) {
      return 2; // Confirmed
    }
    return 1; // Order Placed
  };

  const currentStage = getCurrentStage();

  return (
    <div className="mt-4 mb-6">
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
          <div
            className="h-full bg-green-600 transition-all duration-500"
            style={{ width: `${((currentStage - 1) / (stages.length - 1)) * 100}%` }}
          />
        </div>

        {/* Stages */}
        <div className="relative flex justify-between">
          {stages.map((stage) => {
            const isCompleted = stage.id < currentStage;
            const isCurrent = stage.id === currentStage;
            const isPending = stage.id > currentStage;
            const isLastStageReached = stage.id === stages.length && isCurrent;
            const StageIcon = stage.Icon;

            return (
              <div key={stage.id} className="flex flex-col items-center">
                {/* Circle */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-300 relative z-10
                    ${isCompleted ? 'bg-green-600 text-white shadow-lg' : ''}
                    ${isCurrent && !isLastStageReached ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-200 animate-pulse' : ''}
                    ${isLastStageReached ? 'bg-green-600 text-white shadow-lg ring-4 ring-green-200' : ''}
                    ${isPending ? 'bg-gray-200 text-gray-400' : ''}
                  `}
                >
                  <StageIcon size={18} />
                </div>

                {/* Label */}
                <p
                  className={`
                    mt-2 text-xs font-medium text-center max-w-[80px]
                    ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'}
                  `}
                >
                  {stage.name}
                </p>

                {/* Date/Time for completed stages */}
                {isCompleted && (
                  <p className="mt-1 text-[10px] text-gray-400">
                    {stage.id === 1 && new Date(order.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
