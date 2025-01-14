import React from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { DEFAULT_INITIAL_INVESTMENT, WINNING_GOAL } from '@/lib/constants';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const handleClose = () => {
    localStorage.setItem('tutorialComplete', 'true');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="glass-card rounded-xl p-6 max-w-lg w-full mx-4">
        <h3 className="text-xl font-bold mb-4">Welcome to Stock Trading Simulator!</h3>
        <div className="space-y-4">
          <p>👋 Here's how to get started:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>You start with ${DEFAULT_INITIAL_INVESTMENT.toLocaleString()}</li>
            <li>Your goal is to reach ${WINNING_GOAL.toLocaleString()}</li>
            <li>Buy and sell stocks to grow your portfolio</li>
            <li>Unlock achievements as you progress</li>
            <li>Track your performance with real-time updates</li>
          </ul>
          <div className="space-y-2">
            <h4 className="font-semibold">Trading Tips:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Diversify your portfolio to manage risk</li>
              <li>Watch for price trends before making decisions</li>
              <li>Start with small trades to learn the mechanics</li>
              <li>Use the charts to analyze price movements</li>
            </ul>
          </div>
          <Button
            onClick={handleClose}
            className="w-full mt-4"
          >
            Got it!
          </Button>
        </div>
      </div>
    </Modal>
  );
};
