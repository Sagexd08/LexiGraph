import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Image,
  Users,
  Zap,
  Calendar,
  Download,
  Star,
  Activity
} from 'lucide-react';
import { GlassCard, AdvancedButton } from '../../design-system';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

interface AnalyticsData {
  totalGenerations: number;
  successRate: number;
  avgGenerationTime: number;
  popularStyles: Array<{ name: string; count: number; percentage: number }>;
  dailyStats: Array<{ date: string; generations: number; success: number }>;
  userGrowth: Array<{ date: string; users: number }>;
  performanceMetrics: {
    avgResponseTime: number;
    uptime: number;
    errorRate: number;
  };
}

interface AnalyticsDashboardProps {
  className?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    // Simulate loading analytics data
    const loadAnalytics = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data
      const mockData: AnalyticsData = {
        totalGenerations: 12847,
        successRate: 94.2,
        avgGenerationTime: 3.4,
        popularStyles: [
          { name: 'Photorealistic', count: 3421, percentage: 26.6 },
          { name: 'Artistic', count: 2876, percentage: 22.4 },
          { name: 'Anime', count: 2234, percentage: 17.4 },
          { name: 'Abstract', count: 1987, percentage: 15.5 },
          { name: 'Portrait', count: 1654, percentage: 12.9 },
        ],
        dailyStats: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          generations: Math.floor(Math.random() * 500) + 200,
          success: Math.floor(Math.random() * 50) + 180,
        })),
        userGrowth: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          users: Math.floor(Math.random() * 100) + 50 + i * 5,
        })),
        performanceMetrics: {
          avgResponseTime: 2.3,
          uptime: 99.8,
          errorRate: 0.8,
        },
      };
      
      setData(mockData);
      setLoading(false);
    };

    loadAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} variant="card" lines={2} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSkeleton variant="card" lines={8} />
          <LoadingSkeleton variant="card" lines={6} />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    {
      title: 'Total Generations',
      value: data.totalGenerations.toLocaleString(),
      icon: Image,
      color: 'from-blue-500 to-cyan-500',
      change: '+12.5%',
      changeType: 'positive' as const,
    },
    {
      title: 'Success Rate',
      value: `${data.successRate}%`,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500',
      change: '+2.1%',
      changeType: 'positive' as const,
    },
    {
      title: 'Avg Generation Time',
      value: `${data.avgGenerationTime}s`,
      icon: Clock,
      color: 'from-purple-500 to-pink-500',
      change: '-0.3s',
      changeType: 'positive' as const,
    },
    {
      title: 'Active Users',
      value: '2,847',
      icon: Users,
      color: 'from-orange-500 to-red-500',
      change: '+8.2%',
      changeType: 'positive' as const,
    },
  ];

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-neutral-400">Monitor your LexiGraph performance and usage</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className="bg-neutral-800/50 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <AdvancedButton
            variant="secondary"
            icon={<Download className="h-4 w-4" />}
            size="sm"
          >
            Export
          </AdvancedButton>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard className="p-6" variant="elevated">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stat.change}
                </span>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-neutral-400 text-sm">{stat.title}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Popular Styles */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="p-6" variant="elevated">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Popular Styles</h3>
              <BarChart3 className="h-5 w-5 text-neutral-400" />
            </div>
            
            <div className="space-y-4">
              {data.popularStyles.map((style, index) => (
                <div key={style.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500" />
                    <span className="text-white font-medium">{style.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${style.percentage}%` }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                      />
                    </div>
                    <span className="text-neutral-400 text-sm w-12 text-right">
                      {style.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard className="p-6" variant="elevated">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Performance</h3>
              <Activity className="h-5 w-5 text-neutral-400" />
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-neutral-300">Response Time</span>
                  <span className="text-white font-semibold">{data.performanceMetrics.avgResponseTime}s</span>
                </div>
                <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: '85%' }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-neutral-300">Uptime</span>
                  <span className="text-white font-semibold">{data.performanceMetrics.uptime}%</span>
                </div>
                <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    initial={{ width: 0 }}
                    animate={{ width: '99%' }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-neutral-300">Error Rate</span>
                  <span className="text-white font-semibold">{data.performanceMetrics.errorRate}%</span>
                </div>
                <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                    initial={{ width: 0 }}
                    animate={{ width: '5%' }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <GlassCard className="p-6" variant="elevated">
          <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <AdvancedButton variant="secondary" icon={<Calendar className="h-4 w-4" />}>
              Schedule Report
            </AdvancedButton>
            <AdvancedButton variant="secondary" icon={<Star className="h-4 w-4" />}>
              View Favorites
            </AdvancedButton>
            <AdvancedButton variant="secondary" icon={<Zap className="h-4 w-4" />}>
              Performance Insights
            </AdvancedButton>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default AnalyticsDashboard;
