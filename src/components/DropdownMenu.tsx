import { Edit, Trash2 } from "lucide-react";
import { MouseEvent } from "react";

interface DropdownMenuProps {
  onEdit: (e?: MouseEvent) => void;
  onDelete: (e?: MouseEvent) => void;
  onClose?: () => void;
  className?: string;
  showDelete?: boolean;
}

const DropdownMenu = ({ 
  onEdit, 
  onDelete, 
  onClose,
  className = "",
  showDelete = true
}: DropdownMenuProps) => {
  return (
    <div 
      className={`w-48 bg-white rounded-md shadow-lg border border-gray-200 ${className}`}
      onClick={e => e.stopPropagation()}
    >
      <div className="py-1">
        <button
          onClick={onEdit}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <Edit size={14} className="mr-2" />
          Edit
        </button>
        {showDelete && (
          <button
            onClick={onDelete}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} className="mr-2" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default DropdownMenu; 