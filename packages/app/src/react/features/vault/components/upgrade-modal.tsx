import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@src/react/shared/components/ui/dialog';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Améliorer l'offre</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>Amélioration de l'offre à configurer ici</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
