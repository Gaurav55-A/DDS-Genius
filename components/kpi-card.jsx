'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function KPICard({ title, value, description, icon: Icon, progress, color = 'yellow', trend }) {
  const colorMap = {
    yellow: {
      icon: 'icon-glow-yellow',
      iconColor: 'text-electric-yellow',
      progressBg: 'bg-electric-yellow',
      border: 'border-electric-yellow/20'
    },
    blue: {
      icon: 'icon-glow-blue',
      iconColor: 'text-electric-blue',
      progressBg: 'bg-electric-blue',
      border: 'border-electric-blue/20'
    },
    teal: {
      icon: 'icon-glow-teal',
      iconColor: 'text-neon-teal',
      progressBg: 'bg-neon-teal',
      border: 'border-neon-teal/20'
    },
    rose: {
      icon: 'icon-glow-rose',
      iconColor: 'text-bright-rose',
      progressBg: 'bg-bright-rose',
      border: 'border-bright-rose/20'
    },
    amber: {
      icon: 'bg-vivid-amber/10',
      iconColor: 'text-vivid-amber',
      progressBg: 'bg-vivid-amber',
      border: 'border-vivid-amber/20'
    }
  };

  const colors = colorMap[color] || colorMap.yellow;

  return (
    <Card className={cn('border-minimal hover:shadow-lg transition-all duration-200', colors.border)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium font-body">
          {title}
        </CardTitle>
        {Icon && (
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', colors.icon)}>
            <Icon className={cn('h-5 w-5', colors.iconColor)} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-heading">{value}</div>
        <p className="text-xs text-muted-foreground mt-1 font-body">
          {description}
        </p>
        {progress !== undefined && (
          <div className="mt-3 space-y-1">
            <Progress value={progress} className="h-1.5" indicatorClassName={colors.progressBg} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
          </div>
        )}
        {trend && (
          <p className="text-xs mt-2 font-medium" style={{ color: trend > 0 ? '#2DD4BF' : '#FB7185' }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last report
          </p>
        )}
      </CardContent>
    </Card>
  );
}
