import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Activity,
    Heart,
    Thermometer,
    ArrowRight,
    Sparkles,
    CheckCircle,
    AlertTriangle,
    Lightbulb,
    Loader2,
    TrendingUp,
    Scale,
    Calendar,
    Droplet
} from 'lucide-react';

interface AnalysisResult {
    risk_level: 'Healthy' | 'Warning' | 'Critical';
    vitals_detected: {
        bp: string | null;
        sugar: number | null;
        heart_rate: number | null;
        weight?: number | null;
        height?: number | null;
        age?: number | null;
        blood_group?: string | null;
    };
}

interface FullAnalysisResponse {
    prediction: AnalysisResult;
    detailed_analysis: string;
    tips: string[];
    follow_up_prompt: string;
}

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface TrendPoint {
    date: string;
    systolic: number | null;
    diastolic: number | null;
    sugar: number | null;
    heart_rate: number | null;
    weight: number | null;
}

export function Analysis() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [patientId, setPatientId] = useState<string | null>(null);
    const [data, setData] = useState<FullAnalysisResponse | null>(null);
    const [trends, setTrends] = useState<TrendPoint[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getPatientId = async () => {
            if (!user?.id) return;
            const { data } = await supabase
                .from('patients')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (data) setPatientId(data.id);
        };
        getPatientId();
    }, [user]);

    const runAnalysis = async () => {
        if (!patientId) {
            setError("Patient profile not found. Please complete your profile first.");
            return;
        }
        setLoading(true);
        setError(null);
        setData(null);
        setTrends([]);

        try {
            // Run analysis and trends fetch in parallel
            const [analysisRes, trendsRes] = await Promise.all([
                fetch('http://127.0.0.1:8000/analyze_health', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: patientId })
                }),
                fetch('http://127.0.0.1:8000/health_trends', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: patientId })
                })
            ]);

            const analysisJson = await analysisRes.json();
            const trendsJson = await trendsRes.json();

            if (analysisJson.success) {
                setData(analysisJson);
            } else {
                throw new Error(analysisJson.error || "Analysis failed");
            }

            if (trendsJson.success) {
                // Format dates for display
                const formattedTrends = trendsJson.timeline.map((t: any) => ({
                    ...t,
                    displayDate: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                }));
                setTrends(formattedTrends);
            }

        } catch (err: any) {
            setError(err.message || "Could not connect to the AI engine.");
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'Healthy': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'Warning': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'Critical': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden font-sans">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-teal-400/10 rounded-full blur-3xl -z-10" />

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold font-heading mb-2 flex items-center gap-3">
                        <Sparkles className="text-primary w-8 h-8" />
                        AI Health Insight
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Deep predictive analysis based on your complete medical history.
                    </p>
                </div>

                {!data && !loading && (
                    <Card className="glass-card text-center py-16">
                        <CardContent>
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Activity className="w-10 h-10 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold mb-4">Ready to analyze your records?</h2>
                            <p className="text-muted-foreground max-w-md mx-auto mb-8">
                                Our AI will scan all your uploaded documents, extracting vital signs, and visualizing trends over time.
                            </p>
                            <Button
                                size="lg"
                                onClick={runAnalysis}
                                className="gradient-primary text-lg px-8 h-12 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                            >
                                Start Comprehensive Analysis
                            </Button>
                            {error && <p className="text-destructive mt-4">{error}</p>}
                        </CardContent>
                    </Card>
                )}

                {loading && (
                    <div className="text-center py-20">
                        <div className="relative w-24 h-24 mx-auto mb-8">
                            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <Activity className="absolute inset-0 m-auto text-primary w-8 h-8 animate-pulse" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Analyzing Health Records...</h3>
                        <p className="text-muted-foreground">Extracting vitals, plotting trends, and generating insights.</p>
                    </div>
                )}

                {data && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Top Row: Risk & Vitals */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Risk Card */}
                            <Card className={`border-2 ${getRiskColor(data.prediction.risk_level)}`}>
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div>
                                        <div className="text-sm uppercase font-bold tracking-wider opacity-80 mb-1">Risk Assessment</div>
                                        <div className="text-4xl font-bold">{data.prediction.risk_level}</div>
                                    </div>
                                    {data.prediction.risk_level === 'Healthy' ? <CheckCircle className="w-16 h-16 opacity-80" /> : <AlertTriangle className="w-16 h-16 opacity-80" />}
                                </CardContent>
                            </Card>

                            {/* Vitals Summary */}
                            <Card className="glass-card">
                                <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-2 text-center items-center justify-center">
                                    <div className="flex flex-col items-center">
                                        <Heart className="w-5 h-5 text-rose-500 mb-1" />
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">BP</div>
                                        <div className="font-bold text-base">{data.prediction.vitals_detected.bp || "--"}</div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <Thermometer className="w-5 h-5 text-blue-500 mb-1" />
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Sugar</div>
                                        <div className="font-bold text-base">{data.prediction.vitals_detected.sugar || "--"}</div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <Activity className="w-5 h-5 text-emerald-500 mb-1" />
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Heart Rate</div>
                                        <div className="font-bold text-base">{data.prediction.vitals_detected.heart_rate || "--"}</div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <Scale className="w-5 h-5 text-amber-500 mb-1" />
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Weight</div>
                                        <div className="font-bold text-base">{data.prediction.vitals_detected.weight ? data.prediction.vitals_detected.weight + ' kg' : "--"}</div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <Calendar className="w-5 h-5 text-purple-500 mb-1" />
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Age</div>
                                        <div className="font-bold text-base">{data.prediction.vitals_detected.age ? data.prediction.vitals_detected.age + ' yrs' : "--"}</div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <Droplet className="w-5 h-5 text-red-600 mb-1" />
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Blood Grp</div>
                                        <div className="font-bold text-base">{data.prediction.vitals_detected.blood_group || "--"}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Trends Graph */}
                        {trends.length > 0 && (
                            <Card className="glass-card">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-xl flex items-center gap-2">
                                            <TrendingUp className="w-6 h-6 text-primary" />
                                            Health Trends Analysis
                                        </h3>
                                        <div className="flex gap-4 text-xs font-semibold">
                                            <div className="flex items-center gap-1.5 glass bg-white/50 px-3 py-1 rounded-full border border-red-200 text-red-700">
                                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> BP
                                            </div>
                                            <div className="flex items-center gap-1.5 glass bg-white/50 px-3 py-1 rounded-full border border-blue-200 text-blue-700">
                                                <div className="w-2 h-2 rounded-full bg-blue-500" /> Sugar
                                            </div>
                                            <div className="flex items-center gap-1.5 glass bg-white/50 px-3 py-1 rounded-full border border-emerald-200 text-emerald-700">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Heart Rate
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-[400px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={trends} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorBP" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="colorSugar" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id="colorHR" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                                <XAxis
                                                    dataKey="displayDate"
                                                    stroke="#64748b"
                                                    fontSize={12}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    dy={10}
                                                />
                                                <YAxis
                                                    stroke="#64748b"
                                                    fontSize={12}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    dx={-10}
                                                />
                                                <Tooltip
                                                    content={({ active, payload, label }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-border/50 text-sm">
                                                                    <p className="font-bold mb-2 text-primary border-b border-border pb-1">{label}</p>
                                                                    {payload.map((entry: any) => (
                                                                        <div key={entry.name} className="flex items-center justify-between gap-6 py-1">
                                                                            <span className="flex items-center gap-2 text-muted-foreground capitalize">
                                                                                <div
                                                                                    className="w-2 h-2 rounded-full"
                                                                                    style={{ backgroundColor: entry.color }}
                                                                                />
                                                                                {entry.name}:
                                                                            </span>
                                                                            <span className="font-bold font-mono text-foreground">
                                                                                {entry.value}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Legend wrapperStyle={{ paddingTop: "20px" }} />

                                                <Area
                                                    type="monotone"
                                                    dataKey="systolic"
                                                    name="Suffering BP (Sys)"
                                                    stroke="#ef4444"
                                                    fillOpacity={1}
                                                    fill="url(#colorBP)"
                                                    strokeWidth={3}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="sugar"
                                                    name="Sugar Lvl"
                                                    stroke="#3b82f6"
                                                    fillOpacity={1}
                                                    fill="url(#colorSugar)"
                                                    strokeWidth={3}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="heart_rate"
                                                    name="Heart Rate"
                                                    stroke="#10b981"
                                                    fillOpacity={1}
                                                    fill="url(#colorHR)"
                                                    strokeWidth={3}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <p className="text-sm text-muted-foreground text-center mt-4 bg-slate-100/50 py-2 rounded-lg mx-auto max-w-md border border-slate-200/50">
                                        💡 Tip: Consistent monitoring helps detects subtle health changes early.
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* AI Insight Report */}
                        <Card className="glass-card overflow-hidden">
                            <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 border-b border-primary/10 flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-primary" />
                                <h3 className="font-bold text-lg">AI Health Report</h3>
                            </div>
                            <CardContent className="p-6">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        // Headers
                                        h3: ({ node, ...props }) => (
                                            <h3 className="text-lg font-bold text-primary mt-6 mb-3 flex items-center gap-2 border-b border-primary/10 pb-2" {...props} />
                                        ),
                                        // Unordered Lists - Remove default styling
                                        ul: ({ node, ...props }) => (
                                            <ul className="space-y-3 list-none pl-0 my-2" {...props} />
                                        ),
                                        // List Items - The "WhatsApp Block" look
                                        li: ({ node, ...props }) => (
                                            <li className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-tr-xl rounded-bl-xl rounded-br-xl rounded-tl-sm border border-border/50 shadow-sm relative ml-2 text-sm leading-relaxed flex gap-2" {...props}>
                                                <span className="text-primary mt-1">•</span>
                                                <span>{props.children}</span>
                                            </li>
                                        ),
                                        // Remove paragraph margins inside lists
                                        p: ({ node, ...props }) => (
                                            <p className="mb-2 last:mb-0" {...props} />
                                        ),
                                        strong: ({ node, ...props }) => (
                                            <strong className="font-bold text-primary" {...props} />
                                        )
                                    }}
                                >
                                    {data.detailed_analysis}
                                </ReactMarkdown>
                            </CardContent>
                        </Card>

                        {/* Actionable Tips */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {data.tips.map((tip, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + (i * 0.1) }}
                                    className="bg-white/80 dark:bg-slate-900/50 p-4 rounded-xl border border-border/50 shadow-sm flex gap-3"
                                >
                                    <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Lightbulb className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="text-sm font-medium leading-tight">
                                        <ReactMarkdown
                                            components={{
                                                p: ({ node, ...props }) => <span {...props} />,
                                                strong: ({ node, ...props }) => <span className="font-bold text-primary" {...props} />
                                            }}
                                        >
                                            {tip}
                                        </ReactMarkdown>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="text-center pt-8">
                            <p className="text-muted-foreground mb-4 font-medium italic">"{data.follow_up_prompt}"</p>
                            <Button variant="outline" onClick={() => setData(null)}>Run New Analysis</Button>
                        </div>

                    </motion.div>
                )}
            </div>
        </div>
    );
}