import React from 'react';
import { useTheme } from '@frontend/contexts/ThemeContext';

interface WorkspaceColorPickerProps {
  selectedColor: string | null;
  onColorSelect: (color: string) => void;
}

const WORKSPACE_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#A855F7', // Violet
];

export default function WorkspaceColorPicker({ selectedColor, onColorSelect }: WorkspaceColorPickerProps) {
  const { theme } = useTheme();

  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
        Workspace Color
      </label>
      <div className="flex flex-wrap gap-2">
        {WORKSPACE_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onColorSelect(color)}
            className={`w-10 h-10 rounded-lg transition-all ${selectedColor === color ? 'ring-2 ring-offset-2' : 'hover:scale-110'
              }`}
            style={{
              backgroundColor: color,
            }}
            title={color}
          />
        ))}
        <button
          type="button"
          onClick={() => onColorSelect('')}
          className={`w-10 h-10 rounded-lg border-2 border-dashed transition-all flex items-center justify-center ${!selectedColor ? 'ring-2 ring-offset-2' : 'hover:scale-110'
            }`}
          style={{
            borderColor: theme.colors.border,
          }}
          title="No color"
        >
          <span style={{ color: theme.colors.textSecondary }}>×</span>
        </button>
      </div>
    </div>
  );
}

