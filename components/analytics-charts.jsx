'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Vibrant Industrial Color Palette
const VIBRANT_COLORS = ['#FACC15', '#3B82F6', '#2DD4BF', '#A78BFA', '#F59E0B', '#FB7185'];

export function IssueDistributionChart({ data }) {
  const chartData = Object.entries(data || {}).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <Card className="border-minimal">
      <CardHeader>
        <CardTitle className="font-heading">Issue Distribution</CardTitle>
        <CardDescription className="font-body">Types of defects found across all inspections</CardDescription>
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
                <Cell key={`cell-${index}`} fill={VIBRANT_COLORS[index % VIBRANT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
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
    <Card className="border-minimal">
      <CardHeader>
        <CardTitle className="font-heading">Temperature Analysis</CardTitle>
        <CardDescription className="font-body">Thermal readings across different areas</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="area" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif' }}
            />
            <YAxis 
              label={{ 
                value: 'Temperature (°C)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fontFamily: 'Inter, sans-serif' }
              }}
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontFamily: 'Inter, sans-serif'
              }}
            />
            <Legend 
              wrapperStyle={{ 
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px'
              }}
            />
            <Bar dataKey="hotspot" fill="#F59E0B" name="Hotspot" radius={[4, 4, 0, 0]} />
            <Bar dataKey="coldspot" fill="#3B82F6" name="Coldspot" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function SeverityChart({ data }) {
  const chartData = Object.entries(data || { Minor: 0, Moderate: 0, Severe: 0 }).map(([name, value]) => ({
    name,
    value
  }));

  const severityColors = {
    'Minor': '#2DD4BF',
    'Moderate': '#F59E0B', 
    'Severe': '#FB7185'
  };

  return (
    <Card className="border-minimal">
      <CardHeader>
        <CardTitle className="font-heading">Severity Distribution</CardTitle>
        <CardDescription className="font-body">Classification of issues by severity</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px', fontFamily: 'Inter, sans-serif' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontFamily: 'Inter, sans-serif'
              }}
            />
            <Legend 
              wrapperStyle={{ 
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px'
              }}
            />
            <Bar dataKey="value" fill="#8884d8" name="Count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={severityColors[entry.name] || '#8884d8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
