'use client'
import { motion } from 'framer-motion'

interface ChartData {
  name: string
  value: number
  color: string
  unit?: string
}

interface HorizontalChartProps {
  data: ChartData[]
}

export function HorizontalChart({ data }: HorizontalChartProps) {
  const maxValue = Math.max(...data.map(d => d.value))

  return (
    <div className="space-y-6">
      {data.map((item, index) => (
        <div key={index} className="relative group">
          {/* Label */}
          <div className="flex justify-between text-xs mb-1.5 text-gray-600 font-medium">
            <span className="truncate max-w-[70%]">{item.name}</span>
            <span className="text-gray-400">
              {item.value.toLocaleString('vi-VN')} {item.unit}
            </span>
          </div>

          {/* Bar Container */}
          <div className="h-9 w-full bg-gray-100 rounded-md relative overflow-hidden">
            {/* Animated Bar */}
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${(item.value / maxValue) * 100}%` }}
              transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
              className={`h-full ${item.color} rounded-md flex items-center justify-end pr-3 shadow-sm`}
              suppressHydrationWarning
            >
              {/* Show value inside bar if wide enough */}
              {item.value / maxValue > 0.2 && (
                <span className="text-white text-xs font-semibold whitespace-nowrap">
                  {item.value.toLocaleString('vi-VN')} {item.unit}
                </span>
              )}
            </motion.div>

            {/* Grid lines */}
            <div className="absolute inset-0 flex pointer-events-none">
              <div className="flex-1 border-r border-dashed border-gray-200" />
              <div className="flex-1 border-r border-dashed border-gray-200" />
              <div className="flex-1 border-r border-dashed border-gray-200" />
              <div className="flex-1" />
            </div>
          </div>
        </div>
      ))}

      {/* X-Axis Scale */}
      <div className="flex justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-100 mt-2">
        <span>0</span>
        <span>{(maxValue * 0.25).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}</span>
        <span>{(maxValue * 0.5).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}</span>
        <span>{(maxValue * 0.75).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}</span>
        <span>{maxValue.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}</span>
      </div>
    </div>
  )
}
