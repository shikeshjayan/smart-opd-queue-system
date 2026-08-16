import { Button } from "@/components/ui/button";

type CallNextButtonProps = {
  isRunning?: boolean;
  hasWaiting?: boolean;
  onClick?: () => void;
};

export function CallNextButton({ isRunning = false, hasWaiting = false, onClick }: CallNextButtonProps) {
  return (
    <Button
      variant="primary"
      size="lg"
      className="w-full"
      disabled={isRunning || !hasWaiting}
      onClick={onClick}
    >
      {isRunning ? "Calling Patient..." : "Call Next Patient"}
    </Button>
  );
}
