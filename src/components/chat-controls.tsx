import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { ConfigurationFormDrawer } from "@/components/configuration-form-drawer";

interface ChatControlsProps {
  showEditButton: boolean;
  isEditingInstructions: boolean;
  onToggleEdit: () => void;
}

export function ChatControls({
  showEditButton,
  isEditingInstructions,
  onToggleEdit,
}: ChatControlsProps) {
  return (
    <div className="absolute top-4 right-4 flex justify-end">
      <div className="flex gap-2">
        <ConfigurationFormDrawer>
          <Button
            variant="outline"
            size="newSize"
            className="text-neutral-50 bg-white-500 bg-opacity-100"
          >
            <Settings className="h-10 w-10 text-black opacity-60" />
          </Button>
        </ConfigurationFormDrawer>
      </div>
      {/* <div className="flex gap-2">
        {showEditButton && (
          <Button variant="outline" size="icon" onClick={onToggleEdit}>
            {isEditingInstructions ? (
              <AudioLines className="h-4 w-4" />
            ) : (
              <Edit className="h-4 w-4" />
            )}
          </Button>
        )}
      </div> */}
    </div>
  );
}
