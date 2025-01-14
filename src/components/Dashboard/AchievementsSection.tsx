import React from 'react';
import { ACHIEVEMENTS } from '@/lib/constants';

interface AchievementsSectionProps {
  unlockedAchievements: string[];
}

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({ 
  unlockedAchievements 
}) => {
  return (
    <div className="glass-card glow rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4">Achievements</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {ACHIEVEMENTS.map(achievement => {
          const isUnlocked = unlockedAchievements.includes(achievement.id);
          return (
            <div 
              key={achievement.id}
              className={`glass-card p-4 rounded-lg transition-all duration-300 ${
                isUnlocked ? 'bg-white/20' : 'opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{achievement.icon}</span>
                <div>
                  <h4 className="font-bold">{achievement.name}</h4>
                  <p className="text-sm text-gray-400">{achievement.description}</p>
                  {isUnlocked && (
                    <span className="text-xs text-green-400 mt-1 block">
                      ✨ Unlocked!
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
