import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  CheckCheck,
  ThermometerSnowflake,
} from "lucide-react";

const iconMap = {
  green: <CheckCircle className="text-green-500 w-8 h-8" />,
  blue: <CheckCheck className="text-blue-500 w-8 h-8" />,
  yellow: <Clock className="text-yellow-500 w-8 h-8" />,
  total: <ThermometerSnowflake className="text-yellow-500 w-8 h-8" />,
};

const Card = ({
  label,
  count,
  color = "blue",
  duration = 1000,
  project_id,
  handleNavigateOfCard,
}) => {
  const [currentCount, setCurrentCount] = useState(0);

  useEffect(() => {
    const end = parseInt(count, 10);
    const startTime = performance.now();

    const step = (timestamp) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      if (progress < 1) {
        setCurrentCount(Math.floor(progress * end));
        requestAnimationFrame(step);
      } else {
        setCurrentCount(end); // Ensure it ends at exact count
      }
    };

    requestAnimationFrame(step);
  }, [count, duration]);

  return (
    <div
      onClick={() => handleNavigateOfCard(project_id, label)}
      className="cursor-pointer dark:bg-custom-bg flex items-center justify-between bg-white rounded-lg shadow-xl p-5 hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex items-center space-x-4">
        <div className="bg-gray-100 rounded-full p-3 dark:text-white">
          {iconMap[color] || iconMap.blue}
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-white font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {currentCount.toLocaleString() }
          </p>
        </div>
      </div>
    </div>
  );
};

export default Card;
