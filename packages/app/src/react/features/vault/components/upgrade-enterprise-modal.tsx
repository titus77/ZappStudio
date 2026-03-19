import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@src/react/shared/components/ui/dialog';

interface UpgradeEnterpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeEnterpriseModal({ isOpen, onClose }: UpgradeEnterpriseModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Passer à l'offre Enterprise</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>Mise à niveau vers l'offre Enterprise à configurer ici</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
