'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function IssueDistributionChart({ data }) {
  const chartData = Object.entries(data || {}).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue Distribution</CardTitle>
        <CardDescription>Types of defects found across all inspections</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function TemperatureAnalysisChart({ data }) {
  const chartData = (data?.readings || []).map((reading, index) => ({
    area: reading.area || `Area ${index + 1}`,
    hotspot: reading.hotspot || 0,
    coldspot: reading.coldspot || 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Temperature Analysis</CardTitle>
        <CardDescription>Thermal readings across different areas</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="area" />
            <YAxis label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="hotspot" fill="#FF8042" name="Hotspot" />
            <Bar dataKey="coldspot" fill="#0088FE" name="Coldspot" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function SummaryStats({ analytics }) {
  const stats = [
    {
      title: 'Total Areas Inspected',
      value: analytics?.totalAreas || 0,
      description: 'Distinct areas analyzed',
      color: 'bg-blue-500'
    },
    {
      title: 'Total Defects Found',
      value: analytics?.totalDefects || 0,
      description: 'Issues identified',
      color: 'bg-orange-500'
    },
    {
      title: 'Avg Hotspot Temp',
      value: `${(analytics?.temperatureStats?.avgHotspot || 0).toFixed(1)}°C`,
      description: 'Average maximum temperature',
      color: 'bg-red-500'
    },
    {
      title: 'Avg Coldspot Temp',
      value: `${(analytics?.temperatureStats?.avgColdspot || 0).toFixed(1)}°C`,
      description: 'Average minimum temperature',
      color: 'bg-cyan-500'
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <div className={`h-4 w-4 rounded-full ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SeverityChart({ data }) {
  const chartData = Object.entries(data || { Minor: 0, Moderate: 0, Severe: 0 }).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Severity Distribution</CardTitle>
        <CardDescription>Classification of issues by severity</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" name="Count" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
